
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Event } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, LogIn, Image as ImageIcon } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';

const LOGO_URL_GUEST_ACCESS = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c1464f198_STRINGS__1_-removebg-preview.png";

export default function GuestAccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId: eventIdFromUrl } = useParams();
  
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start true to handle initial URL code check
  const [error, setError] = useState('');
  
  const [verifiedEventDetails, setVerifiedEventDetails] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Guest login states
  const [showGuestLoginForm, setShowGuestLoginForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isGuestAuth, setIsGuestAuth] = useState(false);
  
  // Effect to handle direct event access via URL or access code
  useEffect(() => {
    // Check if we have eventId in URL (direct access)
    if (eventIdFromUrl) {
      console.log('Direct event access with ID:', eventIdFromUrl);
      verifyEventById(eventIdFromUrl);
      return;
    }

    // Otherwise handle access code flow
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get('code');
    
    if (codeFromUrl) {
      const upperCode = codeFromUrl.toUpperCase();
      if (upperCode !== accessCodeInput) { // Only update if different to prevent unnecessary re-renders/effect triggers
        setAccessCodeInput(upperCode);
        // The second useEffect will handle the verification process
      }
    } else { // No code in URL
      // If accessCodeInput currently holds a value (e.g., from a previous URL or manual entry),
      // and now the URL doesn't have a code, clear the input and related states.
      if (accessCodeInput !== '') {
        setAccessCodeInput('');
        setVerifiedEventDetails(null);
        setIsAuthenticated(false);
        setError('');
      }
      setIsLoading(false); // Done checking URL, no code to process, so not loading.
    }
  }, [location.search, eventIdFromUrl]); // Re-run when URL changes

  // Effect to verify code from accessCodeInput and check authentication status
  useEffect(() => {
    const currentCode = accessCodeInput.trim();

    if (currentCode.length > 0) { // Process only if there's a code in the input
      // Case 1: Event is already verified for this code, but user might not be authenticated yet
      // (e.g., just returned from Google login, or auth state changed)
      if (verifiedEventDetails && verifiedEventDetails.access_code === currentCode && !isAuthenticated) {
        const recheckAuth = async () => {
          setIsLoading(true);
          try {
            await User.me();
            setIsAuthenticated(true); // User is now authenticated
            setError(''); // Clear any previous errors if auth succeeded
          } catch (e) {
            // User is still not authenticated, or session expired. Stay in unauthenticated state.
            setIsAuthenticated(false);
          } finally {
            setIsLoading(false);
          }
        };
        recheckAuth();
      } 
      // Case 2: No event details yet for this code, or it's a different code than the verified one
      else if (!verifiedEventDetails || verifiedEventDetails.access_code !== currentCode) {
        verifyAndPrepareLogin(currentCode);
      }
      // Case 3: Event verified for this code AND user is authenticated: do nothing, ready for navigation.
    } else {
      // No code in input, ensure states are reset
      if (verifiedEventDetails || isAuthenticated || error) { // only update if they are not already default
        setVerifiedEventDetails(null);
        setIsAuthenticated(false);
        setError('');
      }
      // If there's no code in the URL, and input is empty, ensure isLoading is false.
      // The first useEffect already handles isLoading for the initial URL check.
      // This part ensures it's false if user clears input manually.
      if (location.search.indexOf('code=') === -1) {
          setIsLoading(false);
      }
    }
  }, [accessCodeInput, isAuthenticated, verifiedEventDetails]); // Re-run if input code changes or auth state changes or verified event details change

  const verifyEventById = async (eventId) => {
    setIsLoading(true);
    setError('');
    setIsAuthenticated(false);

    try {
      const currentEvent = await Event.get(eventId);
      if (!currentEvent) {
        setError("האירוע המבוקש לא נמצא או שהקישור לא תקין.");
        setVerifiedEventDetails(null);
        setIsLoading(false);
        return;
      }

      // Check if event is still active (within one month after event date)
      if (currentEvent.event_date) {
        const eventDate = new Date(currentEvent.event_date);
        const oneMonthAfterEvent = new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, eventDate.getDate());
        const now = new Date();

        if (now > oneMonthAfterEvent) {
          setError(`האלבום של "${currentEvent.name}" אינו זמין יותר. עבר יותר מחודש מתאריך האירוע.`);
          setVerifiedEventDetails(null);
          setIsLoading(false);
          return;
        }
      }
      
      setVerifiedEventDetails(currentEvent);
      
      // Check if user has guest authentication for this event
      const guestInfo = localStorage.getItem('guestUserInfo');
      if (guestInfo) {
        const parsed = JSON.parse(guestInfo);
        if (parsed.eventId === currentEvent.id) {
          setGuestName(parsed.name);
          setGuestEmail(parsed.email);
          setIsGuestAuth(true);
          setIsAuthenticated(true);
        } else {
          // Guest info is for different event, clear it
          localStorage.removeItem('guestUserInfo');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false); // No guest auth, will show login form
      }

    } catch (err) {
      console.error("Error verifying event by ID:", err);
      setError("שגיאה בטעינת האירוע. נסה שוב.");
      setVerifiedEventDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndPrepareLogin = async (code) => {
    setIsLoading(true);
    setError('');
    setIsAuthenticated(false); // Assume not authenticated until proven otherwise

    try {
      const events = await Event.filter({ access_code: code.trim().toUpperCase() });
      if (events.length > 0) {
        const currentEvent = events[0];

        if (currentEvent.event_date) {
          const eventDate = new Date(currentEvent.event_date);
          // Set date to one month after the event. Use getDate() to avoid issues with month lengths (e.g., Feb 30)
          const oneMonthAfterEvent = new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, eventDate.getDate());
          const now = new Date();

          if (now > oneMonthAfterEvent) {
            setError(`האלבום של "${currentEvent.name}" אינו זמין יותר. עבר יותר מחודש מתאריך האירוע.`);
            setVerifiedEventDetails(null); // Clear event details if expired
            setIsLoading(false);
            return;
          }
        }
        
        setVerifiedEventDetails(currentEvent);
        
        // Check if user is already authenticated with Google
        try {
          const user = await User.me();
          console.log('User authenticated in GuestAccess:', user);
          setIsAuthenticated(true); // User is already logged in with Google
        } catch (userError) {
          // Check if user has guest authentication
          const guestInfo = localStorage.getItem('guestUserInfo');
          if (guestInfo) {
            const parsed = JSON.parse(guestInfo);
            if (parsed.eventId === currentEvent.id) {
              setGuestName(parsed.name);
              setGuestEmail(parsed.email);
              setIsGuestAuth(true);
              setIsAuthenticated(true); // User is authenticated as guest
            } else {
              // Guest info is for different event, clear it
              localStorage.removeItem('guestUserInfo');
              setIsAuthenticated(false);
            }
          } else {
            setIsAuthenticated(false); // User is not logged in, will show login options
          }
        }

      } else {
        setError("קוד גישה לא תקין או שהאירוע לא נמצא.");
        setVerifiedEventDetails(null); // Clear if event not found
      }
    } catch (err) {
      console.error("Error verifying access code:", err);
      setError("שגיאה באימות הקוד. נסה שוב.");
      setVerifiedEventDetails(null); // Clear on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const currentCode = accessCodeInput.trim();

    // If the input code is not empty, and either:
    // 1. No event is verified yet OR
    // 2. The verified event's code doesn't match the current input code
    //    then trigger verification.
    if (currentCode.length > 0 && (!verifiedEventDetails || verifiedEventDetails.access_code !== currentCode)) {
        verifyAndPrepareLogin(currentCode);
    } else if (currentCode.length > 0 && verifiedEventDetails && !isAuthenticated) {
        // If event is verified but not authenticated (e.g., user is on login prompt screen),
        // trigger a re-check of authentication status.
        const recheckAuthOnSubmit = async () => {
          setIsLoading(true);
          try {
            await User.me();
            setIsAuthenticated(true);
          } catch (e) { 
            setIsAuthenticated(false); // Still not authenticated, UI will show login button
          } finally {
            setIsLoading(false);
          }
        };
        recheckAuthOnSubmit();
    } else if (currentCode.length === 0) {
        setError("אנא הזן קוד גישה.");
    }
  };
  
  const handleGoogleLogin = async () => {
    console.log('🔐 Starting Google login from GuestAccess page');
    setIsLoading(true);
    try {
      await User.login(); // This will redirect the user to Google login
      // After login, the user will be redirected back to this page.
      // The useEffect will then re-run, detect the user as logged in,
      // and proceed to the album entry screen.
    } catch (loginError) {
      console.error("Google login initiation error:", loginError);
      setError("נסיון ההתחברות עם גוגל נכשל. אנא נסה שוב.");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = (e) => {
    e.preventDefault();
    const name = guestName.trim();
    const email = guestEmail.trim();
    
    if (!name || !email) {
      setError("אנא מלא את השם והאימייל.");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("אנא הזן כתובת אימייל תקינה.");
      return;
    }
    
    // Store guest info in localStorage
    const guestInfo = {
      name: name,
      email: email,
      eventId: verifiedEventDetails.id,
      timestamp: Date.now()
    };
    
    localStorage.setItem('guestUserInfo', JSON.stringify(guestInfo));
    localStorage.setItem('guestEventId', verifiedEventDetails.id);
    localStorage.setItem('guestAccessCode', verifiedEventDetails.access_code);
    localStorage.setItem('guestAuthType', 'name_email');
    
    setIsGuestAuth(true);
    setIsAuthenticated(true);
    setError('');
    
    // Navigate directly to album after guest login
    navigate(createPageUrl('GuestAlbum'));
  };

  const handleShowGuestForm = () => {
    setShowGuestLoginForm(true);
    setError('');
  };

  const navigateToAlbum = () => {
    if (verifiedEventDetails && isAuthenticated) {
      localStorage.setItem('guestEventId', verifiedEventDetails.id);
      localStorage.setItem('guestAccessCode', verifiedEventDetails.access_code);
      
      // Store guest auth type for the album page
      if (isGuestAuth) {
        localStorage.setItem('guestAuthType', 'name_email');
      } else {
        localStorage.setItem('guestAuthType', 'google');
      }
      
      navigate(createPageUrl('GuestAlbum'));
    } else {
      setError("נדרשת התחברות מאומתת כדי לגשת לאלבום.");
    }
  };
  
  const handleAccessCodeInputChangeEvent = (e) => {
    const newCode = e.target.value.toUpperCase();
    setAccessCodeInput(newCode);
    // Clear error message if user starts typing a new code
    if (error) {
        setError(''); 
    }
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] p-6">
        <Loader2 className="h-16 w-16 text-bordeaux animate-spin mb-6" />
        <p className="text-xl text-gray-700">טוען...</p>
      </div>
    );
  }

  // If event is verified, decide whether to show login or album entry
  if (verifiedEventDetails) {
    if (!isAuthenticated) {
      // Show login options
      return (
        <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8E7] to-[#F5F5DC] p-4 sm:p-8 text-center">
          <img src={LOGO_URL_GUEST_ACCESS} alt="Strings Logo" className="w-40 sm:w-56 h-auto mb-6 sm:mb-8" />
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-2">
            אירוע: {verifiedEventDetails.name}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md">
            {eventIdFromUrl 
              ? "כדי להמשיך לאלבום, יש להזין את הפרטים שלך:"
              : "כדי להמשיך לאלבום, יש להתחבר:"
            }
          </p>
          
          {(!showGuestLoginForm && !eventIdFromUrl) ? (
            // Show login options (only for access code flow)
            <div className="w-full max-w-md space-y-4">
              <Button 
                onClick={handleGoogleLogin}
                className="w-full btn-bordeaux h-14 px-6 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                התחבר עם גוגל
              </Button>
              
              <div className="flex items-center gap-4 my-6">
                <hr className="flex-1 border-gray-300" />
                <span className="text-gray-500 text-sm">או</span>
                <hr className="flex-1 border-gray-300" />
              </div>
              
              <Button 
                onClick={handleShowGuestForm}
                variant="outline"
                className="w-full h-14 px-6 text-lg font-semibold rounded-full border-2 border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-white transform hover:scale-105 transition-all duration-300 active:scale-95"
              >
                היכנס עם שם ואימייל
              </Button>
            </div>
          ) : (showGuestLoginForm || eventIdFromUrl) ? (
            // Show guest login form
            <form onSubmit={handleGuestLogin} className="w-full max-w-md space-y-4">
              <Input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="השם שלך"
                className="h-12 text-center rounded-xl border-gray-300 focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/50"
                autoFocus
              />
              <Input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="כתובת האימייל שלך"
                className="h-12 text-center rounded-xl border-gray-300 focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/50"
              />
              <div className="flex gap-3">
                <Button 
                  type="submit"
                  className="flex-1 btn-bordeaux h-12 text-lg font-semibold rounded-xl"
                >
                  המשך לאלבום
                </Button>
                {!eventIdFromUrl && (
                  <Button 
                    type="button"
                    onClick={() => setShowGuestLoginForm(false)}
                    variant="outline"
                    className="px-6 h-12 rounded-xl border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    חזור
                  </Button>
                )}
              </div>
            </form>
          ) : null}
          
          {error && (
            <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm flex items-center justify-center gap-2 mt-6">
              <ShieldAlert className="w-5 h-5"/> {error}
            </p>
          )}
        </div>
      );
    } else {
      // User is authenticated, show event details and entry button
      return (
        <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8E7] to-[#F5F5DC] p-4 sm:p-8 text-center">
          <img src={LOGO_URL_GUEST_ACCESS} alt="Strings Logo" className="w-40 sm:w-56 h-auto mb-6 sm:mb-8" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-bordeaux title-main mb-2">
            ברוכים הבאים! 
          </h1>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-4 sm:mb-6">
              {verifiedEventDetails.name}
          </h2>
          {verifiedEventDetails.cover_image_url && (
            <div className="w-full max-w-md sm:max-w-lg md:max-w-xl h-56 sm:h-72 md:h-80 rounded-2xl overflow-hidden shadow-2xl my-6 sm:my-8 border-4 border-white">
              <img src={verifiedEventDetails.cover_image_url} alt={`תמונת נושא של ${verifiedEventDetails.name}`} className="w-full h-full object-cover" />
            </div>
          )}
          {verifiedEventDetails.welcome_message && (
            <p className="text-base sm:text-lg text-gray-700 max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              {verifiedEventDetails.welcome_message}
            </p>
          )}
          <Button 
            onClick={navigateToAlbum}
            className="btn-bordeaux h-14 sm:h-16 px-10 sm:px-12 text-lg sm:text-xl font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 active:scale-95 flex items-center gap-3"
          >
            <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
            היכנס לאלבום
          </Button>
          <p className="text-xs text-gray-500 mt-4">קוד גישה: {accessCodeInput}</p>
        </div>
      );
    }
  }

  // Default: Show access code input form
  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] p-6 text-center">
      <img src={LOGO_URL_GUEST_ACCESS} alt="Strings Logo" className="w-56 h-auto mb-10" />
      <h1 className="text-3xl font-bold text-bordeaux mb-3">גישה לאלבום האירוע</h1>
      <p className="text-gray-600 mb-8 text-lg max-w-md">
        הזן את קוד הגישה שקיבלת כדי לצפות ולהעלות תמונות וסרטונים מהאירוע.
      </p>
      
      <form onSubmit={handleFormSubmit} className="w-full max-w-sm space-y-6">
        <Input
          type="text"
          value={accessCodeInput}
          onChange={handleAccessCodeInputChangeEvent} // Updated handler
          placeholder="הכנס קוד גישה"
          className="h-16 text-center text-2xl tracking-widest font-mono rounded-xl border-gray-300 focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/50 shadow-sm"
          maxLength={8}
          autoFocus
        />
        {error && (
          <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm flex items-center justify-center gap-2">
            <ShieldAlert className="w-5 h-5"/> {error}
          </p>
        )}
        <Button 
          type="submit" 
          disabled={isLoading || !accessCodeInput.trim()}
          className="w-full btn-bordeaux h-14 text-lg rounded-xl shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'כניסה לאלבום'}
        </Button>
      </form>
    </div>
  );
}
