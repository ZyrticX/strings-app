
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { checkUploadWindow, getEventStatus } from '@/utils/eventTimeValidation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Loader2, AlertTriangle, MapPin, Upload, Camera, Heart, MessageSquare,
  Info as InfoIcon, X as XIcon, CheckCircle, Image as ImageIconLucide,
  Users, Music2, GlassWater, Cake, Gift, PartyPopper, Mic2, Presentation, Coffee,
  Smile, ThumbsUp, Sun, Moon, Sparkles, Megaphone, Palette, ShoppingBag, Briefcase,
  GraduationCap, Plane, Ship, Car, Bike, TreeDeciduous, Flower2, Award, Trophy,
  Film, Clapperboard, Ticket, Baby, Dog, Cat, ScrollText, Disc3, Tag as TagIcon,
  ChevronUp, ListChecks, ChevronLeft, ChevronRight, PlayCircle, PauseCircle, Volume2, VolumeX, Maximize, Minimize, Download as DownloadIcon, Share2 as ShareIcon,
  ShieldAlert,
  Instagram, Mail, MessageCircle as WhatsAppIcon,
  CalendarDays, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  ScrollArea,
  ScrollBar
} from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Event } from '@/api/entities';
import { MediaItem } from '@/api/entities';
import { HighlightCategory } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { User } from '@/api/entities';
import { notifyMediaUploaded } from '@/utils/notificationManager';

// Simple console log for toast replacement during this debug phase
const showToast = (type, title, description) => {
  // Actually show alert for important messages so user can see them
  if (type === 'error' || type === 'warn') {
    alert(`${title}: ${description || ''}`);
  } else {
    console.log(`GuestAlbum Toast (${type}): ${title} - ${description || ''}`); // Ensure description is handled if undefined
  }
};

const MAX_FILE_SIZE_MB = 25; // Define max file size for uploads

// Add highlight icons mapping
const highlightIconsList = [
  { name: 'Users', Icon: Users }, { name: 'Heart', Icon: Heart }, { name: 'Music2', Icon: Music2 },
  { name: 'GlassWater', Icon: GlassWater }, { name: 'Cake', Icon: Cake }, { name: 'Gift', Icon: Gift },
  { name: 'PartyPopper', Icon: PartyPopper }, { name: 'Camera', Icon: Camera },
  { name: 'Mic2', Icon: Mic2 }, { name: 'Presentation', Icon: Presentation }, { name: 'Coffee', Icon: Coffee },
  { name: 'Smile', Icon: Smile }, { name: 'ThumbsUp', Icon: ThumbsUp }, { name: 'MapPin', Icon: MapPin },
  { name: 'Sun', Icon: Sun }, { name: 'Moon', Icon: Moon }, { name: 'Sparkles', Icon: Sparkles },
  { name: 'Megaphone', Icon: Megaphone }, { name: 'Palette', Icon: Palette }, { name: 'ShoppingBag', Icon: ShoppingBag },
  { name: 'Briefcase', Icon: Briefcase }, { name: 'GraduationCap', Icon: GraduationCap }, { name: 'Plane', Icon: Plane },
  { name: 'Ship', Icon: Ship }, { name: 'Car', Icon: Car }, { name: 'Bike', Icon: Bike },
  { name: 'TreeDeciduous', Icon: TreeDeciduous }, { name: 'Flower2', Icon: Flower2 }, { name: 'Award', Icon: Award },
  { name: 'Trophy', Icon: Trophy }, { name: 'Film', Icon: Film }, { name: 'Clapperboard', Icon: Clapperboard },
  { name: 'Ticket', Icon: Ticket }, { name: 'Baby', Icon: Baby }, { name: 'Dog', Icon: Dog }, { name: 'Cat', Icon: Cat },
  { name: 'ScrollText', Icon: ScrollText }, { name: 'Disc3', Icon: Disc3 }, { name: 'TagIcon', Icon: TagIcon }
];

const renderHighlightIcon = (iconName) => {
  const IconComponent = highlightIconsList.find(i => i.name === iconName)?.Icon;
  return IconComponent ? <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" /> : <TagIcon className="w-5 h-5 sm:w-6 sm:h-6" />;
};

// Updated Component: HighlightStoryView
const HighlightStoryView = ({ items, startIndex, onClose, eventName }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [itemProgress, setItemProgress] = useState(0);
  const storyContainerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!currentItem) return;

    setItemProgress(0); // Reset progress for new item
    const timerDuration = 10000; // 10 seconds for images

    let progressInterval;
    let timeoutId;

    if (currentItem.file_type === 'image') {
      if (isPlaying) {
        progressInterval = setInterval(() => {
          setItemProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + (100 / (timerDuration / 100)); // Update progress every 100ms
          }, 100);
        }, 100);
        timeoutId = setTimeout(goToNext, timerDuration);
      }
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
    };
  }, [currentIndex, isPlaying, items, currentItem?.file_type]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < items.length) {
        return nextIndex;
      } else {
        onClose(); // Close story when all items are viewed
        return prevIndex; // Should not be reached if onClose closes the view
      }
    });
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  

  // Swipe to close logic
  const handleTouchStart = (e) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current - touchEndY.current < -100) { // Swiped down by more than 100px
      onClose();
    }
    // Reset touch points
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  useEffect(() => {
    const container = storyContainerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [onClose]);

  if (!currentItem) return null;

  return (
    <div ref={storyContainerRef} className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white overflow-hidden select-none" dir="rtl">
      {/* Click areas for navigation */}
      <div className="absolute left-0 top-0 h-full w-1/3 cursor-pointer z-[101]" onClick={goToPrevious}></div>
      <div className="absolute right-0 top-0 h-full w-1/3 cursor-pointer z-[101]" onClick={goToNext}></div>

      {/* Top Controls: Progress Bars & Close Button */}
      <div className="absolute top-0 left-0 right-0 pt-[env(safe-area-inset-top,0.75rem)] px-2 sm:px-3 flex items-center w-full z-[102]">
        {/* Progress Bars */}
        <div className="flex-grow flex gap-1 mr-2 rtl:ml-2 rtl:mr-0">
          {items.map((_, index) => (
            <div key={index} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: `${index < currentIndex ? 100 : (index === currentIndex ? itemProgress : 0)}%` }}
              />
            </div>
          ))}
        </div>
        {/* Close Button */}
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0">
          <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      </div>
      
      {/* Media Content */}
      <div className="relative w-full h-full flex items-center justify-center max-h-full max-w-full my-auto pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)]">
        <img src={currentItem.file_url} alt={currentItem.caption || 'Story item'} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
      </div>

      {/* Footer: Caption, Play/Pause Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom,0.75rem)] px-3 sm:px-4 bg-gradient-to-t from-black/50 to-transparent z-[102]">
        {currentItem.caption && (
          <p className="text-center text-xs sm:text-sm mb-2 px-4 line-clamp-2">{currentItem.caption}</p>
        )}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={togglePlayPause} className="text-white hover:bg-white/20 rounded-full w-8 h-8 sm:w-10 sm:h-10">
            {isPlaying ? <PauseCircle className="w-5 h-5 sm:w-6 h-6" /> : <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

// New Component: MediaViewerModal
const MediaViewerModal = ({ item, isOpen, onClose, onDownload, onShare, onPrev, onNext, canPrev, canNext }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50; // Minimum distance for a swipe to be registered

  const handleTouchStart = (e) => {
    setTouchEnd(null); // Reset touch end points
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return; // Ensure both are set
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && canNext) {
      onNext();
    } else if (isRightSwipe && canPrev) {
      onPrev();
    }
    // Reset
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isOpen || !item) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
      dir="rtl" // Keep RTL dir
      onClick={onClose} // Keep click to close on background
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Stop propagation on content to prevent closing when clicking on image/video or controls */}
      <div className="relative w-full h-[70vh] sm:h-[80vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-black/30 hover:bg-black/50 rounded-full z-[101]"
        >
          <XIcon className="w-6 h-6" />
        </Button>

        {/* Media */}
        <div className="flex-grow flex items-center justify-center overflow-hidden w-full h-auto">
          <img src={item.file_url} alt={item.caption || 'תמונה'} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        </div>
        
        {canPrev && (
            <Button onClick={onPrev} variant="ghost" size="icon" className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 rounded-full p-2 z-10">
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </Button>
          )}
          {canNext && (
            <Button onClick={onNext} variant="ghost" size="icon" className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 rounded-full p-2 z-10">
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </Button>
          )}

        {/* Caption & Controls */}
        <div className="w-full pt-4 text-center text-white">
          {item.caption && <p className="mb-3 text-sm line-clamp-2">{item.caption}</p>}
          <div className="flex justify-center gap-3">
            <Button onClick={onDownload} variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20 text-white">
              <DownloadIcon className="ml-2 h-4 w-4" /> הורדה
            </Button>
            <Button onClick={onShare} variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20 text-white">
              <ShareIcon className="ml-2 h-4 w-4" /> שיתוף
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LOGO_URL_GUEST_ALBUM = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c1464f198_STRINGS__1_-removebg-preview.png";

