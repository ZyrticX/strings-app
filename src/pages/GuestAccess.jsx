
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
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [eventDetails, setEventDetails] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Guest login states
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  
  // Effect to handle direct event access via URL
  useEffect(() => {
    if (eventIdFromUrl) {
      console.log('🎯 Direct event access with ID:', eventIdFromUrl);
      verifyEventById(eventIdFromUrl);
    } else {
      // If no eventId in URL, check for access code parameter (legacy support)
      const params = new URLSearchParams(location.search);
      const codeFromUrl = params.get('code');
      
      if (codeFromUrl) {
        console.log('🔑 Legacy access code found, converting to event lookup');
        verifyEventByCode(codeFromUrl.toUpperCase());
      } else {
        setError("קישור לא תקין. אנא השתמש בקוד QR או בקישור שקיבלת מהמארגן.");
        setIsLoading(false);
      }
    }
  }, [eventIdFromUrl, location.search]);


  const verifyEventById = async (eventId) => {
    setIsLoading(true);
    setError('');
    setIsAuthenticated(false);

    try {
      const currentEvent = await Event.get(eventId);
      if (!currentEvent) {
        setError("האירוע המבוקש לא נמצא או שהקישור לא תקין.");
        setEventDetails(null);
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
          setEventDetails(null);
          setIsLoading(false);
          return;
        }
      }
      
      setEventDetails(currentEvent);
      
      // Check authentication status
      await checkAuthenticationStatus(currentEvent.id);

    } catch (err) {
      console.error("Error verifying event by ID:", err);
      setError("שגיאה בטעינת האירוע. נסה שוב.");
      setEventDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEventByCode = async (accessCode) => {
    setIsLoading(true);
    setError('');
    setIsAuthenticated(false);

    try {
      const events = await Event.filter({ access_code: accessCode.trim().toUpperCase() });
      if (events.length === 0) {
        setError("קוד גישה לא תקין. אנא בדוק את הקוד ונסה שוב.");
        setEventDetails(null);
        setIsLoading(false);
        return;
      }

      const currentEvent = events[0];

      // Check if event is still active
      if (currentEvent.event_date) {
        const eventDate = new Date(currentEvent.event_date);
        const oneMonthAfterEvent = new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, eventDate.getDate());
        const now = new Date();

        if (now > oneMonthAfterEvent) {
          setError(`האלבום של "${currentEvent.name}" אינו זמין יותר. עבר יותר מחודש מתאריך האירוע.`);
          setEventDetails(null);
          setIsLoading(false);
          return;
        }
      }

      setEventDetails(currentEvent);
      
      // Check authentication status
      await checkAuthenticationStatus(currentEvent.id);

    } catch (err) {
      console.error("Error verifying event by code:", err);
      setError("שגיאה בטעינת האירוע. נסה שוב.");
      setEventDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthenticationStatus = async (eventId) => {
    try {
      // First check if user is authenticated with Google
      const user = await User.me();
      console.log('✅ User authenticated with Google:', user);
      setIsAuthenticated(true);
      return;
    } catch (userError) {
      // Check if user has guest authentication for this event
      const guestInfo = localStorage.getItem('guestUserInfo');
      if (guestInfo) {
        const parsed = JSON.parse(guestInfo);
        if (parsed.eventId === eventId) {
          console.log('✅ User authenticated as guest:', parsed);
          setGuestName(parsed.name);
          setGuestEmail(parsed.email);
          setIsAuthenticated(true);
          return;
        } else {
          // Guest info is for different event, clear it
          localStorage.removeItem('guestUserInfo');
        }
      }
      
      console.log('❌ User not authenticated, will show login form');
      setIsAuthenticated(false);
    }
  };


  
  const handleGoogleLogin = async () => {
    console.log('🔐 Starting Google login from GuestAccess page');
    setIsLoading(true);
    try {
      // Store current event info for after login redirect
      if (eventDetails) {
        localStorage.setItem('pendingEventAccess', JSON.stringify({
          eventId: eventDetails.id,
          timestamp: new Date().toISOString()
        }));
      }
      
      await User.login(); // This will redirect the user to Google login
      // After login, the user will be redirected back and we'll navigate to the album
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
      eventId: eventDetails.id,
      timestamp: Date.now()
    };
    
    localStorage.setItem('guestUserInfo', JSON.stringify(guestInfo));
    localStorage.setItem('guestEventId', eventDetails.id);
    localStorage.setItem('guestAccessCode', eventDetails.access_code);
    localStorage.setItem('guestAuthType', 'name_email');
    
    setIsAuthenticated(true);
    setError('');
    
    console.log('✅ Guest authentication successful, navigating to album');
    
    // Navigate directly to album after guest login
    navigate(createPageUrl('GuestAlbum'));
  };


  const navigateToAlbum = () => {
    if (eventDetails && isAuthenticated) {
      localStorage.setItem('guestEventId', eventDetails.id);
      localStorage.setItem('guestAccessCode', eventDetails.access_code);
      
      navigate(createPageUrl('GuestAlbum'));
    } else {
      setError("נדרשת התחברות מאומתת כדי לגשת לאלבום.");
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
  if (eventDetails) {
    if (!isAuthenticated) {
      // Show login options
      return (
        <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8E7] to-[#F5F5DC] p-4 sm:p-8 text-center">
          <img src={LOGO_URL_GUEST_ACCESS} alt="Strings Logo" className="w-40 sm:w-56 h-auto mb-6 sm:mb-8" />
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-2">
            אירוע: {eventDetails.name}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md">
            כדי להמשיך לאלבום, אנא בחר אחת מהאפשרויות הבאות:
          </p>
          
          {/* Google Login Option */}
          <div className="w-full max-w-md space-y-4 mb-6">
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
          </div>
          
          {/* Divider */}
          <div className="flex items-center gap-4 my-6 w-full max-w-md">
            <hr className="flex-1 border-gray-300" />
            <span className="text-gray-500 text-sm">או</span>
            <hr className="flex-1 border-gray-300" />
          </div>
          
          {/* Guest Login Form */}
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
            <Button 
              type="submit"
              className="w-full btn-bordeaux h-12 text-lg font-semibold rounded-xl"
            >
              המשך לאלבום
            </Button>
          </form>
          
          {error && (
            <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm flex items-center justify-center gap-2 mt-6">
              <ShieldAlert className="w-5 h-5"/> {error}
            </p>
          )}
        </div>
      );
    } else {
      // User is authenticated, automatically redirect to album
      console.log('✅ User authenticated, redirecting to album');
      navigateToAlbum();
      return (
        <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8E7] to-[#F5F5DC] p-6">
          <Loader2 className="h-16 w-16 text-bordeaux animate-spin mb-6" />
          <p className="text-xl text-gray-700">מעביר לאלבום...</p>
        </div>
      );
    }
  }

  // Default: Show error message for invalid access
  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] p-6 text-center">
      <img src={LOGO_URL_GUEST_ACCESS} alt="Strings Logo" className="w-56 h-auto mb-10" />
      <h1 className="text-3xl font-bold text-bordeaux mb-3">גישה לאלבום האירוע</h1>
      <p className="text-gray-600 mb-8 text-lg max-w-md">
        יש להשתמש בקוד QR או בקישור הישיר שקיבלת מהמארגן.
      </p>
      
      {error && (
        <p className="text-red-600 bg-red-100 p-4 rounded-lg text-sm flex items-center justify-center gap-2">
          <ShieldAlert className="w-5 h-5"/> {error}
        </p>
      )}
    </div>
  );
}
