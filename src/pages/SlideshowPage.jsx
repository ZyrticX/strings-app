import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Event } from '@/api/entities';
import { MediaItem } from '@/api/entities';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, CameraOff } from 'lucide-react';

const SLIDESHOW_INTERVAL = 7000; // 7 seconds per image
const REFETCH_INTERVAL = 15000; // 15 seconds to check for new images

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c1464f198_STRINGS__1_-removebg-preview.png";

export default function SlideshowPage() {
  const [searchParams] = useSearchParams();
  // Try both eventId and eventid for compatibility
  const eventId = searchParams.get('eventId') || searchParams.get('eventid');
  
  const [mediaItems, setMediaItems] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging
  console.log('🎬 SlideshowPage - URL params:', Object.fromEntries(searchParams));
  console.log('🎬 SlideshowPage - eventId:', eventId);
  console.log('🎬 SlideshowPage - Current URL:', window.location.href);

  // Force full screen dark theme for slideshow
  useEffect(() => {
    // Set body styles for slideshow
    const originalStyles = {
      backgroundColor: document.body.style.backgroundColor,
      margin: document.body.style.margin,
      padding: document.body.style.padding,
      overflow: document.body.style.overflow,
      fontFamily: document.body.style.fontFamily
    };

    document.body.style.backgroundColor = '#000000';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.fontFamily = "'Open Sans', sans-serif";
    
    // Cleanup when component unmounts
    return () => {
      document.body.style.backgroundColor = originalStyles.backgroundColor;
      document.body.style.margin = originalStyles.margin;
      document.body.style.padding = originalStyles.padding;
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.fontFamily = originalStyles.fontFamily;
    };
  }, []);

  // Fetch data initially and then set up a recurring fetch
  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log('🎬 SlideshowPage - Fetching data for eventId:', eventId);
        
        // Direct API calls without user authentication
        const [eventData, mediaData] = await Promise.all([
          Event.get(eventId),
          MediaItem.filter({ event_id: eventId, status: 'approved', file_type: 'image' }, '-created_date')
        ]);
        
        console.log('🎬 SlideshowPage - Event data:', eventData);
        console.log('🎬 SlideshowPage - Media data count:', mediaData?.length || 0);
        
        setEventDetails(eventData);
        setMediaItems(mediaData || []);
      } catch (error) {
        console.error("🎬 SlideshowPage - Error fetching slideshow data:", error);
        console.error("🎬 SlideshowPage - Error details:", error.message, error.details);
        // Even on error, don't require authentication
      } finally {
        setIsLoading(false);
      }
    };

    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, REFETCH_INTERVAL);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [eventId]);

  // Set up the interval for changing slides
  useEffect(() => {
    if (mediaItems.length > 1) {
      const slideInterval = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % mediaItems.length);
      }, SLIDESHOW_INTERVAL);
      return () => clearInterval(slideInterval);
    }
  }, [mediaItems.length]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="h-16 w-16 animate-spin text-white/80 mb-4" />
        <p className="text-xl">טוען את אלבום התמונות...</p>
      </div>
    );
  }
  
  if (!eventId || !eventDetails) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white p-8">
        <CameraOff className="h-16 w-16 text-red-500/80 mb-4" />
        <h1 className="text-2xl font-bold mb-4">שגיאה בטעינת הסליידשואו</h1>
        
        {!eventId ? (
          <>
            <p className="text-lg mb-2">לא סופק מזהה אירוע</p>
            <p className="text-sm opacity-60 text-center">
              הקישור צריך להיות בפורמט:<br/>
              <code className="bg-gray-800 px-2 py-1 rounded text-xs mt-2 inline-block">
                /SlideshowPage?eventId=YOUR_EVENT_ID
              </code>
            </p>
          </>
        ) : !eventDetails ? (
          <>
            <p className="text-lg mb-2">אירוע לא נמצא</p>
            <p className="text-sm opacity-60 text-center">
              מזהה אירוע: <code className="bg-gray-800 px-2 py-1 rounded">{eventId}</code><br/>
              ייתכן שהאירוע נמחק או שאין הרשאה לצפייה
            </p>
          </>
        ) : null}
        
        <div className="mt-6 text-xs opacity-40 text-center">
          <p>URL נוכחי: {window.location.href}</p>
        </div>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    // Generate QR code URL for event access with STRINGS branding
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const directGuestUrl = `${currentOrigin}/guest/${eventId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(directGuestUrl)}&size=200x200&ecc=H&margin=0&color=5C1A1B&bgcolor=F8F4E6&format=png`;

    return (
      <div className="h-screen w-screen bg-black relative flex flex-col text-white">
        {/* Top Logo */}
        <div className="absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10">
          <div className="flex justify-center">
            <img 
              src={LOGO_URL} 
              alt="Strings Logo" 
              className="w-auto h-32 drop-shadow-2xl opacity-95" 
            />
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-5xl font-bold mb-6" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.9)'}}>
            ברוכים הבאים לאירוע של {eventDetails.name}!
          </h1>
          <p className="text-3xl opacity-90 mb-4" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.8)'}}>
            מחכים לתמונות הראשונות שלכם...
          </p>
          <p className="text-xl opacity-70" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.8)'}}>
            סרקו את קוד ה-QR והתחילו להעלות!
          </p>
        </div>

        {/* Bottom QR Code */}
        <div className="absolute bottom-0 left-0 p-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-gradient-to-br from-[#F8F4E6] to-[#F5F5DC] p-4 rounded-xl shadow-2xl border-2 border-[#5C1A1B]/20">
              <img 
                src={qrCodeUrl} 
                alt="QR Code לכניסה לאלבום" 
                className="w-32 h-32 rounded-lg"
              />
            </div>
            <p className="text-white/90 text-base font-medium text-center" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.9)'}}>
              סרקו להעלאת תמונות
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const currentMedia = mediaItems[currentIndex];

  // Generate QR code URL for event access with STRINGS branding
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const directGuestUrl = `${currentOrigin}/guest/${eventId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(directGuestUrl)}&size=150x150&ecc=H&margin=0&color=5C1A1B&bgcolor=F8F4E6&format=png`;

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* Top Logo */}
      <div className="absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10">
        <div className="flex justify-center">
          <img 
            src={LOGO_URL} 
            alt="Strings Logo" 
            className="w-auto h-32 drop-shadow-2xl opacity-95" 
          />
        </div>
      </div>

      <AnimatePresence>
        <motion.img
          key={currentMedia.id}
          src={currentMedia.file_url}
          alt={currentMedia.caption || 'תמונה מהאירוע'}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="w-full h-full object-contain"
        />
      </AnimatePresence>
      
      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
        <div className="flex items-end justify-between">
          {/* Left side - QR Code */}
          <div className="flex flex-col items-center space-y-2">
            <div className="bg-gradient-to-br from-[#F8F4E6] to-[#F5F5DC] p-3 rounded-xl shadow-2xl border-2 border-[#5C1A1B]/20">
              <img 
                src={qrCodeUrl} 
                alt="QR Code לכניסה לאלבום" 
                className="w-24 h-24 rounded-lg"
              />
            </div>
            <p className="text-white/90 text-sm font-medium text-center" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.9)'}}>
              סרקו להעלאת תמונות
            </p>
          </div>
          
          {/* Right side - Event Info */}
          <div className="flex-1 text-right mr-8">
            <h1 className="text-white text-3xl font-bold shadow-lg mb-2" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.9)'}}>
              {eventDetails.name}
            </h1>
            
            {currentMedia.caption && (
              <p className="text-white/80 text-lg mt-2" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.8)'}}>
                {currentMedia.caption}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}