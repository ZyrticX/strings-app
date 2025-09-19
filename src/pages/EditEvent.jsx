
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Event } from '@/api/entities';
import { MediaItem } from '@/api/entities';
import { HighlightCategory } from '@/api/entities';
import { GuestWish } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { SendEmail } from '@/api/integrations';
import { EventNotification } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
    Calendar as CalendarIcon, ImageUp, Save, Loader2, Trash2, Users, Eye, Copy, Download as DownloadIcon,
    AlertTriangle, CheckCircle, Clock, Plus, ChevronRight, ChevronLeft, Video as VideoIconLucideCore, MessageSquare,
    Tag, Heart, Music2, GlassWater, Cake, Gift, PartyPopper, Camera as CameraIcon,
    Mic2, Presentation, Coffee, Smile, ThumbsUp, MapPin, Sun, Moon, Sparkles, Megaphone, Palette,
    ShoppingBag, Briefcase, GraduationCap, Plane, Ship, Car, Bike, TreeDeciduous,
    Flower2, Award, Trophy, Film, Clapperboard, Ticket, Baby, Dog, Cat, ScrollText, Disc3, Search, XCircle, LinkIcon,
    PackageOpen, ImageIcon, VideoIcon, MonitorPlay, Shield,
    Share2, Send, Mail, Edit, Settings
} from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays, isPast, addMonths, parseISO, addDays } from "date-fns";
import { checkEventDeletion, getEventStatus } from '@/utils/eventTimeValidation';
import { he } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import { notifyEventUpdated, notifyEventDeleted } from '@/utils/notificationManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from '@/components/ui/checkbox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User } from '@/api/entities';
import GoogleDriveBackup from '../components/GoogleDriveBackup';

const eventTypes = [
    { value: "wedding", label: "חתונה" },
    { value: "corporate", label: "ערב חברה" },
    { value: "birthday", label: "יום הולדת" },
    { value: "bar_mitzvah", label: "בר מצווה" },
    { value: "bat_mitzvah", label: "בת מצווה" },
    { value: "bachelor_party", label: "מסיבת רווקות/רווקים" },
    { value: "henna", label: "חינה" },
    { value: "party", label: "מסיבה" },
    { value: "other", label: "אחר" },
];

const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hours = String(Math.floor(i / 2)).padStart(2, '0');
    const minutes = String((i % 2) * 30).padStart(2, '0');
    return `${hours}:${minutes}`;
});

const defaultRadiusKm = 1;

const highlightIconsListEdit = [
    { name: 'Users', Icon: Users }, { name: 'Heart', Icon: Heart }, { name: 'Music2', Icon: Music2 },
    { name: 'GlassWater', Icon: GlassWater }, { name: 'Cake', Icon: Cake }, { name: 'Gift', Icon: Gift },
    { name: 'PartyPopper', Icon: PartyPopper }, { name: 'CameraIcon', Icon: CameraIcon }, { name: 'VideoIconLucideCore', Icon: VideoIconLucideCore },
    { name: 'Mic2', Icon: Mic2 }, { name: 'Presentation', Icon: Presentation }, { name: 'Coffee', Icon: Coffee },
    { name: 'Smile', Icon: Smile }, { name: 'ThumbsUp', Icon: ThumbsUp }, { name: 'MapPin', Icon: MapPin },
    { name: 'Sun', Icon: Sun }, { name: 'Moon', Icon: Moon }, { name: 'Sparkles', Icon: Sparkles },
    { name: 'Megaphone', Icon: Megaphone }, { name: 'Palette', Icon: Palette }, { name: 'ShoppingBag', Icon: ShoppingBag },
    { name: 'Briefcase', Icon: Briefcase }, { name: 'GraduationCap', Icon: GraduationCap }, { name: 'Plane', Icon: Plane },
    { name: 'Ship', Icon: Ship }, { name: 'Car', Icon: Car }, { name: 'Bike', Icon: Bike },
    { name: 'TreeDeciduous', Icon: TreeDeciduous }, { name: 'Flower2', Icon: Flower2 }, { name: 'Award', Icon: Award },
    { name: 'Trophy', Icon: Trophy }, { name: 'Film', Icon: Film }, { name: 'Clapperboard', Icon: Clapperboard },
    { name: 'Ticket', Icon: Ticket }, { name: 'Baby', Icon: Baby }, { name: 'Dog', Icon: Dog }, { name: 'Cat', Icon: Cat },
    { name: 'ScrollText', Icon: ScrollText }, { name: 'Disc3', Icon: Disc3 }
];

const MEDIA_ITEMS_PER_PAGE = 12;
const GUEST_WISHES_PER_PAGE = 10;
const ADVANCE_PAYMENT_FIXED_AMOUNT_EDIT = 500; // Default or fallback for display if eventDetails.advance_payment_amount is not set

const STRINGS_INTERNAL_EMAIL = "stringsalbumapp@gmail.com"; // Define your internal email address