export default function GuestAlbumPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId: eventIdFromUrl } = useParams(); // New
  const [searchParams] = useSearchParams(); // New
  const guestEmailFromUrl = searchParams.get('guestEmail'); // New
  const guestNameFromUrl = searchParams.get('guestName'); // New

  const [eventId, setEventId] = useState(localStorage.getItem('guestEventId') || null);
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('gallery');

  // Gallery data
  const [mediaItems, setMediaItems] = useState([]);
  const [highlightCategories, setHighlightCategories] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [likedItems, setLikedItems] = useState([]);
  const [favoritesFilterActive, setFavoritesFilterActive] = useState(false);
  const [mediaFilter, setMediaFilter] = useState('image');


  // Upload related states
  const [uploadCaption, setUploadCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreviewScreen, setShowPreviewScreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showHighlightSheet, setShowHighlightSheet] = useState(false);
  const [activeStory, setActiveStory] = useState({ isOpen: false, items: [], startIndex: 0 });
  
  // States for MediaViewerModal
  const [selectedMediaItem, setSelectedMediaItem] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  
  // Add states for wishes functionality
  const [wishText, setWishText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [wishSubmitted, setWishSubmitted] = useState(false);
  const [approvedWishes, setApprovedWishes] = useState([]);
  
  // Add state for multi-select mode
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Agreement states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // New state for upload permission and time validation
  const [canUpload, setCanUpload] = useState(true);
  const [uploadStatus, setUploadStatus] = useState({ canUpload: true, reason: '', timeRemaining: '' });

  // Derived state for personal album view
  const isPersonalAlbumView = !!guestEmailFromUrl;

  // Refs for file inputs
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Use a ref for uploadQueue to avoid unnecessary re-renders when managing queue internally
  const uploadQueueRef = useRef([]);

  // Function to update the queue and trigger processing
  const updateUploadQueue = (newQueue) => {
    uploadQueueRef.current = newQueue;
  };

  // Add a state to trigger re-render of the upload queue display
  const [displayUploadQueue, setDisplayUploadQueue] = useState([]);

  // Force light mode on this page to prevent any dark mode overrides
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  console.log("GuestAlbumPage (with highlights and fixed gallery) loaded!");


  // Modified initializePage to handle URL params for eventId and accessCode
  const initializePage = async () => {
    setIsLoading(true);

    // Prioritize eventId and accessCode from URL for direct links
    let currentEventId = eventIdFromUrl || searchParams.get('eventId');
    let currentAccessCode = searchParams.get('accessCode');

    // Fallback to localStorage if not in URL
    if (!currentEventId) {
        currentEventId = localStorage.getItem('guestEventId');
    }
    if (!currentAccessCode) {
        currentAccessCode = localStorage.getItem('guestAccessCode');
    }

    // If neither is found, redirect to GuestAccess
    if (!currentEventId || !currentAccessCode) {
      console.error("GuestAlbumPage: Missing eventId or accessCode.");
      console.log("🔄 Redirecting to GuestAccess for proper authentication");
      
      // Try to get event ID from URL parameters if available
      const urlEventId = eventIdFromUrl || searchParams.get('eventId');
      
      let redirectUrl;
      if (urlEventId) {
        // Redirect to direct guest access with event ID
        redirectUrl = `/guest/${urlEventId}`;
        console.log("🎯 Redirecting to direct guest access:", redirectUrl);
      } else if (currentAccessCode || localStorage.getItem('guestAccessCode')) {
        // Fallback to legacy code-based access
        const code = currentAccessCode || localStorage.getItem('guestAccessCode');
        redirectUrl = createPageUrl('GuestAccess') + `?code=${code}&auth_required=true`;
        console.log("🔑 Redirecting to code-based access:", redirectUrl);
      } else {
        // No information available, show generic access page
        redirectUrl = createPageUrl('GuestAccess');
        console.log("❓ Redirecting to generic access page:", redirectUrl);
      }
      
      navigate(redirectUrl);
      setIsLoading(false);
      return;
    }

    setEventId(currentEventId); // Update eventId state for other effects/components

    let user;
    try {
        user = await User.me();
        setCurrentUser(user);
    } catch (authError) {
        console.log("GuestAlbumPage: Google auth not found, checking guest auth:", authError);
        
        // Check for guest authentication
        const guestAuthType = localStorage.getItem('guestAuthType');
        const guestInfo = localStorage.getItem('guestUserInfo');
        
        if (guestAuthType === 'name_email' && guestInfo) {
            const parsed = JSON.parse(guestInfo);
            if (parsed.eventId === currentEventId) {
                // Create a mock user object for guest
                user = {
                    full_name: parsed.name,
                    email: parsed.email,
                    id: `guest_${parsed.email}`,
                    isGuest: true
                };
                setCurrentUser(user);
                console.log("GuestAlbumPage: Guest user authenticated:", user);
            } else {
                // Guest info is for different event, clear it and redirect
                localStorage.removeItem('guestUserInfo');
                localStorage.removeItem('guestAuthType');
                
                const guestAccessCode = localStorage.getItem('guestAccessCode');
                let redirectUrl = createPageUrl('GuestAccess');
                if (guestAccessCode) {
                    redirectUrl += `?code=${guestAccessCode}&auth_required=true`;
                } else {
                    redirectUrl += `?auth_required=true`;
                }
                navigate(redirectUrl);
                setIsLoading(false);
                return;
            }
        } else {
            // No valid authentication found
            if (!isPersonalAlbumView) {
                console.log("❌ No valid authentication found, redirecting to GuestAccess");
                
                // Try to use current event ID for direct access
                if (currentEventId) {
                    const directUrl = `/guest/${currentEventId}`;
                    console.log("🎯 Redirecting to direct guest access:", directUrl);
                    navigate(directUrl);
                } else {
                    const guestAccessCode = localStorage.getItem('guestAccessCode');
                    let redirectUrl = createPageUrl('GuestAccess');
                    if (guestAccessCode) {
                        redirectUrl += `?code=${guestAccessCode}&auth_required=true`;
                    } else {
                        redirectUrl += `?auth_required=true`;
                    }
                    console.log("🔑 Redirecting to GuestAccess:", redirectUrl);
                    navigate(redirectUrl);
                }
                setIsLoading(false);
                return;
            }
        }
    }

    try {
      const event = await Event.get(currentEventId);

      if (!event) {
        console.error(`GuestAlbumPage: Event not found for ID: ${currentEventId}`);
        setError("האירוע המבוקש לא נמצא. ייתכן שהקוד שגוי או שהאירוע נמחק.");
        setIsLoading(false);
        return;
      }

      if (event.access_code !== currentAccessCode) {
        console.error("GuestAlbumPage: Access code mismatch.");
        setError("שגיאת קוד גישה. אנא נסה שוב.");
        setIsLoading(false);
        return;
      }

      if (event.advance_payment_status !== 'paid') {
        console.warn(`GuestAlbumPage: Event payment status is not 'paid': ${event.advance_payment_status}`);
        setError(`הגישה לאלבום זה מוגבלת עד להסדרת התשלום. אנא פנה למארגן האירוע.`);
        setIsLoading(false);
        return;
      }

      setEventDetails(event);
      setError(''); // Clear error if data loaded successfully

      // Check if uploading is allowed (within 24 hours of event date)
      if (event.event_date) {
        const eventDate = new Date(event.event_date);
        const now = new Date();
        const uploadCutoffDate = new Date(eventDate.getTime() + (24 * 60 * 60 * 1000)); 
        if (now > uploadCutoffDate) {
          setCanUpload(false);
        } else {
          setCanUpload(true);
        }
      } else {
        setCanUpload(true); // If no event date, allow upload (edge case)
      }

      // Check terms acceptance for this user and this event (only if user is authenticated)
      if (user && event) {
          const termsShownLocalStorageKey = `termsShown_event_${event.id}_user_${user.id}`;
          if (!localStorage.getItem(termsShownLocalStorageKey)) {
              setShowTermsModal(true);
          }
          // Load liked items from localStorage (user-specific)
          const likedItemsLocalStorageKey = `likedItems_event_${event.id}_user_${user.id}`;
          let initialLikedItems = [];
          try {
              const storedLikesRaw = localStorage.getItem(likedItemsLocalStorageKey);
              if (storedLikesRaw) {
                  const parsedLikes = JSON.parse(storedLikesRaw);
                  if (Array.isArray(parsedLikes)) { // Ensure it's an array
                      initialLikedItems = parsedLikes;
                  }
              }
          } catch (e) {
              console.error("Could not parse liked items from local storage:", e);
          }
          setLikedItems(initialLikedItems);
      }

      // Check upload window after loading event details
      if (event) {
        const uploadWindowStatus = checkUploadWindow(event);
        setUploadStatus(uploadWindowStatus);
        setCanUpload(uploadWindowStatus.canUpload);
      }

      // Load highlight categories and guest wishes
      await loadHighlightCategories(currentEventId);
      await loadGuestWishes(currentEventId);

    } catch (err) {
      console.error("GuestAlbumPage: Error loading event data:", err);
      setError(`שגיאה בטעינת נתוני האירוע: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Main useEffect for initial page setup via initializePage
  useEffect(() => {
    initializePage();
  }, [navigate, location, eventIdFromUrl, searchParams]); // Depend on URL params to re-init if they change

  // New useEffect for periodic media refresh and initial media load after event details are ready
  useEffect(() => {
    if (eventId && eventDetails) { // Ensure eventId and eventDetails are set
        // Initial load after details are ready
        loadMediaItems(eventId, guestEmailFromUrl);

        // Set up interval for refreshing media
        const interval = setInterval(() => {
            loadMediaItems(eventId, guestEmailFromUrl);
        }, 15000); // Refresh every 15 seconds

        // Cleanup on unmount or dependency change
        return () => clearInterval(interval);
    }
  }, [eventId, eventDetails, guestEmailFromUrl]); // Re-fetch if eventId or guestEmail changes, or eventDetails are set


  const handleAcceptTerms = () => {
    if (currentUser && eventDetails) {
      const termsShownLocalStorageKey = `termsShown_event_${eventDetails.id}_user_${currentUser.id}`;
      localStorage.setItem(termsShownLocalStorageKey, 'true');
    }
    setShowTermsModal(false);
  };

  // Modified loadMediaItems to accept optional guestEmailForFiltering
  const loadMediaItems = async (eventIdParam, guestEmailForFiltering = null) => {
    const idToUse = eventIdParam || eventId;
    if (!idToUse) return;

    setIsLoadingMedia(true);
    try {
      let filter = { event_id: idToUse };
      if (guestEmailForFiltering) {
          filter.created_by = guestEmailForFiltering; // Apply the new filter
      }
      const media = await MediaItem.filter(filter, '-created_date');
      setMediaItems(media || []); // Ensure it's an array
      console.log("Loaded media items:", media?.length || 0);

    } catch (err) {
      console.error("Error loading media items:", err);
      showToast("error", "שגיאה בטעינת התמונות", err.message);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const loadHighlightCategories = async (eventIdParam) => {
    const idToUse = eventIdParam || eventId;
    if (!idToUse) return;

    try {
      const categories = await HighlightCategory.filter({ event_id: idToUse }, 'display_order');
      setHighlightCategories(categories || []); // Ensure it's an array
      console.log("Loaded highlight categories:", categories?.length || 0);
    } catch (err) {
      console.error("Error loading highlight categories:", err);
      showToast("error", "שגיאה בטעינת קטגוריות ההיילייט", err.message);
    }
  };

  const loadGuestWishes = async (eventIdParam) => {
    const idToUse = eventIdParam || eventId;
    if (!idToUse) return;
    try {
      const { GuestWish } = await import('@/api/entities');
      const wishes = await GuestWish.filter({ event_id: idToUse, approved: true }, '-created_date');
      setApprovedWishes(wishes || []);
      console.log("Loaded approved wishes:", wishes?.length || 0);
    } catch (err) {
      console.error("Error loading guest wishes:", err);
      showToast("error", "שגיאה בטעינת הברכות", err.message);
    }
  };

  // File upload handlers
  const processSelectedFile = async (file) => {
    if (!file) return;
    if (!currentUser) {
        showToast("error", "שגיאה", "עליך להיות מחובר כדי להעלות מדיה.");
        return;
    }

    // Check upload time window
    if (!uploadStatus.canUpload) {
        showToast("error", "לא ניתן להעלות", uploadStatus.reason);
        if (galleryInputRef.current) galleryInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        return;
    }

    // Check file size
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      showToast("error", "קובץ גדול מדי", `הקובץ ${file.name} גדול מדי (${fileSizeMB.toFixed(2)}MB). הגודל המక్సిמלי הוא ${MAX_FILE_SIZE_MB}MB.`);
      // Reset file inputs
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    // Check file's lastModified date against event date for gallery uploads
    if (eventDetails?.event_date && !file.fromCamera) {
        const eventDate = new Date(eventDetails.event_date);
        eventDate.setHours(0,0,0,0);

        const fileLastModified = new Date(file.lastModified);
        fileLastModified.setHours(0,0,0,0);

        if (fileLastModified < eventDate) {
            showToast("warn", "תמונה ישנה מדי", `התמונה הזו צולמה לפני תאריך האירוע (${eventDate.toLocaleDateString('he-IL')}) ולכן לא ניתן להעלות אותה.`);
            if (galleryInputRef.current) galleryInputRef.current.value = ''; 
            if (cameraInputRef.current) cameraInputRef.value = '';
            return;
        }
    }

    // Check file type - only images are supported
    const isImage = file.type.startsWith('image/');

    if (!isImage) {
      showToast("error", "סוג קובץ לא נתמך", "ניתן להעלות רק תמונות (JPG, PNG, GIF)");
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.value = '';
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowPreviewScreen(true);
    setUploadCaption(''); // Reset caption for new file

    // Reset file inputs after processing
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.value = '';
    }
  };

  const handleFileFromGallery = (event) => {
    const file = event.target.files[0];
    if (file) {
      file.fromCamera = false;
      processSelectedFile(file);
    }
  };

  const handleFileFromCamera = (event) => {
    const file = event.target.files[0];
    if (file) {
      file.fromCamera = true;
      processSelectedFile(file);
    }
  };

  const addToUploadQueue = (file, caption = '', highlightCategoryId = null) => {
    if (!currentUser) {
        showToast("error", "שגיאה", "עליך להיות מחובר כדי להעלות מדיה.");
        return;
    }
    const newUploadItem = {
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      caption,
      highlightCategoryId,
      progress: 0,
      status: 'pending',
    };

    updateUploadQueue([...uploadQueueRef.current, newUploadItem]);
    setDisplayUploadQueue(uploadQueueRef.current);

    // Immediately hide preview screen and reset related states
    setShowPreviewScreen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadCaption('');

    showToast("info", "העלאה החלה...", "הקובץ שלך מועלה כעת ברקע.");
  };

  // Process individual item from queue
  useEffect(() => {
    const processNextUpload = async () => {
      // Find the first pending item and ensure no other upload is active
      const itemToProcess = uploadQueueRef.current.find(item => item.status === 'pending');

      if (itemToProcess && !isUploading) {
        setIsUploading(true);

        updateUploadQueue(
          uploadQueueRef.current.map(item =>
            item.id === itemToProcess.id ? { ...item, status: 'uploading', progress: 0 } : item
          )
        );
        setDisplayUploadQueue(uploadQueueRef.current);

        let progressInterval;
        try {
          // Simulate progress for UI, actual progress depends on UploadFile
          let currentProgress = 0;
          progressInterval = setInterval(() => {
            currentProgress = Math.min(currentProgress + 5, 95);
            updateUploadQueue(
              uploadQueueRef.current.map(item =>
                item.id === itemToProcess.id ? { ...item, progress: currentProgress } : item
              )
            );
            setDisplayUploadQueue(uploadQueueRef.current);
          }, 100);

          const uploadResult = await UploadFile({ file: itemToProcess.file });

          clearInterval(progressInterval);
          
          const mediaData = {
            event_id: eventId,
            file_url: uploadResult.file_url,
            file_type: 'image',
            uploader_name: currentUser ? currentUser.full_name : 'אורח',
            uploader_email: currentUser ? currentUser.email : null, // Store uploader's email for post-event delivery
            caption: itemToProcess.caption || null,
            status: 'approved',
            highlight_category_id: itemToProcess.highlightCategoryId || null,
            likes: 0,
            thumbnail_url: uploadResult.thumbnail_url || null,
            created_by: currentUser ? currentUser.email : null // Store uploader's email (works for both Google and guest users)
          };

          console.log('📧 Media upload with email tracking:', {
            uploader_name: mediaData.uploader_name,
            uploader_email: mediaData.uploader_email,
            created_by: mediaData.created_by,
            isGuest: currentUser?.isGuest || false
          });

          await MediaItem.create(mediaData);

          // Send notification to admins about new media upload
          try {
            await notifyMediaUploaded(
              { id: eventId, name: eventDetails?.name || 'אירוע ללא שם' },
              1, // Single file uploaded
              { name: currentUser ? currentUser.full_name : 'אורח' }
            );
            console.log('✅ Admin notification sent for media upload');
          } catch (notificationError) {
            console.warn('⚠️ Failed to send media upload notification:', notificationError);
          }

          updateUploadQueue(
            uploadQueueRef.current.map(item =>
              item.id === itemToProcess.id ? { ...item, status: 'completed', progress: 100 } : item
            )
          );
          setDisplayUploadQueue(uploadQueueRef.current);

          showToast("success", "קובץ הועלה בהצלחה!", `${itemToProcess.file.name || 'הקובץ'} נוסף לאלבום.`);
          loadMediaItems(eventId, guestEmailFromUrl); // Reload media including current guest's
          if(itemToProcess.highlightCategoryId) {
            loadHighlightCategories(eventId);
          }


          // Remove completed item from queue after a delay
          setTimeout(() => {
            updateUploadQueue(uploadQueueRef.current.filter(item => item.id !== itemToProcess.id));
            setDisplayUploadQueue(uploadQueueRef.current);
          }, 3000);

        } catch (err) {
          clearInterval(progressInterval);
          console.error("Upload error:", err);
          updateUploadQueue(
            uploadQueueRef.current.map(item =>
              item.id === itemToProcess.id ? { ...item, status: 'failed', progress: 0 } : item
            )
          );
          setDisplayUploadQueue(uploadQueueRef.current);
          showToast("error", "שגיאה בהעלאה", `לא הצלחנו להעלות את ${itemToProcess.file.name || 'הקובץ'}.`);
          // Keep failed item visible longer
          setTimeout(() => {
            updateUploadQueue(uploadQueueRef.current.filter(item => item.id !== itemToProcess.id));
            setDisplayUploadQueue(uploadQueueRef.current);
          }, 5000);
        } finally {
          setIsUploading(false);
        }
      }
    };

    // Make sure currentUser is available before processing uploads that need their name
    if (currentUser) {
        processNextUpload();
    }
  }, [displayUploadQueue, isUploading, eventId, eventDetails, loadMediaItems, loadHighlightCategories, currentUser, guestEmailFromUrl]);

  // User action from Preview Screen
  const handleConfirmUpload = (highlightId = null) => {
    if (!currentUser) {
        showToast("error", "שגיאה", "עליך להיות מחובר כדי להעלות מדיה.");
        return;
    }
    if (selectedFile) {
      addToUploadQueue(selectedFile, uploadCaption, highlightId);
      setShowPreviewScreen(false);
      setShowHighlightSheet(false);
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setShowPreviewScreen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadCaption('');
  };

  const handleHighlightClick = (categoryId) => {
    const category = highlightCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    showToast("info", `טוען ${category.name}...`);
    try {
      // Filter by highlight category and also by guestEmail if in personal album view
      const items = mediaItems.filter(item => 
        item.highlight_category_id === categoryId &&
        (isPersonalAlbumView ? item.created_by === guestEmailFromUrl : true)
      );

      if (items.length > 0) {
        setActiveStory({ isOpen: true, items: items, startIndex: 0 });
      } else {
        showToast("info", "קטגוריה ריקה", `אין עדיין תמונות או סרטונים ב-${category.name}.`);
      }
    }
    catch (err) {
      showToast("error", "שגיאה בטעינת היילייט", err.message);
    }
  };


  const handleMediaItemClick = (item) => {
    const currentIndex = mediaItems.findIndex(m => m.id === item.id);
    if (currentIndex !== -1) {
        setSelectedMediaItem(item);
        setCurrentMediaIndex(currentIndex);
        setShowMediaViewer(true);
    }
  };

  const handleNextMedia = () => {
    if (currentMediaIndex < mediaItems.length - 1) {
      const nextIndex = currentMediaIndex + 1;
      setSelectedMediaItem(mediaItems[nextIndex]);
      setCurrentMediaIndex(nextIndex);
    }
  };

  const handlePrevMedia = () => {
    if (currentMediaIndex > 0) {
      const prevIndex = currentMediaIndex - 1;
      setSelectedMediaItem(mediaItems[prevIndex]);
      setCurrentMediaIndex(prevIndex);
    }
  };

  const handleDownloadMedia = async (itemToDownload) => {
    if (!itemToDownload) itemToDownload = selectedMediaItem;
    if (!itemToDownload) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
    if (isMobile) {
        // Try native sharing first on mobile
        try {
            const response = await fetch(itemToDownload.file_url);
            const blob = await response.blob();
            const extension = itemToDownload.file_type === 'image' ? 'jpg' : 'mp4';
            const filename = `${eventDetails?.name || 'אלבום'}_${itemToDownload.uploader_name || 'קובץ'}.${extension}`;
            const file = new File([blob], filename, { type: blob.type });
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                const eventDate = eventDetails?.event_date ? new Date(eventDetails.event_date).toLocaleDateString('he-IL') : '';
                const shareText = `מתוך האירוע "${eventDetails?.name || 'אלבום'}"${eventDate ? ` - ${eventDate}` : ''} - באמצעות "סטרינגס"`;
                
                await navigator.share({
                    title: shareText,
                    text: shareText,
                    files: [file]
                });
                showToast("success", "שותף בהצלחה!", "בחר 'שמור לתמונות' כדי לשמור בגלריה."); 
                return;
            }
        } catch (error) {
            console.log('Native sharing not available, falling back to download');
        }
    }

    // Fallback to regular download
    try {
        const response = await fetch(itemToDownload.file_url);
        const blob = await response.blob();
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        
        const extension = itemToDownload.file_type === 'image' ? 'jpg' : 'mp4';
        const filename = `${eventDetails?.name || 'אלבום'}_${itemToDownload.uploader_name || 'קובץ'}.${extension}`;
        link.download = filename;
        link.setAttribute('target', '_blank');
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        const message = isMobile 
            ? "הקובץ הורד! בדפדפן Safari/Chrome: לחץ על הקובץ בתיקיית ההורדות ובחר 'שמור לתמונות'."
            : "הקובץ הורד בהצלחה!";
        
        showToast("success", "הורדה הושלמה", message); 
    } catch (error) {
        console.error('Download error:', error);
        showToast("error", "שגיאה בהורדה", "נסה שוב או צור קשר לתמיכה."); 
    }
  };

  const handleShareMedia = async (itemToShare) => {
    if (!itemToShare) itemToShare = selectedMediaItem;
    if (!itemToShare) return;

    if (navigator.share) {
      try {
        // Attempt to fetch the file as a blob for direct share
        const response = await fetch(itemToShare.file_url);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const blob = await response.blob();
        const fileExtension = itemToShare.file_url.split('.').pop()?.toLowerCase() || (itemToShare.file_type === 'image' ? 'jpg' : 'mp4');
        const fileName = `event_media_${itemToShare.id}.${fileExtension}`;
        
        // Create a File object from the blob
        const file = new File([blob], fileName, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          const eventDate = eventDetails?.event_date ? new Date(eventDetails.event_date).toLocaleDateString('he-IL') : '';
          const shareText = `מתוך האירוע "${eventDetails?.name || 'אלבום'}"${eventDate ? ` - ${eventDate}` : ''} - באמצעות "סטרינגס"`;
          
          await navigator.share({
            files: [file],
            title: shareText,
            text: itemToShare.caption ? `${itemToShare.caption}\n\n${shareText}` : shareText,
          });
          showToast("info", "שיתוף נפתח", "בחר כיצד לשתף את הקובץ.");
        } else {
          // Fallback to sharing URL if files cannot be shared or if specific file type is not supported for sharing
          const eventDate = eventDetails?.event_date ? new Date(eventDetails.event_date).toLocaleDateString('he-IL') : '';
          const shareText = `מתוך האירוע "${eventDetails?.name || 'אלבום'}"${eventDate ? ` - ${eventDate}` : ''} - באמצעות "סטרינגס"`;
          
          await navigator.share({
            title: shareText,
            text: itemToShare.caption ? `${itemToShare.caption}\n\n${shareText}\n\nצפו במדיה (לחץ על הקישור):` : `${shareText}\n\nצפו במדיה (לחץ על הקישור):`,
            url: itemToShare.file_url,
          });
          showToast("info", "שיתוף קישור נפתח", "הקובץ עצמו לא נתמך לשיתוף ישיר, במקום זה שותף קישור.");
        }
      } catch (error) {
        console.error('Error sharing file, falling back to URL share:', error);
        // Fallback to sharing URL if fetching blob or file creation fails
        try {
            const eventDate = eventDetails?.event_date ? new Date(eventDetails.event_date).toLocaleDateString('he-IL') : '';
            const shareText = `מתוך האירוע "${eventDetails?.name || 'אלבום'}"${eventDate ? ` - ${eventDate}` : ''} - באמצעות "סטרינגס"`;
            
            await navigator.share({
                title: shareText,
                text: itemToShare.caption ? `${itemToShare.caption}\n\n${shareText}\n\nצפו במדיה (לחץ על הקישור):` : `${shareText}\n\nצפו במדיה (לחץ על הקישור):`,
                url: itemToShare.file_url,
            });
            showToast("info", "שיתוף קישור נפתח", "אירעה שגיאה בשיתוף הקובץ, במקום זה שותף קישור.");
        } catch (shareUrlError) {
            console.error('Error sharing URL as fallback:', shareUrlError);
            navigator.clipboard.writeText(itemToShare.file_url);
            showToast("info", "קישור הועתק", "שיתוף נכשל, הקישור לקובץ הועתק.");
        }
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(itemToShare.file_url);
      showToast("info", "קישור הועתק", "דפדפן זה אינו תומך בשיתוף ישיר, הקישור לקובץ הועתק.");
    }
  };

  const handleLikeMediaItem = async (itemId, currentLikes) => {
    if (!currentUser) {
        showToast("error", "שגיאה", "עליך להיות מחובר כדי לתת לייק.");
        return;
    }

    const likeKey = `likedItems_event_${eventDetails.id}_user_${currentUser.id}`;

    if (likedItems.includes(itemId)) {
        showToast("info", "כבר אהבת את זה!", "תודה על האהבה 😊");
        return;
    }

    const newLikesCount = (currentLikes || 0) + 1;
    const newLikedItems = [...likedItems, itemId];

    // Optimistic UI Update
    setMediaItems(currentItems =>
        currentItems.map(item =>
            item.id === itemId ? { ...item, likes: newLikesCount } : item
        )
    );
    setLikedItems(newLikedItems);
    localStorage.setItem(likeKey, JSON.stringify(newLikedItems));

    try {
        await MediaItem.update(itemId, { likes: newLikesCount });
    } catch (error) {
        console.error("Error liking media item:", error);
        showToast("error", "שגיאה", "לא הצלחנו לשמור את הלייק שלך. נסה שוב.");

        // Revert UI on error
        setMediaItems(currentItems =>
            currentItems.map(item =>
                item.id === itemId ? { ...item, likes: currentLikes } : item
            )
        );
        const revertedLikedItems = likedItems.filter(id => id !== itemId);
        setLikedItems(revertedLikedItems);
        localStorage.setItem(likeKey, JSON.stringify(revertedLikedItems));
    }
  };

  // Wish submission functionality
  const handleWishSubmit = async (event) => {
    event.preventDefault();
    if (!wishText.trim()) {
      showToast("error", "ברכה ריקה", "אנא כתוב משהו לפני השליחה.");
      return;
    }
    if (!currentUser) {
        showToast("error", "שגיאה", "עליך להיות מחובר כדי לשלוח ברכה.");
        return;
    }

    setIsSubmittingWish(true);
    try {
      const { GuestWish } = await import('@/api/entities');
      await GuestWish.create({
        event_id: eventDetails.id,
        guest_name: guestName.trim() || (currentUser ? currentUser.full_name : 'אורח/ת נחמד/ה'),
        wish_text: wishText.trim(),
        approved: false
      });
      
      showToast("success", "🎉 ברכה נשלחה בהצלחה!", "תודה רבה! הברכה שלך נשלחה בהצלחה ותופיע באלבום לאחר אישור מארגן האירוע.");
      setWishText('');
      setGuestName('');
      setWishSubmitted(true);
      
      // Reset the submitted state after 3 seconds
      setTimeout(() => {
        setWishSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error submitting wish:", error);
      showToast("error", "שגיאה בשליחת הברכה", "נסה שוב מאוחר יותר.");
    } finally {
      setIsSubmittingWish(false);
    }
  };

  // Multi-select functionality
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedItems([]);
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems(displayedMedia.map(item => item.id));
  };

  const handleDeselectAll = () => {
    setSelectedItems([]);
    setIsMultiSelectMode(false);
  };

  const handleShareSelected = async () => {
    const selectedMediaItems = displayedMedia.filter(item => selectedItems.includes(item.id));
    
    if (selectedMediaItems.length === 0) {
        showToast("warn", "לא נבחרו פריטים", "אנא בחר תמונות או סרטונים לשיתוף.");
        return;
    }

    if (navigator.share) {
        try {
            // For multiple items, we'll try to share them as files if possible
            const files = [];
            let hasErrors = false;

            for (const item of selectedMediaItems) {
              try {
                const response = await fetch(item.file_url);
                if (!response.ok) continue;
                
                const blob = await response.blob();
                const fileExtension = item.file_url.split('.').pop()?.toLowerCase() || (item.file_type === 'image' ? 'jpg' : 'mp4');
                const fileName = `event_media_${item.id}.${fileExtension}`;
                
                const file = new File([blob], fileName, { type: blob.type });
                files.push(file);
              } catch (error) {
                console.error(`Error processing file ${item.id} for share:`, error);
                hasErrors = true;
              }
            }

            if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
                const eventDate = eventDetails?.event_date ? new Date(eventDetails.event_date).toLocaleDateString('he-IL') : '';
                const shareText = `מתוך האירוע "${eventDetails?.name || 'אלבום'}"${eventDate ? ` - ${eventDate}` : ''} - באמצעות "סטרינגס"`;
                
                await navigator.share({
                    files,
                    title: shareText,
                    text: `${files.length} תמונות וסרטונים\n\n${shareText}`
                });
                showToast("success", "שיתוף נפתח", `${files.length} קבצים נשלחו לשיתוף.`);
            } else {
                // Fallback: share URLs as text
                const eventDate = eventDetails?.event_date ? new Date(eventDetails.event_date).toLocaleDateString('he-IL') : '';
                const shareText = `מתוך האירוע "${eventDetails?.name || 'אלבום'}"${eventDate ? ` - ${eventDate}` : ''} - באמצעות "סטרינגס"`;
                const urls = selectedMediaItems.map(item => item.file_url).join('\n');
                
                await navigator.share({
                    title: shareText,
                    text: `${shareText}\n\nקישורים לתמונות וסרטונים:\n${urls}`
                });
                showToast("info", "שיתוף קישורים", "שותפו קישורים לקבצים (לא הקבצים עצמם).");
            }

            if (hasErrors) {
                showToast("warn", "חלק מהקבצים לא עובדו", "חלק מהקבצים לא יכלו להיטען לשיתוף.");
            }

        } catch (error) {
            console.error('Error sharing multiple files:', error);
            showToast("error", "שגיאה בשיתוף", "לא ניתן לשתף את הקבצים כרגע.");
        }
    } else {
        // Fallback for browsers that don't support navigator.share
        showToast("error", "שיתוף לא נתמך", "המכשיר שלך לא תומך בשיתוף ישיר, הקישורים יועתקו.");
        const urls = selectedMediaItems.map(item => item.file_url).join('\n');
        navigator.clipboard.writeText(urls);
        showToast("info", "קישורים הועתקו", "קישורים לקבצים הועתקו ללוח.");
    }
    handleDeselectAll();
  };

  const handleDownloadSelected = async () => {
    const selectedMediaItems = displayedMedia.filter(item => selectedItems.includes(item.id));
    
    if (selectedMediaItems.length === 0) {
        showToast("warn", "לא נבחרו פריטים", "אנא בחר תמונות או סרטונים להורדה.");
        return;
    }

    // Check if user is on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && selectedMediaItems.length === 1) {
        // For single item on mobile, try to use native sharing first
        try {
            const item = selectedMediaItems[0];
            const response = await fetch(item.file_url);
            const blob = await response.blob();
            const extension = item.file_type === 'image' ? 'jpg' : 'mp4';
            const filename = `${eventDetails?.name || 'אלבום'}_${item.uploader_name || 'קובץ'}.${extension}`;
            const file = new File([blob], filename, { type: blob.type });
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                const eventDate = eventDetails?.event_date ? new Date(eventDetails.event_date).toLocaleDateString('he-IL') : '';
                const shareText = `מתוך האירוע "${eventDetails?.name || 'אלבום'}"${eventDate ? ` - ${eventDate}` : ''} - באמצעות "סטרינגס"`;
                
                await navigator.share({
                    title: shareText,
                    text: shareText,
                    files: [file]
                });
                showToast("success", "שותף בהצלחה!", "התמונה נשמרה או שותפה באפליקציה שבחרת.");
                handleDeselectAll();
                return;
            }
        } catch (error) {
            console.log('Native sharing not available, falling back to download');
        }
    }

    showToast("info", "מתחיל הורדה", `מוריד ${selectedMediaItems.length} קבצים...`);

    let successCount = 0;
    for (let i = 0; i < selectedMediaItems.length; i++) {
        const item = selectedMediaItems[i];
        try {
            const response = await fetch(item.file_url);
            const blob = await response.blob();
            
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            
            // Create meaningful filename
            const extension = item.file_type === 'image' ? 'jpg' : 'mp4';
            const filename = `${eventDetails?.name || 'אלבום'}_${item.uploader_name || 'קובץ'}_${i + 1}.${extension}`;
            link.download = filename;
            
            // Set attributes for mobile optimization
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            successCount++;
            
            // Small delay between downloads to avoid overwhelming the browser
            if (i < selectedMediaItems.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        } catch (error) {
            console.error(`Error downloading ${item.file_url}:`, error);
            showToast("error", "שגיאה בהורדה", `לא ניתן להוריד קובץ מ-${item.uploader_name || 'לא ידוע'}`);
        }
    }

    if (successCount > 0) {
        const message = isMobile 
            ? `הורדו ${successCount} קבצים! בדפדפן Safari/Chrome: לחץ על הקבצים בתיקיית ההורדות ובחר "שמור לתמונות" כדי להעביר לגלריה.`
            : `הורדו ${successCount} קבצים בהצלחה!`;
        
        showToast("success", "הורדה הושלמה", message);
    }
    
    handleDeselectAll();
  };

  // Function to handle media filter change
  const handleFilterChange = (newFilterType) => {
    setMediaFilter(newFilterType);
    // When a media type filter is selected, always turn off the favorites filter
    setFavoritesFilterActive(false);
  };

  const handleToggleFavoritesFilter = () => {
    setFavoritesFilterActive(prev => {
      const newState = !prev;
      // If turning favorites ON, ensure the media type filter is set to 'all'
      // to display all types of favorited media.
      if (newState) {
        setMediaFilter('all');
      }
      return newState;
    });
  };

  // Derive displayedMedia based on current filters
  const displayedMedia = mediaItems
    .filter(item => {
      // If favorites filter is active, only show liked items.
      if (favoritesFilterActive) {
        return likedItems.includes(item.id);
      }
      // Otherwise, filter by media type.
      return item.file_type === mediaFilter;
    });

  const renderTermsModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <Card className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl w-full max-w-lg border-0 animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-bordeaux/10 dark:bg-[#d4a574]/10 p-3 rounded-full w-fit mb-3">
            <ShieldAlert className="h-10 w-10 text-bordeaux dark:text-[#d4a574]" />
          </div>
          <CardTitle className="text-2xl font-bold text-bordeaux dark:text-[#d4a574]">שימוש באלבום המשותף</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-700 dark:text-gray-300 text-base leading-relaxed px-6 pb-6">
          <p>שים לב! האלבום הינו אלבום משותף בו כל התכנים (תמונות, סרטונים וברכות) שהועלו על ידי כלל האורחים עשויים להיות גלויים לכל מי שיש לו גישה לאלבום זה.</p>
          <p>ניתן להוריד ולשתף מדיה מתוך האלבום ללא הגבלה. באחריותך לוודא שהתוכן שאתה מעלה הולם ואינו פוגעני.</p>
          <p className="font-semibold text-gray-800 dark:text-gray-200">שים לב כי באחריותך לקרוא את כל תנאי השימוש עם כניסתך לאלבום בלשונית ה"מידע" וכי שימוש באפליקציה מאשר את תנאים אלו.</p>
          <p className="mt-3 text-sm">בלחיצה על "מאשר וממשיך", הינך מאשר שקראת, הבנת ומסכים לתנאים אלו.</p>
        </CardContent>
        <CardFooter className="bg-gray-50/50 dark:bg-gray-700/30 p-5 border-t border-gray-200/50 dark:border-gray-600/50">
          <Button 
            onClick={handleAcceptTerms} 
            className="w-full btn-bordeaux h-12 text-lg font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-95"
          >
            מאשר וממשיך לאלבום
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  const renderMultiSelectActions = () => (
    <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-lg p-4 mb-4 border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm"
    >
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    נבחרו {selectedItems.length} פריטים
                </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <Button 
                    onClick={handleSelectAll} 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-9 px-3 rounded-full border-gray-300 hover:bg-gray-100"
                >
                    בחר הכל
                </Button>
                <Button 
                    onClick={handleDeselectAll} 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-9 px-3 rounded-full border-gray-300 hover:bg-gray-100"
                >
                    בטל בחירה
                </Button>
                <Button 
                    onClick={handleDownloadSelected} 
                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-9 px-3 rounded-full"
                    size="sm"
                >
                    <DownloadIcon className="w-4 h-4 ml-1" />
                    הורד נבחרים
                </Button>
                <Button 
                    onClick={handleShareSelected} 
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-3 rounded-full"
                    size="sm"
                >
                    <ShareIcon className="w-4 h-4 ml-1" />
                    שתף נבחרים
                </Button>
            </div>
        </div>
    </motion.div>
  );
  
  if (isLoading) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] p-6 text-center">
        <Loader2 className="w-12 h-12 text-bordeaux animate-spin mb-4" />
        <p className="text-lg text-gray-700">טוען פרטי אירוע...</p>
      </div>
    );
  }

  // Check if error is not an empty string
  if (error) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#FEFBF3] to-[#F4F4E6] p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">שגיאה</h2>
        <p className="text-md text-gray-700 mb-6">{error}</p>
        <Button asChild className="btn-bordeaux">
          <Link to={createPageUrl('MyEvents')}>חזרה</Link>
        </Button>
      </div>
    );
  }
  
  // Fallback if still loading or redirecting
  if (!eventDetails) { // Removed !currentUser check here, as personal album can view without current user auth
    return (
        <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] p-6">
            <Loader2 className="h-12 w-12 text-bordeaux animate-spin" />
            <p className="mt-4 text-gray-600">טוען נתוני אלבום...</p>
        </div>
    );
  }

  // Preview Screen Component (only shown if user has agreed and is in preview state)
  if (showPreviewScreen && selectedFile && previewUrl) {
    return (
      <div dir="rtl" className="fixed inset-0 bg-black text-white flex flex-col z-50">
        {/* Header with close button */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-gradient-to-b from-black/70 to-transparent z-10">
          {/* Close Button - Top Left (RTL context means right for visual left) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancelPreview}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full w-10 h-10"
          >
            <XIcon className="w-6 h-6" />
          </Button>
          <div></div>
          <div></div>
        </div>

        {/* Media preview - centered */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <img
            src={previewUrl}
            alt="תצוגה מקדימה"
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>

        {/* Caption input and Action buttons container */}
        <div className="p-4 bg-gradient-to-t from-black/70 to-transparent z-10">
          <Textarea
            value={uploadCaption}
            onChange={(e) => setUploadCaption(e.target.value)}
            placeholder="הוסף תיאור (אופציונלי)..."
            className="w-full p-3 mb-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 resize-none focus:ring-2 focus:ring-bordeaux-light"
            rows={2}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleConfirmUpload()}
              className="flex-1 bg-bordeaux hover:bg-bordeaux-dark text-white h-14 rounded-full text-lg font-medium shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              העלאה לאלבום
            </Button>
            {highlightCategories.length > 0 && (
              <Button
                variant="secondary"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 h-14 rounded-full text-lg font-medium shadow-lg flex items-center justify-center gap-2"
                onClick={() => setShowHighlightSheet(true)}
              >
                <Sparkles className="w-5 h-5" />
                הוסף ל-Highlight
              </Button>
            )}
          </div>
        </div>

        {/* Highlight Selection Sheet */}
        <Sheet open={showHighlightSheet} onOpenChange={setShowHighlightSheet}>
          <SheetContent 
            side="bottom" 
            className="rounded-t-2xl bg-[#FEFBF3] text-gray-900 border-t border-gray-200 max-h-[70vh] flex flex-col"
          >
            <SheetHeader className="p-4 border-b border-gray-200">
              <SheetTitle className="text-xl font-semibold text-center text-bordeaux">בחר קטגוריית Highlight</SheetTitle>
              <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                <XIcon className="h-5 w-5 text-gray-50" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </SheetHeader>
            <ScrollArea className="flex-1 p-1">
              <div className="space-y-2 p-3">
                {highlightCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant="ghost"
                    className="w-full justify-start h-14 px-4 py-3 rounded-lg text-left text-lg text-gray-700 hover:bg-[#F5F5DC]/70 focus:bg-[#F5F5DC]"
                    onClick={() => {
                      handleConfirmUpload(category.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-bordeaux">{renderHighlightIcon(category.icon_name)}</span>
                      <span>{category.name}</span>
                    </div>
                  </Button>
                ))}
                {highlightCategories.length === 0 && (
                  <p className="text-center text-gray-500 py-4">לא הוגדרו קטגוריות היילייטס לאירוע זה.</p>
                )}
              </div>
            </ScrollArea>
            <SheetFooter className="p-4 border-t border-gray-200">
               <Button variant="outline" onClick={() => setShowHighlightSheet(false)} className="w-full h-12 border-gray-300 hover:bg-gray-100 text-gray-700">
                 ביטול
               </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] text-gray-900">
      {/* Terms Modal - shows only once per event on this device/browser */}
      {showTermsModal && renderTermsModal()}
      {/* Header Section with LOGO */}
      <header className="sticky top-0 z-40 pt-6 pb-3 px-4 text-center relative overflow-hidden shadow-sm bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] backdrop-blur-md border-b border-gray-200/30">
        {/* Background image div - must be positioned absolutely to be behind everything */}
        {eventDetails?.cover_image_url && (
          <div className="absolute inset-0 z-0">
            <img
              src={eventDetails.cover_image_url}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-sm"
            />
             <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/5"></div>
          </div>
        )}
        {/* Content of the header - must have a higher z-index or be positioned relatively to appear on top */}
        <div className="relative z-10">
          <img 
            src={LOGO_URL_GUEST_ALBUM} 
            alt="Strings Logo" 
            className="h-28 sm:h-32 mx-auto mb-3"
          />
          {eventDetails && (
            <div>
              {isPersonalAlbumView ? (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold text-bordeaux title-main truncate px-4">
                    האלבום האישי של {guestNameFromUrl || 'האורח'}
                  </h1>
                  <p className="text-md text-gray-600">מתוך האירוע של {eventDetails.name}</p>
                </>
              ) : (
                <h1 className="text-xl sm:text-2xl font-bold text-bordeaux title-main truncate px-4">{eventDetails.name}</h1>
              )}
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-xs sm:text-sm text-gray-600 mt-1 opacity-80">
                {eventDetails.event_date && (
                  <span className="flex items-center">
                    <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 ml-1 rtl:mr-1 rtl:ml-0" />
                    {format(new Date(eventDetails.event_date), 'd.M.yy', { locale: he })}
                  </span>
                )}
                {eventDetails.location_text && (
                  <span className="flex items-center truncate">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 ml-1 rtl:mr-1 rtl:ml-0" />
                    <span className="truncate">{eventDetails.location_text}</span>
                  </span>
                )}
                {eventDetails.start_time && (
                   <span className="flex items-center">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 ml-1 rtl:mr-2 rtl:ml-0" />
                    {eventDetails.start_time}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Upload Status Banner */}
      {!uploadStatus.canUpload && (
        <div className="mx-4 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium text-orange-800">{uploadStatus.reason}</p>
              {uploadStatus.eventStartTime && (
                <p className="text-sm text-orange-700 mt-1">
                  האירוע מתחיל בתאריך: {format(new Date(uploadStatus.eventStartTime), 'dd/MM/yyyy בשעה HH:mm', { locale: he })}
                </p>
              )}
              {uploadStatus.timeRemaining && (
                <p className="text-sm text-orange-600 mt-1">זמן שנותר: {uploadStatus.timeRemaining}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {uploadStatus.canUpload && uploadStatus.timeRemaining && (
        <div className="mx-4 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">ניתן להעלות תמונות</p>
              <p className="text-sm text-green-600">זמן שנותר להעלאה: {uploadStatus.timeRemaining}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Highlights Row - Conditionally Rendered */}
      {highlightCategories.length > 0 && (
        <section className="py-4 sm:py-6 px-2 sm:px-6 lg:px-8 relative z-20">
          <h2 className="text-xl sm:text-2xl font-semibold text-bordeaux mb-3 sm:mb-4 text-center sm:text-right">Highlights</h2>
          <div className="flex justify-center">
            <ScrollArea className="w-auto max-w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-4 rtl:space-x-reverse pb-2 px-2">
                {highlightCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleHighlightClick(category.id)}
                    className="flex flex-col items-center justify-start w-20 sm:w-24 text-center group transition-transform hover:scale-105 active:scale-95 flex-shrink-0 focus:outline-none"
                    title={`צפה ב-${category.name}`}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-bordeaux/50 p-0.5 sm:p-1 flex items-center justify-center bg-white/70 shadow-md group-hover:shadow-lg transition-all group-hover:border-bordeaux">
                      <div className="w-full h-full rounded-full bg-[#F5F5DC] flex items-center justify-center text-bordeaux group-hover:bg-bordeaux/10">
                        {renderHighlightIcon(category.icon_name) || <ImageIconLucide className="w-7 h-7 sm:w-8 sm:h-8" />}
                      </div>
                    </div>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-gray-700 truncate w-full group-hover:text-bordeaux">
                      {category.name}
                    </p>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </section>
      )}
      
      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
          <div className="px-0 sm:px-2 md:px-4">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/90 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-lg min-h-[70px] sm:min-h-[80px] items-stretch">
              {[
                { value: "gallery", label: "גלריה", Icon: ImageIconLucide },
                { value: "wishes", label: "ברכות", Icon: Heart },
                { value: "info", label: "מידע", Icon: InfoIcon },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-3 sm:py-4 px-2 sm:px-3 text-sm sm:text-base font-medium transition-all duration-200 h-full whitespace-nowrap"
                  style={{
                    color: activeTab === tab.value ? 'white' : '#4B5563',
                    backgroundColor: activeTab === tab.value ? '#5C1A1B' : 'transparent',
                    boxShadow: activeTab === tab.value ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <tab.Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="mt-0" dir="rtl">
            <div className="space-y-6">
              {/* Gallery Controls (multi-select/share) */}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-2xl font-bold text-bordeaux">תמונות וסרטונים</h2>
                {mediaItems.length > 0 && (
                  <Button
                    onClick={toggleMultiSelectMode}
                    variant={isMultiSelectMode ? "default" : "outline"}
                    className={isMultiSelectMode ? "bg-bordeaux hover:bg-bordeaux-dark text-white" : "border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-white"}
                  >
                    {isMultiSelectMode ? "בטל בחירה מרובה" : "בחר מרובה"}
                  </Button>
                )}
              </div>

              {isMultiSelectMode && renderMultiSelectActions()}

              {/* NEW: Filter Buttons (media type + favorites) */}
              <div className="flex items-center justify-center flex-nowrap overflow-x-auto gap-2 mb-6 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md">
                {[
                    { type: 'image', label: 'תמונות', icon: ImageIconLucide }
                ].map(filter => (
                    <Button
                        key={filter.type}
                        onClick={() => handleFilterChange(filter.type)}
                        variant={mediaFilter === filter.type && !favoritesFilterActive ? "secondary" : "ghost"}
                        className={`px-3 py-2 h-10 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                            mediaFilter === filter.type && !favoritesFilterActive
                                ? 'bg-[#5C1A1B] text-white shadow-lg hover:bg-[#4a1516]'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        {filter.icon && <filter.icon className="w-4 h-4" />}
                        <span>{filter.label}</span>
                    </Button>
                ))}
                <Button
                    onClick={handleToggleFavoritesFilter}
                    variant={favoritesFilterActive ? "secondary" : "ghost"}
                    className={`px-3 py-2 h-10 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                        favoritesFilterActive
                            ? 'bg-[#5C1A1B] text-white shadow-lg hover:bg-[#4a1516]'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    <Heart className="w-4 h-4" />
                    <span>מועדפים</span>
                </Button>
              </div>

              {/* Media Grid */}
              {isLoadingMedia && (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-10 w-10 text-bordeaux animate-spin" />
                </div>
              )}
              {!isLoadingMedia && displayedMedia.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl mb-2">
                    {favoritesFilterActive ? "אין עדיין פריטים מועדפים" : "אין מדיה להצגה"}
                  </p>
                  <p>
                    {favoritesFilterActive ? "כדי לראות פריטים כאן, סמן אותם כ'מועדפים' באמצעות סמל הלב." : "כשהאורחים יעלו תמונות וסרטונים, הם יופיעו כאן."}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                    <motion.div
                        layout
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4"
                    >
                        {displayedMedia.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.03 }}
                                className="relative group"
                            >
                                {/* Like Button and Count */}
                                {currentUser && !isPersonalAlbumView && ( // Liked items logic applies only for general album view
                                  <div className="absolute top-2 left-2 z-10">
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleLikeMediaItem(item.id, item.likes);
                                          }}
                                          disabled={likedItems.includes(item.id)}
                                          className="bg-white/80 backdrop-blur-sm rounded-full p-2 text-red-500 disabled:text-red-400 disabled:cursor-not-allowed transition-transform active:scale-90 hover:scale-110 shadow-md"
                                      >
                                          <Heart
                                              className="w-5 h-5"
                                              fill={likedItems.includes(item.id) ? 'currentColor' : 'none'}
                                          />
                                      </button>
                                  </div>
                                )}

                                {/* Multi-select checkbox */}
                                {isMultiSelectMode && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => toggleItemSelection(item.id)}
                                            className="w-5 h-5 rounded border-2 border-white bg-white/80 checked:bg-bordeaux checked:border-bordeaux"
                                        />
                                    </div>
                                )}
                                
                                <div
                                    className={`aspect-square bg-gray-200 rounded-xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                                    isMultiSelectMode && selectedItems.includes(item.id) 
                                        ? 'ring-4 ring-bordeaux ring-opacity-60' 
                                        : ''
                                    }`}
                                    onClick={() => {
                                    if (isMultiSelectMode) {
                                        toggleItemSelection(item.id);
                                    } else {
                                        handleMediaItemClick(item);
                                    }
                                    }}
                                >
                                    <img
                                        src={item.thumbnail_url || item.file_url}
                                        alt={item.caption || 'תמונה מהאירוע'}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                                
                                {/* Media info overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-b-xl">
                                    <p className="text-white text-xs truncate">{item.caption || 'ללא תיאור'}</p>
                                    <p className="text-white/80 text-xs">{item.uploader_name || 'אורח'}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
              )}
            </div>
          </TabsContent>

          <TabsContent value="wishes" className="space-y-6" dir="rtl">
            {/* Wish Submission Form - Moved to the top */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-bordeaux text-center">שתף ברכה</CardTitle>
                <CardDescription className="text-gray-600 text-center">השאר ברכה חמה לבעלי השמחה</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWishSubmit} className="space-y-4">
                  <Input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="השם שלך"
                    className="text-lg rounded-xl h-12 border-gray-300 focus:border-bordeaux focus:ring-bordeaux/50"
                  />
                  <Textarea
                    value={wishText}
                    onChange={(e) => setWishText(e.target.value)}
                    placeholder="כתוב כאן את הברכה שלך..."
                    required
                    rows={4}
                    className="text-lg rounded-xl border-gray-300 focus:border-bordeaux focus:ring-bordeaux/50 resize-none"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmittingWish || !currentUser || isPersonalAlbumView} // Disable for personal album view
                    className={`w-full h-12 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-60 transition-all duration-300 ${
                      wishSubmitted ? 'bg-green-600 hover:bg-green-700 text-white' : 'btn-bordeaux'
                    }`}
                  >
                    {isSubmittingWish ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 ml-2 rtl:mr-2 rtl:ml-0" />
                        שולח ברכה...
                      </>
                    ) : wishSubmitted ? (
                      <>
                        <CheckCircle className="h-5 w-5 ml-2 rtl:mr-2 rtl:ml-0" />
                        ברכה נשלחה בהצלחה!
                      </>
                    ) : (
                      <>
                        <Heart className="h-5 w-5 ml-2 rtl:mr-2 rtl:ml-0" />
                        שלח ברכה
                      </>
                    )}
                  </Button>
                </form>
                {(!currentUser || isPersonalAlbumView) && (
                    <p className="text-center text-sm text-red-500 mt-2">
                      {isPersonalAlbumView ? "שליחת ברכות אינה זמינה במצב אלבום אישי." : "אנא התחבר כדי לשלוח ברכה."}
                    </p>
                )}
              </CardContent>
            </Card>
            
            {/* Approved Wishes - Now below the submission form */}
            <div className="space-y-4 pt-4">
              {approvedWishes.length === 0 && !isSubmittingWish ? (
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200/60 p-8 text-center">
                  <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">עדיין לא נשלחו ברכות (או שאושרו) לאירוע זה.</p>
                  <p className="text-gray-400 text-sm mt-2">הברצות שיאושרו על ידי מארגן האירוע יופיעו כאן.</p>
                </Card>
              ) : null}
              {approvedWishes.length > 0 && (
                 <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-4">ברכות שאושרו:</h3>
              )}
              {approvedWishes.map((wish) => (
                <Card key={wish.id} className="bg-gradient-to-br from-white/95 to-[#FFF8E7]/80 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200/60 overflow-hidden">
                  <CardContent className="p-6">
                    <blockquote className="text-lg text-gray-800 leading-relaxed mb-4 font-medium">
                      "{wish.wish_text}"
                    </blockquote>
                    <cite className="text-bordeaux font-semibold text-base">
                      — {wish.guest_name}
                    </cite>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="info" className="text-right" dir="rtl">
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
              <CardHeader className="pb-4 text-right">
                <CardTitle className="text-2xl font-semibold text-bordeaux dark:text-[#d4a574] text-right">מידע ויצירת קשר</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-right">נהנית מהאלבום? רוצה כזה גם לאירוע שלך?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-2 pb-8 px-6 text-right">
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-right">צור קשר עם STRINGS:</h3>
                  <div className="flex justify-center items-center space-x-6 rtl:space-x-reverse">
                    <a href="https://wa.me/972542565889" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600 transition-colors p-3 rounded-full bg-green-50 dark:bg-green-900/20">
                      <WhatsAppIcon className="w-8 h-8" />
                    </a>
                    <a href="mailto:stringsalbumapp@gmail.com" className="text-red-500 hover:text-red-600 transition-colors p-3 rounded-full bg-red-50 dark:bg-red-900/20">
                      <Mail className="w-8 h-8" />
                    </a>
                    <a href="https://www.instagram.com/stringsalbum?igsh=OGxxbGw5YmxrcjRm" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 transition-colors p-3 rounded-full bg-pink-50 dark:bg-pink-900/20">
                      <Instagram className="w-8 h-8" />
                    </a>
                  </div>
                </div>

                {/* תנאי שימוש והעלאת מדיה - מעודכן */}
                <div className="text-right bg-gray-50/80 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                  <h3 className="text-xl font-bold text-bordeaux dark:text-[#d4a574] mb-4 text-right">תנאי שימוש והעלאת מדיה</h3>
                  
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 text-base text-right">
                    <p className="font-medium mb-4 text-right">
                      על ידי העלאת תמונות וסרטונים ("מדיה") לאלבום האירוע של STRINGS ("השירות"), הנך מאשר ומסכים לתנאים הבאים:
                    </p>
                    
                    <div className="space-y-4 border-r-4 border-bordeaux/30 dark:border-[#d4a574]/30 pr-4 mr-2 text-right">
                      <p className="text-right">
                        <span className="font-semibold">1.</span> שים לב שהאלבום הינו אלבום משותף וכי לכל בעלי הגישה לאלבום תהיה הזכות לצפות, להוריד ולשתף מדיה ללא הגבלה. באחריותך לשים לב לתוכן שעולה על ידך לאלבום.
                      </p>
                      
                      <p className="text-right">
                        <span className="font-semibold">2.</span> הנך מעניק ל-STRINGS ולמארגני האירוע רישיון לא בלעדי, עולמי, ללא תמלוגים, להשתמש, לשכפל, להפיץ, להציג ולבצע את המדיה שהועלתה במסגרת השירות ובקשר לאירוע הספציפי.
                      </p>
                      
                      <p className="text-right">
                        <span className="font-semibold">3.</span> חל איסור מוחלט להעלות מדיה פוגענית, בלתי חוקית, מאיימת, מטרידה, גזענית, או כזו המפרה זכויות צד שלישי כלשהו, לרבות קטינים.
                      </p>
                      
                      <p className="text-right">
                        <span className="font-semibold">4.</span> STRINGS ומארגני האירוע שומרים לעצמם את הזכות המלאה לסרב להעלות, להסיר או לערוך כל מדיה לפי שיקול דעתם הבלעדי, ללא הודעה מוקדמת.
                      </p>
                      
                      <p className="text-right">
                        <span className="font-semibold">5.</span> הנך פוטר את STRINGS, עובדיו, מנהליו ומי מטעמה, וכן את מארגני האירוע, מכל אחריות לכל נזק, ישיר או עקיף, שעלול לקרות לך או לצד שלישי כתוצאה מהעלאת המדיה או השימוש בה.
                      </p>
                      
                      <p className="text-right">
                        <span className="font-semibold">6.</span> שים לב כי האלבום המשותף ימחק אוטומטית 14 יום לאחר תאריך האירוע וכי לא יהיה ניתן עוד לצפות בתוכן האלבום. ניתן לצפות באלבום, לשמור ולשתף את המדיה לפני מחיקתה ולא יהיה ניתן לשחזר מדיה שנמחקה.
                      </p>
                      <p className="text-right">
                        <span className="font-semibold">7.</span> שים לב כי ניתן להעלות תמונות רק במהלך 24 שעות מתחילת האירוע. לא ניתן להעלות תמונות לפני או אחרי חלון זמן זה.
                      </p>
                      <p className="text-right">
                        <span className="font-semibold">8.</span> האירוע וכל המדיה שלו ימחקו אוטומטית 14 ימים לאחר תאריך סיום האירוע. הקפד לגבות את התמונות שלך לפני המחיקה.
                      </p>
                    </div>
                    
                  </div>
                </div>

                {/* Logo instead of text footer */}
                <div className="mt-8 flex justify-center">
                  <img 
                    src={LOGO_URL_GUEST_ALBUM} 
                    alt="STRINGS Events Logo" 
                    className="h-16 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      {/* Upload Progress Indicator */}
      {displayUploadQueue.length > 0 && (
        <div className="fixed top-4 left-4 rtl:right-4 rtl:left-auto z-50 space-y-2">
          {displayUploadQueue.map((upload) => (
            <div key={upload.id} className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg min-w-[200px] text-gray-900">
              <div className="flex items-center gap-2 mb-2">
                {upload.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                {upload.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {upload.status === 'failed' && <XIcon className="w-4 h-4 text-red-500" />}
                {upload.status === 'pending' && <Loader2 className="w-4 h-4 text-gray-500" />}
                <span className="text-sm font-medium">
                  {upload.status === 'pending' && 'ממתין להעלאה...'}
                  {upload.status === 'uploading' && 'מעלה...'}
                  {upload.status === 'completed' && 'הועלה בהצלחה!'}
                  {upload.status === 'failed' && 'שגיאה בהעלאה'}
                </span>
              </div>
              {(upload.status === 'uploading' || upload.status === 'pending') && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  ></div>
                </div>
              )}
              {upload.status === 'failed' && (
                <p className="text-xs text-red-600 mt-1">נסה שוב או בדוק את חיבור האינטרנט.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileFromGallery}
        accept="image/*"
        className="hidden"
      />

      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileFromCamera}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Floating Action Buttons - Now on the left, hidden if personal album view or upload not allowed */}
      {uploadStatus.canUpload && activeTab === 'gallery' && !isMultiSelectMode && currentUser && !isPersonalAlbumView && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          <Button
            onClick={() => galleryInputRef.current?.click()}
            size="icon"
            className="w-16 h-16 rounded-full text-bordeaux shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center"
            title="העלה מהגלריה"
            style={{ backgroundColor: 'var(--color-beige-cream)', color: 'var(--color-bordeaux)' }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bordeaux-light)'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-beige-cream)'; e.currentTarget.style.color = 'var(--color-bordeaux)'; }}
          >
            <Upload className="w-7 h-7" />
          </Button>

          <Button
            onClick={() => cameraInputRef.current?.click()}
            size="icon"
            className="w-16 h-16 rounded-full bg-bordeaux hover:bg-bordeaux-dark text-white shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center"
            title="צלם תמונה/סרטון"
          >
            <Camera className="w-7 h-7" />
          </Button>
        </div>
      )}

      {/* Highlight Story View Modal */}
      {activeStory.isOpen && (
        <HighlightStoryView
          items={activeStory.items}
          startIndex={activeStory.startIndex}
          onClose={() => setActiveStory({ isOpen: false, items: [], startIndex: 0 })}
          eventName={eventDetails?.name}
        />
      )}

      {/* Single Media Viewer Modal */}
      {showMediaViewer && selectedMediaItem && (
        <MediaViewerModal
          item={selectedMediaItem}
          isOpen={showMediaViewer}
          onClose={() => setShowMediaViewer(false)}
          onDownload={() => handleDownloadMedia(selectedMediaItem)}
          onShare={() => handleShareMedia(selectedMediaItem)}
          onPrev={handlePrevMedia}
          onNext={handleNextMedia}
          canPrev={currentMediaIndex > 0}
          canNext={currentMediaIndex < mediaItems.length - 1}
        />
      )}

      {/* Global Styles for custom colors */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --color-bordeaux: #5C1A1B;
          --color-bordeaux-dark: #4a1516;
          --color-bordeaux-light: #8c2b2d;
          --color-peach: #FFDAB9;
          --color-beige-cream: #F5F5DC;
          --color-gold-accent: #DAA520;
        }
        .title-main {
          font-family: 'Playfair Display', serif;
        }
        .btn-bordeaux {
          background-color: var(--color-bordeaux);
          color: white;
        }
        .btn-bordeaux:hover {
          background-color: var(--color-bordeaux-dark);
        }
      `}} />
    </div>
  );
}