export default function EditEventPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [eventId, setEventId] = useState(null);
    const [eventDetails, setEventDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditable, setIsEditable] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    // Event details fields
    const [eventName, setEventName] = useState('');
    const [eventType, setEventType] = useState('');
    const [eventDate, setEventDate] = useState(null);
    const [startTime, setStartTime] = useState('');
    const [locationText, setLocationText] = useState('');
    const [braceletsCount, setBraceletsCount] = useState('');
    const [guestCountEstimate, setGuestCountEstimate] = useState('');
    const [organizerPhoneNumber, setOrganizerPhoneNumber] = useState('');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [guestThankYouMessage, setGuestThankYouMessage] = useState('');
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [previewCoverImageUrl, setPreviewCoverImageUrl] = useState('');
    const [allowVideoUploads, setAllowVideoUploads] = useState(true);
    const [accessCode, setAccessCode] = useState('');
    const [advancePaymentStatus, setAdvancePaymentStatus] = useState('pending_payment');
    const [totalDealAmount, setTotalDealAmount] = useState('');
    const [advancePaymentAmount, setAdvancePaymentAmount] = useState('');

    // Event deletion status
    const [deletionStatus, setDeletionStatus] = useState({ shouldDelete: false, daysUntilDeletion: null });

    // Highlight categories
    const [highlightCategories, setHighlightCategories] = useState([]);
    const [newHighlightName, setNewHighlightName] = useState('');
    const [newHighlightIcon, setNewHighlightIcon] = useState('');

    // Media management
    const [mediaItems, setMediaItems] = useState([]);
    const [pendingMediaItems, setPendingMediaItems] = useState([]);
    const [approvedMediaItems, setApprovedMediaItems] = useState([]);
    const [selectedMediaItems, setSelectedMediaItems] = useState([]);
    const [currentMediaPage, setCurrentMediaPage] = useState(1);
    const [mediaFilter, setMediaFilter] = useState('all');

    // Guest Wishes Management
    const [guestWishes, setGuestWishes] = useState([]);
    const [pendingWishes, setPendingWishes] = useState([]);
    const [approvedWishes, setApprovedWishes] = useState([]);
    const [currentWishPage, setCurrentWishPage] = useState(1);
    const [wishFilter, setWishFilter] = useState('all');

    const [activeTab, setActiveTab] = useState('details');
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const [originalEventDetailsForCompare, setOriginalEventDetailsForCompare] = useState(null);

    const [isSendingEmails, setIsSendingEmails] = useState(false);

    const safeShowToast = (type, title, description) => {
        if (window.showToast && typeof window.showToast === 'function') {
            window.showToast(type, title, description);
        } else {
            console[type === 'error' ? 'error' : 'log'](`Fallback Toast (${type}): ${title} - ${description}`);
            if (type === 'error' || type === 'warn') {
                alert(`${title}: ${description}`);
            }
        }
    };

    useEffect(() => {
        const fetchUserAndEvent = async () => {
            setIsLoading(true);
            let idToUse = null;
            try {
                const user = await User.me();
                setCurrentUser(user);

                const params = new URLSearchParams(location.search);
                let idFromParams = params.get('id');

                console.log("EditEvent - Parsed 'id' from URL params:", idFromParams);

                if (idFromParams && idFromParams.trim() !== '') {
                    idToUse = idFromParams;
                } else {
                    console.warn("EditEvent - 'id' not found in URL params. Attempting to read from localStorage.");
                    const idFromLocalStorage = localStorage.getItem('currentEditingEventId');
                    if (idFromLocalStorage) {
                        console.log("EditEvent - Found 'id' in localStorage:", idFromLocalStorage);
                        idToUse = idFromLocalStorage;
                    } else {
                        console.error("EditEvent - 'id' not found in URL params or localStorage.");
                    }
                }

                if (idToUse) {
                    setEventId(idToUse);
                    await fetchEventDetails(idToUse, user);
                    await fetchMediaItems(idToUse);
                    await fetchHighlightCategories(idToUse);
                    await fetchGuestWishes(idToUse);
                } else {
                    const errorMsg = `EditEvent - No valid ID found in URL params or localStorage. Raw location.search was: "${location.search}".`;
                    console.error(errorMsg);

                    navigate(createPageUrl('MyEvents'));
                    setTimeout(() => {
                        safeShowToast("error", "מזהה אירוע לא תקין", "לא סופק מזהה אירוע. מועבר לדף האירועים שלך.");
                    }, 200);
                    setIsLoading(false);
                    return;
                }
            } catch (userError) {
                console.error("EditEvent - User authentication error:", userError);
                navigate(createPageUrl('MyEvents'));
                setTimeout(() => {
                    safeShowToast("error", "שגיאת אימות", "יש להתחבר כדי לערוך אירוע. מועבר לדף האירועים שלך.");
                }, 200);
                setIsLoading(false);
                return;
            }
        };

        fetchUserAndEvent();

        return () => {
            // localStorage.removeItem('currentEditingEventId'); // Consider if this cleanup is needed
        };

    }, [location.search, navigate]);

    const fetchEventDetails = async (currentEventId, user) => {
        console.log("EditEvent - Attempting to fetch event details for ID:", currentEventId);
        
        // First verify event exists
        console.log("EditEvent - Verifying event exists:", currentEventId);
        
        try {
            const { data: eventCheck, error: checkError } = await supabase
                .from('events')
                .select('id')
                .eq('id', currentEventId)
                .single();
            
            if (checkError || !eventCheck) {
                console.error(`EditEvent - Event not found: ${currentEventId}`, checkError);
                safeShowToast("error", "אירוע לא קיים", "האירוע שביקשת לערוך לא קיים במערכת. ייתכן שהוא נמחק או שהמזהה שגוי.");
                navigate(createPageUrl('MyEvents'));
                setIsLoading(false);
                return;
            }
            
            console.log("EditEvent - Event exists, proceeding with fetch");
        } catch (error) {
            console.error(`EditEvent - Error checking event existence:`, error);
            safeShowToast("error", "שגיאה בבדיקת האירוע", "אירעה שגיאה בעת בדיקת קיום האירוע.");
            navigate(createPageUrl('MyEvents'));
            setIsLoading(false);
            return;
        }
        
        try {
            const event = await Event.get(currentEventId);
            console.log("EditEvent - Fetched event:", event);

            if (!event) {
                console.error(`EditEvent - Event not found for ID: ${currentEventId}`);
                safeShowToast("error", "אירוע לא נמצא", `האירוע עם המזהה ${currentEventId} לא קיים במערכת.`);
                navigate(createPageUrl('MyEvents'));
                setIsLoading(false);
                return;
            }

            // Check permissions - only creator or admin can edit
            // Check both user.id (UUID) and user.email for backward compatibility
            const isEventCreator = event.created_by === user.id || event.created_by === user.email;
            const isAdmin = user.role === 'admin';
            
            if (!isEventCreator && !isAdmin) {
                safeShowToast("error", "גישה נדחתה", "אין לך הרשאה לערוך אירוע זה.");
                navigate(createPageUrl('MyEvents'));
                setIsLoading(false);
                return;
            }

            setEventDetails(event);
            // Populate state from eventDetails
            setEventName(event.name || '');
            setEventType(event.event_type || '');
            setEventDate(event.event_date ? parseISO(event.event_date) : null);
            setStartTime(event.start_time || '');
            setLocationText(event.location_text || '');
            setBraceletsCount(event.bracelets_count ? event.bracelets_count.toString() : '');
            setGuestCountEstimate(event.guest_count_estimate ? event.guest_count_estimate.toString() : '');
            setOrganizerPhoneNumber(event.organizer_phone_number || '');
            setWelcomeMessage(event.welcome_message || '');
            setGuestThankYouMessage(event.guest_thank_you_message || '');
            setPreviewCoverImageUrl(event.cover_image_url || '');
            setAllowVideoUploads(event.allow_video_uploads !== undefined ? event.allow_video_uploads : true);
            setAccessCode(event.access_code || '');
            setAdvancePaymentStatus(event.advance_payment_status || 'pending_payment');
            setTotalDealAmount(event.total_deal_amount ? event.total_deal_amount.toString() : '');
            setAdvancePaymentAmount(event.advance_payment_amount ? String(event.advance_payment_amount) : (event.advance_payment_fixed_amount ? String(event.advance_payment_fixed_amount) : ''));

            // Deep copy for comparison
            setOriginalEventDetailsForCompare(JSON.parse(JSON.stringify(event)));

            // Check event deletion status
            const eventDeletionStatus = checkEventDeletion(event);
            setDeletionStatus(eventDeletionStatus);

            if (event.event_date) {
                const eventDateObj = parseISO(event.event_date);
                const oneMonthAfterEvent = addMonths(eventDateObj, 1);
                if (isPast(oneMonthAfterEvent)) {
setIsEditable(false);
                    safeShowToast("info", "תקופת העריכה הסתיימה", "לא ניתן לערוך אירוע זה כיוון שעבר יותר מחודש מתאריך האירוע.");
                }
            }

        } catch (error) {
            console.error(`Error fetching event details for edit (ID: ${currentEventId}):`, error);
            
            // More specific error handling
            if (error.response?.status === 500 || error.message?.includes('Object not found')) {
                safeShowToast("error", "האירוע לא נמצא", "האירוע שביקשת לערוך לא קיים במערכת. ייתכן שהוא נמחק או שהמזהה שגוי.");
            } else if (error.response?.status === 403) {
                safeShowToast("error", "אין הרשאה", "אין לך הרשאה לגשת לאירוע זה.");
            } else if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
                safeShowToast("error", "בעיית רשת", "בדוק את החיבור לאינטרנט ונסה שוב.");
            } else {
                safeShowToast("error", "שגיאה בטעינת האירוע", "ייתכן שהאירוע נמחק או שיש בעיה זמנית. נסה שוב מאוחר יותר.");
            }
            
            navigate(createPageUrl('MyEvents'));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHighlightCategories = async (id) => {
        try {
            const categories = await HighlightCategory.filter({ event_id: id }, 'display_order');
            setHighlightCategories(categories);
        } catch (error) {
            console.error("Error fetching highlight categories:", error);
            safeShowToast("error", "שגיאה בטעינת קטגוריות ההיילייט.", error?.message);
        }
    };

    const fetchMediaItems = async (id) => {
        try {
            const allMedia = await MediaItem.filter({ event_id: id }, '-created_date');
            setMediaItems(allMedia);
            setPendingMediaItems(allMedia.filter(item => item.status === 'pending' || !item.status));
            setApprovedMediaItems(allMedia.filter(item => item.status === 'approved'));
        } catch (error) {
            console.error("Error fetching media items:", error);
            safeShowToast("error", "שגיאה בטעינת פריטי המדיה.", error?.message);
        }
    };

    const fetchGuestWishes = async (eventId) => {
        try {
            const allWishes = await GuestWish.filter({ event_id: eventId }, '-created_date');
            setGuestWishes(allWishes);
            setPendingWishes(allWishes.filter(wish => !wish.approved));
            setApprovedWishes(allWishes.filter(wish => wish.approved));
        } catch (error) {
            console.error("Error fetching guest wishes:", error);
            safeShowToast("error", "שגיאה בטעינת הברכות מהאורחים.", error?.message);
        }
    };

    const keyMap = {
        name: "שם האירוע",
        event_type: "סוג האירוע",
        event_date: "תאריך",
        start_time: "שעת התחלה",
        location_text: "מיקום",
        bracelets_count: "כמות צמידים",
        guest_count_estimate: "אורחים (הערכה)",
        organizer_phone_number: "טלפון מארגן",
        welcome_message: "הודעת פתיחה",
        guest_thank_you_message: "הודעת תודה לאורחים",
        cover_image_url: "תמונת נושא (URL)",
        allow_video_uploads: "אפשר העלאת וידאו",
        total_deal_amount: "סכום עסקה כולל",
        advance_payment_amount: "סכום מקדמה ששולם/נדרש",
        advance_payment_status: "סטטוס מקדמה"
    };

    const displayValue = (value, key) => {
        if (value === null || value === undefined || value === "") return "<em>ריק</em>";
        if (key === 'event_type') return eventTypes.find(et => et.value === value)?.label || value;
        if (key === 'event_date' && value) {
            try { return format(parseISO(value), "PPP", { locale: he }); } catch(e) { return value; }
        }
        if (key === 'allow_video_uploads') return "תמונות בלבד";
        if (key === 'advance_payment_status') {
            const statusMap = {
                pending_creation: "ממתין ליצירה",
                pending_payment: "ממתין לתשלום",
                paid: "שולם",
                failed: "נכשל"
            };
            return statusMap[value] || value;
        }
        return String(value);
    };

    // Validation function for event data
    const validateEventData = () => {
        if (!braceletsCount || isNaN(parseInt(braceletsCount)) || parseInt(braceletsCount) <= 0) {
            safeShowToast("error", "כמות צמידים לא תקינה", "אנא הזן כמות צמידים חיובית.");
            return false;
        }
        if (guestCountEstimate && (isNaN(parseInt(guestCountEstimate)) || parseInt(guestCountEstimate) < 0)) {
            safeShowToast("error", "כמות אורחים לא תקינה", "כמות האורחים חייבת להיות מספר חיובי (או להישאר ריקה).");
            return false;
        }
        if (!totalDealAmount || isNaN(parseFloat(totalDealAmount)) || parseFloat(totalDealAmount) <= 0) {
            safeShowToast("error", "סכום עסקה לא תקין", "אנא הזן סכום עסקה כולל חיובי.");
            return false;
        }
        return true;
    };

    // Delete all media function
    const handleDeleteAllMedia = async () => {
        if (!eventId || !currentUser) {
            safeShowToast("error", "גישה נדחתה", "עליך להיות מחובר לביצוע פעולה זו.");
            return;
        }

        const isEventCreator = eventDetails?.created_by === currentUser.id || eventDetails?.created_by === currentUser.email;
        const isAdmin = currentUser.role === 'admin';
        
        if (!isEventCreator && !isAdmin) {
            safeShowToast("error", "גישה נדחתה", "רק יוצר האירוע או מנהלים יכולים למחוק את כל המדיה.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Get all media items for this event
            const allMedia = await MediaItem.filter({ event_id: eventId });
            
            // Delete each media item
            for (const media of allMedia) {
                await MediaItem.delete(media.id);
            }
            
            // Refresh media lists
            await fetchMediaItems(eventId);
            
            safeShowToast("success", "המדיה נמחקה", `${allMedia.length} קבצי מדיה נמחקו בהצלחה.`);
        } catch (error) {
            console.error("Error deleting all media:", error);
            safeShowToast("error", "שגיאה במחיקת המדיה", "לא ניתן למחוק את כל המדיה. נסה שוב.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete entire event function
    const handleDeleteEvent = async () => {
        if (!eventId || !currentUser) {
            safeShowToast("error", "גישה נדחתה", "עליך להיות מחובר לביצוע פעולה זו.");
            return;
        }

        const isEventCreator = eventDetails?.created_by === currentUser.id || eventDetails?.created_by === currentUser.email;
        const isAdmin = currentUser.role === 'admin';
        
        if (!isEventCreator && !isAdmin) {
            safeShowToast("error", "גישה נדחתה", "רק יוצר האירוע או מנהלים יכולים למחוק אירועים.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Send notification before deletion (while we still have event data)
            try {
                await notifyEventDeleted(eventDetails, currentUser);
                console.log('✅ Admin notification sent for event deletion:', eventId);
            } catch (notificationError) {
                console.warn('⚠️ Failed to send deletion notification:', notificationError);
            }

            // Delete the event (this should cascade delete related data due to foreign keys)
            await Event.delete(eventId);
            
            safeShowToast("success", "האירוע נמחק", "האירוע וכל המדיה הקשורה אליו נמחקו בהצלחה.");
            
            // Navigate back to events list
            navigate(createPageUrl('MyEvents'));
        } catch (error) {
            console.error("Error deleting event:", error);
            safeShowToast("error", "שגיאה במחיקת האירוע", "לא ניתן למחוק את האירוע. נסה שוב.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateEventDetails = async () => {
        if (!eventDetails?.id) {
            safeShowToast("error", "שגיאה", "לא ניתן לשמור שינויים - מזהה האירוע חסר.");
            return;
        }
        if (!isEditable) {
            safeShowToast("error", "לא ניתן לערוך", "תקופת העריכה לאירוע זה הסתיימה.");
            return;
        }
        if (!validateEventData()) return;

        setIsSubmitting(true);
        let uploadedCoverImageUrl = previewCoverImageUrl;

        try {
            if (coverImageFile) {
                const uploadResult = await UploadFile({ file: coverImageFile });
                uploadedCoverImageUrl = uploadResult.file_url;
            }

            const updatedEventData = {
                name: eventName,
                event_type: eventType,
                event_date: eventDate ? format(eventDate, "yyyy-MM-dd") : null,
                start_time: startTime,
                location_text: locationText,
                bracelets_count: braceletsCount ? parseInt(braceletsCount) : null,
                guest_count_estimate: guestCountEstimate ? parseInt(guestCountEstimate) : null,
                organizer_phone_number: organizerPhoneNumber,
                welcome_message: welcomeMessage,
                guest_thank_you_message: guestThankYouMessage,
                cover_image_url: uploadedCoverImageUrl,
                allow_video_uploads: false,
                auto_approve_media: true,
                total_deal_amount: parseFloat(totalDealAmount),
                advance_payment_amount: advancePaymentAmount ? parseFloat(advancePaymentAmount) : null,
            };

            // Only admins can update payment status
            if (currentUser?.role === 'admin') {
                updatedEventData.advance_payment_status = advancePaymentStatus;
                console.log('🔐 Admin updating payment status to:', advancePaymentStatus);
            } else {
                console.log('👤 Non-admin user - payment status will not be updated');
            }

            await Event.update(eventId, updatedEventData);

            let changesMadeForInternalEmail = [];
            let structuralChangesForNotifications = {};

            if (originalEventDetailsForCompare) {
                const fieldsToCompare = [
                    'name', 'event_type', 'event_date', 'start_time', 'location_text',
                    'bracelets_count', 'guest_count_estimate', 'organizer_phone_number',
                    'welcome_message', 'guest_thank_you_message',
                    'cover_image_url', 'allow_video_uploads',
                    'advance_payment_status', 'total_deal_amount', 'advance_payment_amount'
                ];

                for (const key of fieldsToCompare) {
                    let originalValue = originalEventDetailsForCompare[key];
                    let updatedValue = updatedEventData[key];

                    if (key === 'event_date' && originalValue) {
                        try { originalValue = format(parseISO(originalValue), "yyyy-MM-dd"); } catch (e) { /* ignore if not parsable */ }
                    }

                    if (['bracelets_count', 'guest_count_estimate', 'total_deal_amount', 'advance_payment_amount'].includes(key)) {
                        originalValue = originalValue !== null && originalValue !== undefined ? Number(originalValue) : null;
                        updatedValue = updatedValue !== null && updatedValue !== undefined ? Number(updatedValue) : null;
                    }

                    if (typeof originalValue === 'boolean') originalValue = String(originalValue);
                    if (typeof updatedValue === 'boolean') updatedValue = String(updatedValue);

                    if (String(originalValue) !== String(updatedValue)) {
                        changesMadeForInternalEmail.push(`<li><strong>${keyMap[key] || key}:</strong> <del style="color:red;">${displayValue(originalValue, key)}</del> -> <ins style="color:green;">${displayValue(updatedValue, key)}</ins></li>`);

                        structuralChangesForNotifications[key] = {
                            from: displayValue(originalEventDetailsForCompare[key], key),
                            to: displayValue(updatedEventData[key], key)
                        };
                    }
                }
            }

            // Send email to user about the changes
            if (Object.keys(structuralChangesForNotifications).length > 0 && currentUser?.email) {
                const eventForEmailSubject = await Event.get(eventId);
                const eventTypeHebrew = eventTypes.find(type => type.value === updatedEventData.event_type)?.label || updatedEventData.event_type;
                const eventDateFormatted = updatedEventData.event_date ? format(parseISO(updatedEventData.event_date), "PPP", { locale: he }) : 'לא צוין';
                
                // Generate updated QR code for the updated event
                const currentOrigin = window.location.origin;
                const directGuestUrl = `${currentOrigin}/guest/${eventForEmailSubject.id}`;
                const updatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(directGuestUrl)}&size=250x250&ecc=M&margin=1&color=5C1A1B&bgcolor=F8F4E6&format=png`;
                
                const userEmailKeyMap = {
                    name: "שם אירוע",
                    event_type: "סוג אירוע",
                    event_date: "תאריך",
                    start_time: "שעת התחלה",
                    location_text: "מיקום",
                    bracelets_count: "כמות צמידים",
                    guest_count_estimate: "אורחים (הערכה)",
                    organizer_phone_number: "טלפון מארגן",
                    total_deal_amount: "סכום עסקה כולל",
                    advance_payment_amount: "סכום מקדמה ששולם/נדרש",
                    advance_payment_status: "סטטוס מקדמה",
                    welcome_message: "הודעת פתיחה",
                    guest_thank_you_message: "הודעת תודה לאורחים",
                    cover_image_url: "תמונת נושא",
                    allow_video_uploads: "אפשרות העלאת וידאו"
                };

                const changesHtmlForUser = Object.entries(structuralChangesForNotifications).map(([key, value]) =>
                    `<li><strong>${userEmailKeyMap[key] || key}:</strong> מ-"${value.from || 'ריק'}" ל-"${value.to || 'ריק'}"</li>`
                ).join('');

                const emailBodyToUser = `
                    <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; max-width: 600px; margin: 0 auto; background-color: #FEFBF3; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #5C1A1B 0%, #8c2b2d 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">✏️ האירוע שלך עודכן בהצלחה!</h1>
                        </div>
                        
                        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                            <h2 style="color: #5C1A1B; margin-top: 0; border-bottom: 2px solid #F5F5DC; padding-bottom: 10px;">${updatedEventData.name}</h2>
                            
                            <div style="margin: 15px 0;">
                                <h3 style="color: #5C1A1B; margin-bottom: 10px;">📋 השינויים שבוצעו:</h3>
                                <ul style="color: #555; font-size: 14px; line-height: 1.6; padding-right: 20px;">
                                    ${changesHtmlForUser}
                                </ul>
                            </div>

                            <div style="background: #F5F5DC; padding: 15px; border-radius: 8px; margin-top: 15px;">
                                <h4 style="color: #5C1A1B; margin-top: 0;">📊 פרטי האירוע המעודכנים:</h4>
                                <div style="display: grid; gap: 8px; color: #333;">
                                    <div><strong>🎭 סוג אירוע:</strong> ${eventTypeHebrew}</div>
                                    <div><strong>📅 תאריך:</strong> ${eventDateFormatted} בשעה ${updatedEventData.start_time}</div>
                                    <div><strong>📍 מיקום:</strong> ${updatedEventData.location_text}</div>
                                    <div><strong>🎫 צמידים:</strong> ${updatedEventData.bracelets_count}</div>
                                    <div><strong>💰 סכום עסקה:</strong> ₪${updatedEventData.total_deal_amount}</div>
                                    ${eventForEmailSubject.access_code ? `<div><strong>🏷️ קוד גישה:</strong> <span style="font-family: monospace; background: white; padding: 5px 10px; border-radius: 6px; font-weight: bold; color: #5C1A1B;">${eventForEmailSubject.access_code}</span></div>` : ''}
                                </div>
                            </div>
                        </div>

                        <div style="background: #E3F2FD; border: 2px solid #2196F3; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                            <h4 style="color: #1565C0; margin-top: 0; font-size: 16px;">📱 QR Code מעודכן לאורחים</h4>
                            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; display: inline-block;">
                                <img src="${updatedQrUrl}" alt="QR Code Updated" style="display: block; margin: 0 auto;" />
                                <p style="margin: 10px 0 5px 0; font-size: 12px; color: #666;">QR מעודכן עם השינויים החדשים</p>
                            </div>
                            <p style="font-size: 14px; color: #1565C0; margin: 10px 0;">
                                🔄 שתף את הקוד המעודכן עם האורחים<br/>
                                📱 גישה ישירה ללא קוד גישה
                            </p>
                        </div>

                        <div style="background: #E8F5E8; border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                            <h4 style="color: #2E7D32; margin-top: 0;">🔗 לניהול האירוע</h4>
                            <div style="margin: 15px 0;">
                                <a href="${window.location.origin}${createPageUrl(`EditEvent?id=${eventForEmailSubject.id}`)}" style="display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                    ✏️ ערוך שוב את האירוע
                                </a>
                            </div>
                        </div>

                        <div style="background: #F0F0F0; border-radius: 8px; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                            <p style="margin: 0;">💌 קיבלת מייל זה כי עדכנת אירוע במערכת STRINGS</p>
                            <p style="margin: 5px 0 0 0;">🕐 עודכן ב: ${format(new Date(), 'PPp', { locale: he })}</p>
                        </div>
                    </div>
                `;

                try {
                    await SendEmail({
                        to: currentUser.email,
                        subject: `📝 האירוע "${eventForEmailSubject.name}" עודכן בהצלחה! | קוד: ${eventForEmailSubject.access_code}`,
                        body: emailBodyToUser,
                    });
                    safeShowToast("success", "פרטי האירוע עודכנו בהצלחה!", "הודעת עדכון נשלחה אליך ולצוות STRINGS.");
                } catch (emailError) {
                    console.error("Error sending update email to user:", emailError);
                    safeShowToast("warn", "שגיאה בשליחת מייל אישור ללקוח", "השינויים נשמרו אך לא נשלח מייל אישור.");
                }
            } else {
                safeShowToast("success", "פרטי האירוע עודכנו בהצלחה!", "לא זוהו שינויים מהותיים לשליחה.");
            }

            // Send admin notification about event update
            try {
                const changes = changesMadeForInternalEmail.length > 0 ? changesMadeForInternalEmail : ['עדכון כללי'];
                await notifyEventUpdated(updatedEventData, currentUser, changes);
                console.log('✅ Admin notification sent for event update:', eventId);
            } catch (notificationError) {
                console.warn('⚠️ Failed to send admin notification:', notificationError);
            }

            // Send internal email if changes were made
            if (changesMadeForInternalEmail.length > 0) {
                const eventForSubject = await Event.get(eventId);
                const emailBodyToStrings = `
                    <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
                        <h2 style="color: #5C1A1B;">פרטי אירוע עודכנו: ${eventForSubject.name}</h2>
                        <p><strong>מזהה אירוע:</strong> ${eventId}</p>
                        <p><strong>קוד גישה:</strong> ${eventForSubject.access_code}</p>
                        <p><strong>עודכן על ידי:</strong> ${currentUser?.full_name || 'לא ידוע'} (${currentUser?.email})</p>
                        <hr>
                        <h3>השינויים הבאים בוצעו:</h3>
                        <ul style="list-style-type: none; padding: 0;">
                            ${changesMadeForInternalEmail.join('')}
                        </ul>
                        <hr>
                        <p><em>מייל זה נשלח אוטומטית ממערכת STRINGS.</em></p>
                    </div>
                `;

                try {
                    await SendEmail({
                        to: STRINGS_INTERNAL_EMAIL,
                        subject: `עדכון פרטי אירוע: ${eventForSubject.name} (${eventId})`,
                        body: emailBodyToStrings,
                    });
                    if (Object.keys(structuralChangesForNotifications).length === 0 || !currentUser?.email) {
                        safeShowToast("success", "פרטי האירוע עודכנו בהצלחה!", "הודעת עדכון נשלחה לצוות STRINGS.");
                    }
                } catch (emailError) {
                    console.error("Error sending update email to STRINGS:", emailError);
                    safeShowToast("warn", "שגיאה בשליחת מייל עדכון פנימי", "השינויים נשמרו אך לא נשלחה הודעה לצוות.");
                }
            }
            
            // Create EventNotification for admin dashboard using the notification manager
            if (Object.keys(structuralChangesForNotifications).length > 0) {
                try {
                    const eventForNotification = await Event.get(eventId);
                    const changes = Object.keys(structuralChangesForNotifications).map(key => 
                        `${key}: ${structuralChangesForNotifications[key].from} → ${structuralChangesForNotifications[key].to}`
                    );
                    
                    await notifyEventUpdated(eventForNotification, currentUser, changes);
                    console.log("✅ Admin notification sent for event update");
                } catch (notificationError) {
                    console.warn("⚠️ Failed to send admin notification:", notificationError);
                }
            }
            
            // Re-fetch to update state and original for next comparison
            await fetchEventDetails(eventId, currentUser);
        } catch (error) {
            console.error("Error updating event:", error);
            safeShowToast("error", "שגיאה בעדכון פרטי האירוע.", error?.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCoverImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImageFile(file);
            setPreviewCoverImageUrl(URL.createObjectURL(file));
        }
    };

    const handleAddHighlightCategory = async () => {
        if (!newHighlightName.trim()) {
            safeShowToast("error", "שם קטגוריה ריק.", "");
            return;
        }
        try {
            const newCategory = await HighlightCategory.create({
                event_id: eventId,
                name: newHighlightName,
                icon_name: newHighlightIcon,
            });
            setHighlightCategories([...highlightCategories, newCategory]);
            setNewHighlightName('');
            setNewHighlightIcon('');
            safeShowToast("success", "קטגוריית היילייט נוספה.", "");
        } catch (error) {
            safeShowToast("error", "שגיאה בהוספת קטגוריה.", error?.message);
        }
    };

    const handleRemoveHighlightCategory = async (categoryId) => {
        try {
            const mediaUsingCategory = await MediaItem.filter({ event_id: eventId, highlight_category_id: categoryId });
            if (mediaUsingCategory.length > 0) {
                for (const item of mediaUsingCategory) {
                    await MediaItem.update(item.id, { highlight_category_id: null });
                }
                safeShowToast("info", `הקטגוריה הוסרה מ-${mediaUsingCategory.length} פריטי מדיה.`, "");
            }

            await HighlightCategory.delete(categoryId);
            setHighlightCategories(highlightCategories.filter(cat => cat.id !== categoryId));
            fetchMediaItems(eventId);
            safeShowToast("success", "קטגוריית היילייט נמחקה.", "");
        } catch (error) {
            safeShowToast("error", "שגיאה במחיקת קטגוריה.", error?.message);
        }
    };

    const handleToggleMediaSelection = (itemId) => {
        setSelectedMediaItems(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSelectAllMedia = (sourceArray) => {
        setSelectedMediaItems(sourceArray.map(item => item.id));
    };

    const handleDeselectAllMedia = () => {
        setSelectedMediaItems([]);
    };

    const handleApproveSelectedMedia = async () => {
        if (selectedMediaItems.length === 0) return;
        try {
            for (const itemId of selectedMediaItems) {
                await MediaItem.update(itemId, { status: 'approved' });
            }
            await fetchMediaItems(eventId);
            setSelectedMediaItems([]);
            safeShowToast("success", `${selectedMediaItems.length} פריטי מדיה אושרו.`, "");
        } catch (error) {
            safeShowToast("error", "שגיאה באישור מדיה.", error?.message);
        }
    };

    const handleDeleteSelectedMedia = async () => {
        if (selectedMediaItems.length === 0) return;
        try {
            for (const itemId of selectedMediaItems) {
                await MediaItem.delete(itemId);
            }
            await fetchMediaItems(eventId);
            setSelectedMediaItems([]);
            safeShowToast("success", `${selectedMediaItems.length} פריטי מדיה נמחקו.`, "");
        } catch (error) {
            safeShowToast("error", "שגיאה במחיקת מדיה.", error?.message);
        }
    };

    const handleApproveMediaItem = async (itemId) => {
        try {
            await MediaItem.update(itemId, { status: 'approved' });
            await fetchMediaItems(eventId);
            safeShowToast("success", "פריט מדיה אושר.", "");
        } catch (error) {
            safeShowToast("error", "שגיאה באישור פריט מדיה.", error?.message);
        }
    };

    const handleDeleteMediaItem = async (itemId) => {
        try {
            await MediaItem.delete(itemId);
            await fetchMediaItems(eventId);
            safeShowToast("success", "פריט מדיה נמחק.", "");
        } catch (error) {
            safeShowToast("error", "שגיאה במחיקת פריט מדיה.", error?.message);
        }
    };

    const getPaginatedItems = (items, page, perPage) => {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        return items.slice(start, end);
    };

    const handleApproveWish = async (wishId) => {
        try {
            await GuestWish.update(wishId, { approved: true });
            await fetchGuestWishes(eventId);
            safeShowToast("success", "הברכה אושרה ונוספה לאלבום!", "");
        } catch (error) {
            safeShowToast("error", "שגיאה באישור הברכה.", error?.message);
        }
    };

    const handleDeleteWish = async (wishId) => {
        try {
            await GuestWish.delete(wishId);
            await fetchGuestWishes(eventId);
            safeShowToast("success", "הברכה נמחקה.", "");
        } catch (error) {
            safeShowToast("error", "שגיאה במחיקת הברכה.", error?.message);
        }
    };

    const renderHighlightIconForEdit = (iconName) => {
        const IconComponent = highlightIconsListEdit.find(i => i.name === iconName)?.Icon;
        return IconComponent ? <IconComponent className="w-4 h-4" /> : <Tag className="w-4 h-4" />;
    };

    const getQrCodeUrlForEdit = (code) => {
        const pageNameWithParam = `GuestAccess?code=${code}`;
        const relativeGuestAccessUrl = createPageUrl(pageNameWithParam);
        const currentOrigin = window.location.origin;
        const fullGuestAccessUrl = `${currentOrigin}${relativeGuestAccessUrl}`;

        console.log(`EditEvent.js - getQrCodeUrlForEdit - Code for QR: ${code}`);
        console.log(`EditEvent.js - getQrCodeUrlForEdit - Page name for createPageUrl: ${pageNameWithParam}`);
        console.log(`EditEvent.js - getQrCodeUrlForEdit - Relative URL from createPageUrl: ${relativeGuestAccessUrl}`);
        console.log(`EditEvent.js - getQrCodeUrlForEdit - window.location.origin: ${currentOrigin}`);
        console.log(`EditEvent.js - getQrCodeUrlForEdit - Full URL for QR (to be encoded): ${fullGuestAccessUrl}`);

        const qrServiceUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(fullGuestAccessUrl)}&size=1000x1000&ecc=H&margin=10&color=5C1A1B&bgcolor=FFF8E7&qzone=1&format=png`;
        console.log(`EditEvent.js - getQrCodeUrlForEdit - Final QR Service URL: ${qrServiceUrl}`);
        return qrServiceUrl;
    };

    const downloadQrCodeAsPdf = async () => {
        if (!accessCode) {
            safeShowToast("error", "קוד גישה לא זמין", "");
            return;
        }

        try {
            const { jsPDF } = window.jspdf || {};
            if (!jsPDF) {
                const qrUrl = getQrCodeUrlForEdit(accessCode);
                const link = document.createElement('a');
                link.href = qrUrl;
                link.target = '_blank';
                link.download = `event_qr_${eventName.replace(/\s+/g, '_') || 'code'}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                safeShowToast("info", "קוד ה-QR נשמר כתמונה", "לא ניתן היה ליצור PDF");
                return;
            }

            const pdf = new jsPDF('p', 'mm', 'a4');

            try {
                pdf.addFont('NotoSansHebrew-Regular.ttf', 'NotoSansHebrew', 'normal');
                pdf.setFont('NotoSansHebrew');
            } catch (e) {
                pdf.setFont('helvetica');
            }

            pdf.setFontSize(16);
            pdf.text('קוד QR לאירוע', 105, 20, { align: 'center' });

            pdf.setFontSize(12);
            pdf.text(`${eventName}`, 105, 30, { align: 'center' });

            const qrUrl = getQrCodeUrlForEdit(accessCode);
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = function () {
                const qrSize = 28.35;
                const centerX = (210 - qrSize) / 2;
                const centerY = 50;

                pdf.addImage(img, 'PNG', centerX, centerY, qrSize, qrSize);

                pdf.setFontSize(10);
                pdf.text(`קוד גישה: ${accessCode}`, 105, centerY + qrSize + 10, { align: 'center' });

                pdf.setFontSize(8);
                pdf.text('סרוק את הקוד או השתמש בקוד הגישה לכניסה לאלבום', 105, centerY + qrSize + 20, { align: 'center' });

                pdf.save(`event_qr_${eventName.replace(/\s+/g, '_') || 'code'}.pdf`);
                safeShowToast("success", "קוד ה-QR נשמר כ-PDF", "");
            };

            img.onerror = function () {
                const link = document.createElement('a');
                link.href = qrUrl;
                link.target = '_blank';
                link.download = `event_qr_${eventName.replace(/\s+/g, '_') || 'code'}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                safeShowToast("error", "שגיאה ביצירת PDF", "הקוד נשמר כתמונה במקום");
            };

            img.src = qrUrl;

        } catch (error) {
            console.error('Error creating PDF:', error);
            safeShowToast("error", "שגיאה ביצירת PDF", "נסה שוב או צור קשר עם התמיכה");
        }
    };

    const copyAccessCodeToClipboardForEdit = () => {
        if (accessCode) {
            navigator.clipboard.writeText(accessCode);
            safeShowToast("success", "קוד הגישה הטקסטואלי הועתק!", "");
        }
    };

    const copyGuestAccessLinkToClipboardForEdit = () => {
        if (accessCode) {
            const guestAccessUrl = `${window.location.origin}${createPageUrl(`GuestAccess?code=${accessCode}`)}`;
            navigator.clipboard.writeText(guestAccessUrl);
            safeShowToast("success", "קישור גישה לאורחים הועתק!", "");
        }
    };

    const handleSendPersonalAlbums = async () => {
        if (!eventDetails?.id) {
            safeShowToast("error", "שגיאה", "לא ניתן לשלוח מיילים - מזהה האירוע חסר.");
            return;
        }

        if (!window.confirm(`האם אתה בטוח שברצונך לשלוח מייל סיכום אישי לכל האורחים שהעלו תמונות?`)) {
            return;
        }

        setIsSendingEmails(true);
        safeShowToast("info", "מתחיל את תהליך השליחה...", "זה עשוי לקחת מספר רגעים.");

        try {
            const allMediaForEvent = await MediaItem.filter({ event_id: eventDetails.id, status: 'approved' });
            if (allMediaForEvent.length === 0) {
                safeShowToast("warn", "אין מדיה באירוע", "לא ניתן לשלוח מיילים כי לא הועלו תמונות מאושרות.");
                setIsSendingEmails(false);
                return;
            }
            
            const guests = new Map();
            allMediaForEvent.forEach(item => {
                if (item.created_by && item.created_by.includes('@')) {
                    const guestEmail = item.created_by;
                    if (!guests.has(guestEmail)) {
                        guests.set(guestEmail, { name: item.uploader_name || 'אורח/ת יקר/ה', email: guestEmail, mediaCount: 0 });
                    }
                    const currentGuest = guests.get(guestEmail);
                    currentGuest.mediaCount++;
                    guests.set(guestEmail, currentGuest);
                }
            });
            
            const guestList = Array.from(guests.values());
            
            if (guestList.length === 0) {
                safeShowToast("warn", "לא נמצאו אורחים", "לא נמצאו אורחים עם כתובות מייל שניתן לשלוח אליהם (אורחים שהעלו תמונות).");
                setIsSendingEmails(false);
                return;
            }

            const thankYouMessage = guestThankYouMessage || "תודה רבה שבאתם לחגוג איתנו! היה לנו אירוע מושלם בזכותכם. מקווים שנהניתם!";

            let emailsSent = 0;
            for (const guest of guestList) {
                const personalAlbumUrl = `${window.location.origin}${createPageUrl(`GuestAlbum?eventId=${eventDetails.id}&guestEmail=${encodeURIComponent(guest.email)}`)}`;
                
                const emailBody = `
                  <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; max-width: 600px; margin: 0 auto; background-color: #FEFBF3; padding: 20px;">
                      <div style="background: linear-gradient(135deg, #5C1A1B 0%, #8B2635 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">תודה שהייתם חלק מהאירוע שלנו!</h1>
                      </div>
                      
                      <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                          <h2 style="color: #5C1A1B; margin-top: 0; border-bottom: 2px solid #F5F5DC; padding-bottom: 10px;">${eventDetails.name}</h2>
                          
                          ${thankYouMessage ? `
                              <div style="background: #FFF8E0; border-right: 4px solid #D4AF37; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                  <h4 style="color: #B8860B; margin-top: 0;">הודעה אישית מהמארחים:</h4>
                                  <p style="font-style: italic; color: #8B7355; margin: 0;">"${thankYouMessage}"</p>
                              </div>
                          ` : ''}

                          <div style="text-align: center; margin: 25px 0;">
                              <p style="color: #333; font-size: 16px; margin-bottom: 15px;">לחצו על הכפתור כדי לראות את כל התמונות שהעליתם:</p>
                              <a href="${personalAlbumUrl}" style="display: inline-block; background-color: #5C1A1B; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                                  צפו באלבום האישי שלכם (${guest.mediaCount} תמונות)
                              </a>
                          </div>
                      </div>

                      <div style="text-align: left; font-size: 16px; color: #444; margin-bottom: 20px;">
                          <p style="margin: 5px 0 0 0;">בברכה,</p>
                          <p style="margin: 5px 0 0 0;">צוות STRINGS</p>
                      </div>
                      
                      <div style="background: #F0F0F0; border-radius: 8px; padding: 15px; font-size: 12px; color: #666; text-align: center;">
                          <h4 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">יצירת קשר עם STRINGS</h4>
                          <p style="margin: 5px 0;"><strong>WhatsApp:</strong> <a href="https://wa.me/972542565889" style="color: #5C1A1B; text-decoration: none;">054-2565889</a></p>
                          <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:stringsalbumapp@gmail.com" style="color: #5C1A1B; text-decoration: none;">stringsalbumapp@gmail.com</a></p>
                          <p style="margin: 5px 0;"><strong>Instagram:</strong> <a href="https://www.instagram.com/stringsalbum?igsh=OGxxbGw5YmxrcjBm" target="_blank" style="color: #5C1A1B; text-decoration: none;">@stringsalbum</a></p>
                      </div>
                  </div>
                `;

                try {
                    await SendEmail({
                        to: guest.email,
                        subject: `🎁 התמונות שלך מהאירוע של ${eventDetails.name} מחכות לך!`,
                        body: emailBody,
                    });
                    emailsSent++;
                } catch (sendError) {
                    console.error(`Error sending email to ${guest.email}:`, sendError);
                    safeShowToast("error", `שגיאה בשליחה ל: ${guest.email}`, sendError?.message || "נסה שוב.");
                }
            }
            
            safeShowToast("success", "השליחה הסתיימה!", `מיילים נשלחו בהצלחה ל-${emailsSent} אורחים.`);

        } catch (error) {
            console.error("Error sending personal album emails:", error);
            safeShowToast("error", "שגיאה בשליחת המיילים", "אירעה שגיאה. בדוק את הקונסול לפרטים נוספים.");
        } finally {
            setIsSendingEmails(false);
        }
    };


    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-12 w-12 text-bordeaux dark:text-[#d4a574] animate-spin mb-4" />
                <p className="text-lg text-gray-600 dark:text-gray-400">טוען פרטי אירוע...</p>
            </div>
        );
    }

    if (!eventId && !isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">שגיאה: מזהה אירוע חסר</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    לא ניתן היה למצוא מזהה אירוע תקין בכתובת ה-URL.
                    ייתכן שהקישור אינו תקין או שהאירוע נמחק.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                    (פרטי שגיאה טכניים: <code>location.search = "{location.search}"</code>)
                </p>
                <Button onClick={() => navigate(createPageUrl('MyEvents'))} className="mt-6 btn-bordeaux">
                    חזרה לרשימת האירועים
                </Button>
            </div>
        );
    }

    if (!eventDetails && !isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">האירוע לא נמצא</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    האירוע שביקשת לערוך לא קיים במערכת.
                    ייתכן שהוא נמחק או שאין לך הרשאת גישה אליו.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6 max-w-md">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">מה ניתן לעשות?</h3>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                        <li>חזור לרשימת האירועים ובדוק שהאירוע עדיין קיים</li>
                        <li>ודא שהקישור נכון ומעודכן</li>
                        <li>אם האירוע נמחק, תוכל ליצור אירוע חדש</li>
                    </ul>
                </div>
                <Button onClick={() => navigate(createPageUrl('MyEvents'))} className="btn-bordeaux">
                    חזרה לרשימת האירועים
                </Button>
            </div>
        );
    }

    const displayedMedia = mediaFilter === 'all' ? mediaItems : (mediaFilter === 'pending' ? pendingMediaItems : approvedMediaItems);
    const currentMediaToDisplay = getPaginatedItems(displayedMedia, currentMediaPage, MEDIA_ITEMS_PER_PAGE);
    const calculatedTotalMediaPages = Math.ceil(displayedMedia.length / MEDIA_ITEMS_PER_PAGE);

    const displayedWishes = wishFilter === 'all' ? guestWishes : (wishFilter === 'pending' ? pendingWishes : approvedWishes);
    const currentWishesToDisplay = getPaginatedItems(displayedWishes, currentWishPage, GUEST_WISHES_PER_PAGE);
    const calculatedTotalWishPages = Math.ceil(displayedWishes.length / GUEST_WISHES_PER_PAGE);

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-bordeaux dark:text-[#d4a574] title-main">ניהול אירוע: {eventDetails?.name}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-lg">ערוך פרטים, נהל מדיה וברכות מהאורחים.</p>
                </div>
                {!isEditable && (
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-800/30 border border-yellow-400 dark:border-yellow-600 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>תקופת העריכה לאירוע זה הסתיימה.</span>
                    </div>
                )}
            </div>

            {/* Auto-deletion warning banner */}
            {deletionStatus.daysUntilDeletion !== null && deletionStatus.daysUntilDeletion <= 7 && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        <div>
                            <h3 className="font-semibold text-red-800 dark:text-red-200">
                                {deletionStatus.daysUntilDeletion === 0 ? 'האירוע ימחק היום!' : `האירוע ימחק בעוד ${deletionStatus.daysUntilDeletion} ימים`}
                            </h3>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                {deletionStatus.daysUntilDeletion === 0 
                                    ? 'אירועים נמחקים אוטומטית 14 ימים לאחר תאריך סיום האירוע. גבה את המדיה שלך עכשיו!'
                                    : 'אירועים נמחקים אוטומטית 14 ימים לאחר תאריך סיום האירוע. הקפד לגבות את המדיה שלך.'
                                }
                            </p>
                            {deletionStatus.deletionDate && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    תאריך מחיקה: {format(deletionStatus.deletionDate, 'dd.MM.yyyy', { locale: he })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-xl h-auto">
                    <TabsTrigger value="details" className="text-base px-3 py-2.5 rounded-lg data-[state=active]:bg-bordeaux data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-[#d4a574] dark:data-[state=active]:text-gray-900"><Settings className="w-4 h-4 ml-2" />פרטי אירוע</TabsTrigger>
                    <TabsTrigger value="media" className="text-base px-3 py-2.5 rounded-lg data-[state=active]:bg-bordeaux data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-[#d4a574] dark:data-[state=active]:text-gray-900"><ImageIcon className="w-4 h-4 ml-2" />ניהול מדיה</TabsTrigger>
                    <TabsTrigger value="wishes" className="text-base px-3 py-2.5 rounded-lg data-[state=active]:bg-bordeaux data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-[#d4a574] dark:data-[state=active]:text-gray-900"><MessageSquare className="w-4 h-4 ml-2" />ניהול ברכות</TabsTrigger>
                    <TabsTrigger value="backup" className="text-base px-3 py-2.5 rounded-lg data-[state=active]:bg-bordeaux data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-[#d4a574] dark:data-[state=active]:text-gray-900"><DownloadIcon className="w-4 h-4 ml-2" />גיבוי מדיה</TabsTrigger>
                    <TabsTrigger value="sharing" className="text-base px-3 py-2.5 rounded-lg data-[state=active]:bg-bordeaux data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-[#d4a574] dark:data-[state=active]:text-gray-900"><Share2 className="w-4 h-4 ml-2" />שיתוף וגישה</TabsTrigger>
                    <TabsTrigger value="actions" className="text-base px-3 py-2.5 rounded-lg data-[state=active]:bg-bordeaux data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-[#d4a574] dark:data-[state=active]:text-gray-900"><Send className="w-4 h-4 ml-2" />פעולות נוספות</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6">
                    <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl">
                        <CardHeader className="bg-[#F5F5DC]/50 dark:bg-gray-700/30 border-b border-gray-200/50 dark:border-gray-600/50">
                            <CardTitle className="text-2xl font-semibold text-bordeaux dark:text-[#d4a574] title-main">עריכת פרטי האירוע</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">עדכן את המידע הרלוונטי לאירוע שלך.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="eventNameEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">שם האירוע</Label>
                                <Input id="eventNameEdit" value={eventName} onChange={(e) => setEventName(e.target.value)} disabled={!isEditable} className="h-12 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 disabled:opacity-70" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="eventTypeEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">סוג האירוע</Label>
                                <Select value={eventType} onValueChange={setEventType} dir="rtl" disabled={!isEditable}>
                                    <SelectTrigger id="eventTypeEdit" className="h-12 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 disabled:opacity-70">
                                        <SelectValue placeholder="בחר סוג אירוע" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                        {eventTypes.map(type => (
                                            <SelectItem key={type.value} value={type.value} className="text-lg py-3 pr-8 rtl:pl-8 rtl:pr-3 hover:!bg-[#F5F5DC] dark:hover:!bg-gray-700 focus:!bg-[#F5F5DC] dark:focus:!bg-gray-700 text-gray-900 dark:text-gray-50">{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="eventDateEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">תאריך האירוע</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" disabled={!isEditable} className={`w-full h-12 justify-start text-right font-normal rounded-xl text-lg border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 ${!eventDate && "text-gray-500 dark:text-gray-400"} disabled:opacity-70`}>
                                                <CalendarIcon className="ml-3 h-5 w-5 text-bordeaux dark:text-[#d4a574]" />
                                                {eventDate ? format(eventDate, "PPP", { locale: he }) : <span>בחר תאריך</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-2xl border-gray-200 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-800" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={eventDate}
                                                onSelect={setEventDate}
                                                initialFocus locale={he}
                                                className="rounded-2xl"
                                                disabled={(date) => (isEditable ? date < addDays(new Date(), -1) : true)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startTimeEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">שעת התחלה</Label>
                                    <Select value={startTime} onValueChange={setStartTime} dir="rtl" disabled={!isEditable}>
                                        <SelectTrigger id="startTimeEdit" className="h-12 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 disabled:opacity-70">
                                            <SelectValue placeholder="בחר שעה" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-lg max-h-60 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                            {timeOptions.map(time => <SelectItem key={time} value={time} className="text-lg py-3 pr-8 rtl:pl-8 rtl:pr-3 hover:!bg-[#F5F5DC] dark:hover:!bg-gray-700 focus:!bg-[#F5F5DC] dark:focus:!bg-gray-700 text-gray-900 dark:text-gray-50">{time}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="locationTextEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">מיקום האירוע (תיאור)</Label>
                                <Input id="locationTextEdit" value={locationText} onChange={(e) => setLocationText(e.target.value)} disabled={!isEditable} className="h-12 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 disabled:opacity-70" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="braceletsCountEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">כמות צמידי QR לאורחים (כפי שסוכם) <span className="text-red-500">*</span></Label>
                                <Input id="braceletsCountEdit" type="number" value={braceletsCount} onChange={(e) => setBraceletsCount(e.target.value)} min="1" disabled={!isEditable} className="h-12 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 disabled:opacity-70" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">כמות הצמידים עם קוד QR שיודפסו ויחולקו לאורחים.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guestCountEstimateEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">כמות אורחים באירוע (אופציונלי)</Label>
                                <Input id="guestCountEstimateEdit" type="number" value={guestCountEstimate} onChange={(e) => setGuestCountEstimate(e.target.value)} min="0" disabled={!isEditable} className="h-12 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 disabled:opacity-70" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">הערכה כללית למספר האורחים הצפויים באירוע.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="totalDealAmountEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">סכום העסקה הכולל (כפי שסוכם) <span className="text-red-500">*</span></Label>
                                <Input id="totalDealAmountEdit" type="number" value={totalDealAmount} onChange={(e) => setTotalDealAmount(e.target.value)} min="1" disabled={!isEditable} className="h-12 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 disabled:opacity-70" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">הסכום הכולל של העסקה בשקלים חדשים.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="advancePaymentFixedEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">סכום מקדמה ששולם/נדרש (ש"ח)</Label>
                                <Input
                                    id="advancePaymentFixedEdit"
                                    type="number"
                                    value={advancePaymentAmount || ADVANCE_PAYMENT_FIXED_AMOUNT_EDIT}
                                    readOnly
                                    disabled
                                    className="h-12 text-lg rounded-xl border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">סכום המקדמה שנדרש או שולם עבור אירוע זה. סכום זה אינו ניתן לעריכה ישירה כאב.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="organizerPhoneNumberEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">מספר טלפון (מארגן)</Label>
                                <Input id="organizerPhoneNumberEdit" type="tel" value={organizerPhoneNumber} onChange={(e) => setOrganizerPhoneNumber(e.target.value)} disabled={!isEditable} className="h-12 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 disabled:opacity-70" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="welcomeMessageEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">הודעת פתיחה (אופציונלי)</Label>
                                <Textarea id="welcomeMessageEdit" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3} disabled={!isEditable} className="text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] resize-none bg-white dark:bg-gray-700 disabled:opacity-70" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">הודעה זו תוצג לאורחים בכניסה לאלבום האירוע.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guestThankYouMessageEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">הודעת תודה לאורחים (למייל הסיכום)</Label>
                                <Textarea id="guestThankYouMessageEdit" value={guestThankYouMessage} onChange={(e) => setGuestThankYouMessage(e.target.value)} rows={4} disabled={!isEditable} className="text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] resize-none bg-white dark:bg-gray-700 disabled:opacity-70" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">הודעה זו תישלח במייל לכל אורח שהעלה תמונות, יחד עם קישור לאלבום האישי שלו.</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-base font-medium text-gray-800 dark:text-gray-200">תמונת נושא (אופציונלי)</Label>
                                <div className="mt-2 flex items-center justify-center px-6 py-8 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-2xl hover:border-bordeaux dark:hover:border-[#d4a574] transition-colors bg-gray-50/30 dark:bg-gray-700/20">
                                    <div className="space-y-4 text-center w-full">
                                        {previewCoverImageUrl ? (
                                            <div className="relative">
                                                <img src={previewCoverImageUrl} alt="תצוגה מקדימה" className="mx-auto h-48 w-full max-w-sm object-cover rounded-xl shadow-lg" />
                                                <Button type="button" onClick={() => { setCoverImageFile(null); setPreviewCoverImageUrl(eventDetails?.cover_image_url || ''); }} disabled={!isEditable} className="absolute top-2 left-2 rtl:right-2 rtl:left-auto h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 p-0 text-white disabled:opacity-50"><XCircle className="w-5 h-5" /></Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#8c2b2d] to-[#5C1A1B] dark:from-[#9a3336] dark:to-[#7a2425] rounded-2xl flex items-center justify-center shadow-lg"><ImageUp className="h-10 w-10 text-white" /></div>
                                                <div><p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">העלה תמונת נושא</p><p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG, GIF עד 10MB</p></div>
                                            </div>
                                        )}
                                        <label htmlFor="coverImageFileEdit" className={`btn-bordeaux inline-flex items-center px-6 py-3 text-base font-medium rounded-xl cursor-pointer transition-all duration-300 active:scale-95 shadow-lg ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <ImageUp className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0" />{previewCoverImageUrl ? 'החלף תמונה' : 'בחר תמונה'}
                                        </label>
                                        <input id="coverImageFileEdit" name="coverImageFile" type="file" className="hidden" accept="image/*" onChange={handleCoverImageChange} disabled={!isEditable} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 pt-4">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">הגדרות נוספות</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-[#5C1A1B]/5 dark:bg-bordeaux/10 rounded-2xl border border-[#5C1A1B]/10 dark:border-bordeaux/20">
                                        <div className="flex items-center gap-3">
                                            <ImageUp className="w-6 h-6 text-bordeaux dark:text-[#d4a574]" />
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">העלאת קבצים</span>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    המערכת תומכת בהעלאת תמונות בלבד (JPG, PNG, GIF)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Payment Status - Admin Only */}
                            {currentUser?.role === 'admin' ? (
                                <div className="space-y-2">
                                    <Label htmlFor="advancePaymentStatusEdit" className="text-base font-medium text-gray-800 dark:text-gray-200">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-red-600" />
                                            סטטוס תשלום מקדמה (מנהל בלבד)
                                        </div>
                                    </Label>
                                    <Select value={advancePaymentStatus} onValueChange={setAdvancePaymentStatus} dir="rtl" disabled={!isEditable}>
                                        <SelectTrigger id="advancePaymentStatusEdit" className="h-12 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 disabled:opacity-70">
                                            <SelectValue placeholder="בחר סטטוס תשלום" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                            <SelectItem value="pending_payment" className="text-lg py-3 pr-8 rtl:pl-8 rtl:pr-3 hover:!bg-[#F5F5DC] dark:hover:!bg-gray-700 focus:!bg-[#F5F5DC] dark:focus:!bg-gray-700 text-gray-900 dark:text-gray-50">ממתין לתשלום</SelectItem>
                                            <SelectItem value="paid" className="text-lg py-3 pr-8 rtl:pl-8 rtl:pr-3 hover:!bg-[#F5F5DC] dark:hover:!bg-gray-700 focus:!bg-[#F5F5DC] dark:focus:!bg-gray-700 text-gray-900 dark:text-gray-50">שולם</SelectItem>
                                            <SelectItem value="failed" className="text-lg py-3 pr-8 rtl:pl-8 rtl:pr-3 hover:!bg-[#F5F5DC] dark:hover:!bg-gray-700 focus:!bg-[#F5F5DC] dark:focus:!bg-gray-700 text-gray-900 dark:text-gray-50">נכשל</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">עדכן סטטוס זה ידנית לאחר קבלת אישור תשלום מהלקוח.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="text-base font-medium text-gray-800 dark:text-gray-200">סטטוס תשלום מקדמה</Label>
                                    <div className="h-12 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center text-lg text-gray-700 dark:text-gray-300">
                                        {advancePaymentStatus === 'pending_payment' ? 'ממתין לתשלום' : 
                                         advancePaymentStatus === 'paid' ? 'שולם' : 
                                         advancePaymentStatus === 'failed' ? 'נכשל' : advancePaymentStatus}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">רק מנהל המערכת יכול לעדכן את סטטוס התשלום.</p>
                                </div>
                            )}

                            <div className="space-y-6 pt-6 border-t border-gray-200/80 dark:border-gray-700/80">
                                <div>
                                    <Label className="text-xl font-semibold text-gray-800 dark:text-gray-100">קטגוריות Highlights</Label>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">נהל קטגוריות לשיוך תמונות וסרטונים.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                                    <div className="space-y-1">
                                        <Label htmlFor="newHighlightNameEdit" className="text-sm font-medium text-gray-700 dark:text-gray-300">שם קטגוריה חדשה</Label>
                                        <Input
                                            id="newHighlightNameEdit"
                                            type="text"
                                            value={newHighlightName}
                                            onChange={(e) => setNewHighlightName(e.target.value)}
                                            placeholder="לדוגמה: 'קבלת פנים'"
                                            disabled={!isEditable}
                                            className="h-12 text-base rounded-lg border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 disabled:opacity-70"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="newHighlightIconEdit" className="text-sm font-medium text-gray-700 dark:text-gray-300">בחר אייקון</Label>
                                        <Select value={newHighlightIcon} onValueChange={setNewHighlightIcon} dir="rtl" disabled={!isEditable}>
                                            <SelectTrigger id="newHighlightIconEdit" className="h-12 text-base rounded-lg border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] w-full sm:w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 disabled:opacity-70">
                                                <SelectValue placeholder="אייקון" >
                                                    {newHighlightIcon ? renderHighlightIconForEdit(newHighlightIcon) : <Search className="w-4 h-4 opacity-50" />}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg shadow-lg max-h-60 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                                <SelectItem value={null} className="text-base py-2 pr-8 rtl:pl-8 rtl:pr-3 hover:!bg-[#F5F5DC] dark:hover:!bg-gray-700 text-gray-900 dark:text-gray-50">ללא אייקון</SelectItem>
                                                {highlightIconsListEdit.map(({ name, Icon }) => (
                                                    <SelectItem key={name} value={name} className="text-base py-2 pr-8 rtl:pl-8 rtl:pr-3 hover:!bg-[#F5F5DC] dark:hover:!bg-gray-700 text-gray-900 dark:text-gray-50">
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="w-5 h-5 text-bordeaux dark:text-[#d4a574]" />
                                                            <span>{name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="button" onClick={handleAddHighlightCategory} disabled={!isEditable || isSubmitting} className="btn-bordeaux h-12 rounded-lg sm:self-end disabled:opacity-50">
                                        <Plus className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" /> הוסף
                                    </Button>
                                </div>
                                {highlightCategories.length > 0 && (
                                    <div className="space-y-2 pt-3">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">קטגוריות קיימות:</p>
                                        <div className="flex flex-wrap gap-3">
                                            {highlightCategories.map((category) => (
                                                <div key={category.id} className="flex items-center gap-2 bg-white dark:bg-gray-700 pl-2 pr-3 py-2 rounded-lg border border-bordeaux dark:border-[#d4a574] text-bordeaux dark:text-[#d4a574] shadow-sm">
                                                    {renderHighlightIconForEdit(category.icon_name)}
                                                    <span className="text-sm font-medium">{category.name}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveHighlightCategory(category.id)}
                                                        disabled={!isEditable || isSubmitting}
                                                        className="h-7 w-7 text-red-500 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-full disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-gray-100/50 dark:bg-gray-800/40 border-t border-gray-200/50 dark:border-gray-700/50 p-6">
                            <Button onClick={handleUpdateEventDetails} disabled={isSubmitting || !isEditable} className="btn-bordeaux w-full sm:w-auto h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50">
                                {isSubmitting ? <Loader2 className="ml-3 h-6 w-6 animate-spin rtl:mr-3 rtl:ml-0" /> : <Save className="ml-3 h-6 w-6 rtl:mr-3 rtl:ml-0" />}
                                שמור שינויים
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="media" className="mt-6">
                    <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl">
                        <CardHeader className="bg-[#F5F5DC]/50 dark:bg-gray-700/30 border-b border-gray-200/50 dark:border-gray-600/50">
                            <CardTitle className="text-2xl font-semibold text-bordeaux dark:text-[#d4a574]">ניהול מדיה מהאורחים</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">אשר, מחק ונהל את התמונות והסרטונים שהועלו.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="mediaFilter" className="text-base font-medium text-gray-800 dark:text-gray-200">סנן לפי סטטוס:</Label>
                                    <Select value={mediaFilter} onValueChange={setMediaFilter} dir="rtl">
                                        <SelectTrigger id="mediaFilter" className="w-[180px] h-11 rounded-lg border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg shadow-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                            <SelectItem value="all">הכל ({mediaItems.length})</SelectItem>
                                            <SelectItem value="pending">ממתין לאישור ({pendingMediaItems.length})</SelectItem>
                                            <SelectItem value="approved">מאושר ({approvedMediaItems.length})</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => handleSelectAllMedia(displayedMedia)} variant="outline" size="sm" className="h-10 rounded-md border-gray-400 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">בחר הכל</Button>
                                    <Button onClick={handleDeselectAllMedia} variant="outline" size="sm" className="h-10 rounded-md border-gray-400 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">בטל בחירה</Button>
                                </div>
                            </div>

                            {selectedMediaItems.length > 0 && (
                                <div className="flex flex-wrap items-center gap-3 p-3 bg-bordeaux/10 dark:bg-[#d4a574]/10 rounded-lg border border-bordeaux/30 dark:border-[#d4a574]/30">
                                    <span className="text-sm font-medium text-bordeaux dark:text-[#d4a574]">{selectedMediaItems.length} פריטים נבחרו</span>
                                    <Button onClick={handleApproveSelectedMedia} size="sm" className="bg-green-600 hover:bg-green-700 text-white h-9 rounded-md">
                                        <CheckCircle className="w-4 h-4 ml-1 rtl:ml-1 rtl:mr-0" /> אשר נבחרים
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" className="h-9 rounded-md">
                                                <Trash2 className="w-4 h-4 ml-1 rtl:ml-1 rtl:mr-0" /> מחק נבחרים
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent dir="rtl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    האם אתה בטוח שברצונך למחוק את {selectedMediaItems.length} הפריטים שנבחרו? פעולה זו אינה הפיכה.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteSelectedMedia} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}

                            {currentMediaToDisplay.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    {mediaFilter === 'pending' ? 'אין פריטי מדיה שממתינים לאישור.' : (mediaFilter === 'approved' ? 'אין פריטי מדיה מאושרים.' : 'לא הועלתה מדיה לאירוע זה עדיין.')}
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {currentMediaToDisplay.map(item => (
                                        <Card key={item.id} className="overflow-hidden group rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                            <CardContent className="p-0 relative">
                                                <Checkbox
                                                    checked={selectedMediaItems.includes(item.id)}
                                                    onCheckedChange={() => handleToggleMediaSelection(item.id)}
                                                    className="absolute top-2 right-2 z-10 bg-white/70 dark:bg-gray-800/70 border-gray-400 data-[state=checked]:bg-bordeaux data-[state=checked]:border-bordeaux dark:data-[state=checked]:bg-[#d4a574] dark:data-[state=checked]:border-[#d4a574] h-5 w-5 rounded"
                                                />
                                                <div className="aspect-square bg-gray-100 dark:bg-gray-700">
                                                    {item.file_type === 'image' ? (
                                                        <img src={item.file_url} alt={item.caption || 'תמונה'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <video src={item.file_url} controls className="w-full h-full object-contain bg-black" preload="metadata" />
                                                    )}
                                                </div>
                                                <div className="p-3 space-y-1 bg-white dark:bg-gray-800">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">הועלה על ידי: {item.uploader_name || 'לא ידוע'}</p>
                                                    {item.caption && <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">תיאור: {item.caption}</p>}
                                                    {item.highlight_category_id && highlightCategories.find(hc => hc.id === item.highlight_category_id) && (
                                                        <div className="text-xs text-bordeaux dark:text-[#d4a574] flex items-center gap-1">
                                                            {renderHighlightIconForEdit(highlightCategories.find(hc => hc.id === item.highlight_category_id)?.icon_name)}
                                                            {highlightCategories.find(hc => hc.id === item.highlight_category_id)?.name}
                                                        </div>
                                                    )}
                                                    <p className={`text-xs font-medium ${item.status === 'approved' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                        סטטוס: {item.status === 'approved' ? 'מאושר' : 'ממתין לאישור'}
                                                    </p>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="p-2 bg-gray-50 dark:bg-gray-700/50 flex gap-2">
                                                {item.status !== 'approved' && (
                                                    <Button onClick={() => handleApproveMediaItem(item.id)} size="sm" className="flex-1 bg-green-500 hover:bg-green-600 text-white h-9 rounded-md">
                                                        <CheckCircle className="w-4 h-4 ml-1 rtl:ml-1 rtl:mr-0" /> אשר
                                                    </Button>
                                                )}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm" className="flex-1 h-9 rounded-md">
                                                            <Trash2 className="w-4 h-4 ml-1 rtl:ml-1 rtl:mr-0" /> מחק
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent dir="rtl">
                                                        <AlertDialogHeader><AlertDialogTitle>אישור מחיקה</AlertDialogTitle><AlertDialogDescription>האם אתה בטוח?</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>ביטול</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMediaItem(item.id)} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                            {calculatedTotalMediaPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-6">
                                    <Button onClick={() => setCurrentMediaPage(p => Math.max(1, p - 1))} disabled={currentMediaPage === 1} variant="outline" size="sm" className="h-9 rounded-md"><ChevronLeft className="w-4 h-4" /></Button>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">עמוד {currentMediaPage} מתוך {calculatedTotalMediaPages}</span>
                                    <Button onClick={() => setCurrentMediaPage(p => Math.min(calculatedTotalMediaPages, p + 1))} disabled={currentMediaPage === calculatedTotalMediaPages} variant="outline" size="sm" className="h-9 rounded-md"><ChevronRight className="w-4 h-4" /></Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="wishes" className="mt-6">
                    <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl">
                        <CardHeader className="bg-[#F5F5DC]/50 dark:bg-gray-700/30 border-b border-gray-200/50 dark:border-gray-600/50">
                            <CardTitle className="text-2xl font-semibold text-bordeaux dark:text-[#d4a574]">ניהול ברכות מהאורחים</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">אשר או מחק ברכות שנשלחו על ידי האורחים.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="wishFilter" className="text-base font-medium text-gray-800 dark:text-gray-200">סנן לפי סטטוס:</Label>
                                    <Select value={wishFilter} onValueChange={setWishFilter} dir="rtl">
                                        <SelectTrigger id="wishFilter" className="w-[180px] h-11 rounded-lg border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg shadow-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                            <SelectItem value="all">הכל ({guestWishes.length})</SelectItem>
                                            <SelectItem value="pending">ממתין לאישור ({pendingWishes.length})</SelectItem>
                                            <SelectItem value="approved">מאושר ({approvedWishes.length})</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {currentWishesToDisplay.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    {wishFilter === 'pending' ? 'אין ברכות שממתינות לאישור.' : (wishFilter === 'approved' ? 'אין ברכות מאושרות.' : 'לא נשלחו ברכות לאירוע זה עדיין.')}
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {currentWishesToDisplay.map(wish => (
                                        <Card key={wish.id} className="bg-gradient-to-tr from-[#FFF8E7]/80 to-[#F5F5DC]/50 dark:from-gray-700/80 dark:to-gray-600/50 rounded-xl shadow border border-bordeaux/20 dark:border-[#d4a574]/30">
                                            <CardContent className="p-4">
                                                <p className="text-gray-800 dark:text-gray-100 text-base whitespace-pre-wrap">"{wish.wish_text}"</p>
                                                <p className="text-sm text-bordeaux dark:text-[#d4a574] font-semibold mt-2">- {wish.guest_name}</p>
                                                <p className={`text-xs font-medium mt-1 ${wish.approved ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                    סטטוס: {wish.approved ? 'מאושרת' : 'ממתינה לאישור'}
                                                </p>
                                            </CardContent>
                                            <CardFooter className="p-3 bg-gray-50 dark:bg-gray-700/50 flex gap-2 border-t border-bordeaux/10 dark:border-[#d4a574]/20">
                                                {!wish.approved && (
                                                    <Button onClick={() => handleApproveWish(wish.id)} size="sm" className="flex-1 bg-green-500 hover:bg-green-600 text-white h-9 rounded-md">
                                                        <CheckCircle className="w-4 h-4 ml-1 rtl:ml-1 rtl:mr-0" /> אשר ברכה
                                                    </Button>
                                                )}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm" className="flex-1 h-9 rounded-md">
                                                            <Trash2 className="w-4 h-4 ml-1 rtl:ml-1 rtl:mr-0" /> מחק ברכה
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent dir="rtl">
                                                        <AlertDialogHeader><AlertDialogTitle>אישור מחיקה</AlertDialogTitle><AlertDialogDescription>האם אתה בטוח שברצונך למחוק ברכה זו?</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>ביטול</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteWish(wish.id)} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                            {calculatedTotalWishPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-6">
                                    <Button onClick={() => setCurrentWishPage(p => Math.max(1, p - 1))} disabled={currentWishPage === 1} variant="outline" size="sm" className="h-9 rounded-md"><ChevronLeft className="w-4 h-4" /></Button>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">עמוד {currentWishPage} מתוך {calculatedTotalWishPages}</span>
                                    <Button onClick={() => setCurrentWishPage(p => Math.min(calculatedTotalWishPages, p + 1))} disabled={currentWishPage === calculatedTotalWishPages} variant="outline" size="sm" className="h-9 rounded-md"><ChevronRight className="w-4 h-4" /></Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="backup" className="mt-6">
                    <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl">
                        <CardHeader className="bg-[#F5F5DC]/50 dark:bg-gray-700/30 border-b border-gray-200/50 dark:border-gray-600/50">
                            <CardTitle className="text-2xl font-semibold text-bordeaux dark:text-[#d4a574]">גיבוי וארכוב מדיה</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">הורד ושמור את כל המדיה מהאירוע למחשב או לגוגל דרייב.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {mediaItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <PackageOpen className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">אין מדיה לגיבוי</h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        לאחר שהאורחים יעלו תמונות וסרטונים, תוכל לגבות אותם כאן.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                                        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">מידע חשוב על גיבוי המדיה:</h3>
                                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                                            <li>האלבום יימחק חודש לאחר תאריך האירוע - <strong>חשוב לגבות את המדיה לפני כן!</strong></li>
                                            <li>הגיבוי כולל את כל התמונות והסרטונים שהאורחים העלו</li>
                                            <li>המדיה תישמר עם שמות המעלים והכיתובים</li>
                                            <li>מומלץ לגבות לגוגל דרייב או למחשב האישי</li>
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {mediaItems.filter(item => item.file_type === 'image').length}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">תמונות</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                            <VideoIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {mediaItems.filter(item => item.file_type === 'video').length}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">סרטונים</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                            <PackageOpen className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {mediaItems.length}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">קבצים סה"כ</p>
                                        </div>
                                    </div>

                                    <GoogleDriveBackup 
                                        mediaItems={mediaItems} 
                                        eventName={eventDetails?.name || 'אירוע'}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sharing" className="mt-6">
                    <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl">
                        <CardHeader className="bg-[#F5F5DC]/50 dark:bg-gray-700/30 border-b border-gray-200/50 dark:border-gray-600/50">
                            <CardTitle className="text-2xl font-semibold text-bordeaux dark:text-[#d4a574] title-main">שיתוף וגישה לאורחים</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">שתף את קוד הגישה וה-QR עם האורחים שלך.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8 text-center">
                            {eventDetails && eventDetails.advance_payment_status !== 'paid' ? (
                                <div className="p-6 bg-yellow-100 dark:bg-yellow-800/30 border-2 border-dashed border-yellow-400 dark:border-yellow-600 rounded-xl text-yellow-700 dark:text-yellow-200">
                                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500 dark:text-yellow-400" />
                                    <h3 className="text-xl font-semibold mb-2">ממתין לאישור תשלום מקדמה</h3>
                                    <p className="text-base">
                                        קודי הגישה וה-QR יוצגו כאן לאחר אישור תשלום המקדמה.
                                        <br />
                                        מנהל המערכת יעדכן את סטטוס התשלום ידנית לאחר קבלת האישור.
                                    </p>
                                    <p className="text-sm mt-3">סטטוס נוכחי: <span className="font-bold">{eventDetails.advance_payment_status === 'pending_payment' ? 'ממתין לתשלום' : (eventDetails.advance_payment_status === 'failed' ? 'תשלום נכשל' : 'לא ידוע')}</span></p>
                                    {eventDetails.advance_payment_status === 'pending_payment' && (
                                        <Button onClick={() => navigate(createPageUrl(`PaymentPage?eventId=${eventId}`))} className="mt-4 btn-bordeaux">
                                            עבור להוראות תשלום
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="text-xl font-semibold text-bordeaux dark:text-[#d4a574] mb-1">קוד QR לכניסת אורחים:</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">הדרך המומלצת לשיתוף. האורחים סורקים ונכנסים ישירות לאלבום.</p>
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 inline-block">
                                                {accessCode ? (
                                                    <img
                                                        src={getQrCodeUrlForEdit(accessCode)}
                                                        alt={`קוד QR עבור ${eventName}`}
                                                        width="200"
                                                        height="200"
                                                        className="rounded-lg"
                                                    />
                                                ) : <Skeleton className="w-[200px] h-[200px] rounded-lg" />}
                                            </div>
                                            <Button onClick={downloadQrCodeAsPdf} variant="outline" className="btn-outline-bordeaux h-12 rounded-xl text-base active:scale-95" disabled={!accessCode}>
                                                <DownloadIcon className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0" />
                                                הורד קוד QR
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-300 dark:border-gray-600 pt-6 space-y-3">
                                        <h3 className="text-xl font-semibold text-bordeaux dark:text-[#d4a574] mb-1">אפשרויות שיתוף נוספות:</h3>
                                        <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
                                            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">קוד גישה טקסטואלי:</span>
                                            <span className="text-2xl font-mono font-bold text-bordeaux dark:text-[#d4a574] bg-[#5C1A1B]/10 dark:bg-bordeaux/20 px-4 py-2 rounded-xl shadow-sm tracking-wider">
                                                {accessCode || "---"}
                                            </span>
                                            <Button variant="ghost" size="icon" onClick={copyAccessCodeToClipboardForEdit} className="h-12 w-12 rounded-xl border-gray-300 dark:border-gray-600 hover:bg-[#5C1A1B]/10 dark:hover:bg-bordeaux/20 active:scale-95" disabled={!accessCode}>
                                                <Copy className="w-5 h-5 text-bordeaux dark:text-[#d4a574]" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
                                            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">קישור ישיר לאלבום:</span>
                                            <Button variant="ghost" size="icon" onClick={copyGuestAccessLinkToClipboardForEdit} className="h-12 w-12 rounded-xl border-gray-300 dark:border-gray-600 hover:bg-[#5C1A1B]/10 dark:hover:bg-bordeaux/20 active:scale-95" disabled={!accessCode}>
                                                <LinkIcon className="w-5 h-5 text-bordeaux dark:text-[#d4a574]" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">(למקרה חירום או שיתוף ללא QR)</p>
                                    </div>
                                    
                                    <div className="border-t border-gray-300 dark:border-gray-600 pt-6 space-y-3">
                                        <h3 className="text-xl font-semibold text-bordeaux dark:text-[#d4a574] mb-1 flex items-center justify-center gap-2">
                                            <MonitorPlay className="w-7 h-7" />
                                            קישור למסכים (Live Slideshow)
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                                            העבר קישור זה למפעיל המסכים באולם. התמונות שאושרו יוצגו בזמן אמת.
                                        </p>
                                        <Button
                                            onClick={() => {
                                                const slideshowUrl = `${window.location.origin}${createPageUrl(`SlideshowPage?eventId=${eventId}`)}`;
                                                navigator.clipboard.writeText(slideshowUrl);
                                                safeShowToast("success", "הקישור לסליידשואו הועתק!", "ניתן להדביק אותו בדפדפן במסך התצוגה.");
                                            }}
                                            variant="outline"
                                            className="btn-outline-bordeaux h-12 rounded-xl text-base active:scale-95"
                                            disabled={!accessCode}
                                        >
                                            <Copy className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0" />
                                            העתק קישור לסליידשואו
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="actions" className="mt-6">
                    <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl">
                        <CardHeader className="bg-[#F5F5DC]/50 dark:bg-gray-700/30 border-b border-gray-200/50 dark:border-gray-600/50">
                            <CardTitle className="text-2xl font-semibold text-bordeaux dark:text-[#d4a574]">פעולות מתקדמות וייצוא</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">ביצוע פעולות נוספות הקשורות לאירוע.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-md">
                                <CardHeader className="py-3 px-4">
                                    <CardTitle className="text-lg flex items-center gap-2 text-blue-800 dark:text-blue-200"><Mail className="w-5 h-5"/>שליחת אלבום אישי לאורחים</CardTitle>
                                    <CardDescription className="text-blue-700 dark:text-blue-300">שלח לכל אורח שהעלה תמונות מייל עם קישור לאלבום אישי המכיל רק את התמונות שהוא צילם, בתוספת הודעת תודה אישית ממך.</CardDescription>
                                </CardHeader>
                                <CardFooter className="py-3 px-4">
                                    <Button onClick={handleSendPersonalAlbums} disabled={isSendingEmails} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                                        {isSendingEmails ? (
                                            <>
                                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                                שולח...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 ml-2" />
                                                שלח מיילים לאורחים
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>

                            {(() => {
                                const isEventCreator = eventDetails?.created_by === currentUser?.id || eventDetails?.created_by === currentUser?.email;
                                const isAdmin = currentUser?.role === 'admin';
                                return (isEventCreator || isAdmin);
                            })() && (
                                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 shadow-md">
                                    <CardHeader className="py-3 px-4">
                                        <CardTitle className="text-lg flex items-center gap-2 text-red-800 dark:text-red-200">
                                            <Trash2 className="w-5 h-5"/>
                                            פעולות מחיקה מתקדמות
                                        </CardTitle>
                                        <CardDescription className="text-red-700 dark:text-red-300">
                                            פעולות מתקדמות למחיקת מדיה או מחיקת האירוע כולו. <strong>פעולות אלו בלתי הפיכות!</strong>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="py-3 px-4 space-y-3">
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">⚠️ אזהרה:</p>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                פעולות אלו מחקות נתונים לצמיתות ולא ניתן לשחזר אותם לאחר המחיקה.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>מחיקת כל המדיה:</strong> מוחקת את כל התמונות והסרטונים מהאירוע, אך משאירה את פרטי האירוע.
                                            </p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>מחיקת האירוע:</strong> מוחקת את האירוע כולו כולל כל המדיה, קטגוריות וברכות.
                                            </p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="py-3 px-4 gap-3">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="destructive" 
                                                    disabled={isSubmitting || !mediaItems?.length}
                                                    className="rounded-md"
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 className="w-4 h-4 ml-2 animate-spin"/>
                                                    ) : (
                                                        <Trash2 className="w-4 h-4 ml-2"/>
                                                    )}
                                                    מחק את כל המדיה ({mediaItems?.length || 0})
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent dir="rtl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את כל המדיה?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        פעולה זו תמחק לצמיתות את כל {mediaItems?.length || 0} קבצי המדיה מהאירוע.
                                                        לא ניתן לבטל פעולה זו לאחר ביצועה.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleDeleteAllMedia}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        כן, מחק את כל המדיה
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="destructive" 
                                                    disabled={isSubmitting}
                                                    className="rounded-md bg-red-700 hover:bg-red-800"
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 className="w-4 h-4 ml-2 animate-spin"/>
                                                    ) : (
                                                        <Trash2 className="w-4 h-4 ml-2"/>
                                                    )}
                                                    מחק אירוע לצמיתות
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent dir="rtl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את האירוע לצמיתות?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        פעולה זו תמחק לצמיתות את האירוע "{eventName}" כולל:
                                                        <br />• כל המדיה ({mediaItems?.length || 0} קבצים)
                                                        <br />• כל הקטגוריות והברכות
                                                        <br />• כל הנתונים הקשורים לאירוע
                                                        <br /><br />
                                                        <strong>לא ניתן לשחזר את הנתונים לאחר המחיקה!</strong>
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleDeleteEvent}
                                                        className="bg-red-700 hover:bg-red-800"
                                                    >
                                                        כן, מחק את האירוע לצמיתות
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardFooter>
                                </Card>
                            )}

                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
