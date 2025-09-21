
import React, { useState, useEffect, useRef } from 'react';
import { Event } from '@/api/entities';
import { User } from '@/api/entities';
import { HighlightCategory } from '@/api/entities';
import { UploadFile, SendEmail } from '@/api/integrations';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
    Calendar as CalendarIcon, ImageUp, Save, Loader2, ArrowRight, ChevronRight, ChevronLeft,
    Info, ShieldCheck, CheckCircle, Copy, Download, Phone, Sparkles, ExternalLink,
    Plus, Trash2, Tag, Users, Heart, Music2, GlassWater, Cake, Gift, PartyPopper, Camera,
    Video as VideoIconLucide,
    Mic2, Presentation, Coffee, Smile, ThumbsUp, Sun, Moon, Megaphone, Palette,
    ShoppingBag, Briefcase, GraduationCap, Plane, Ship, Car, Bike, TreeDeciduous,
    Flower2, Award, Trophy, Film, Clapperboard, Ticket, Baby, Dog, Cat, ScrollText, Disc3, Search,
    CreditCard, AlertCircle, MessageSquare, Link as LinkIcon, Wand2, XCircle, FileText
} from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, add, sub } from "date-fns";
import { he } from 'date-fns/locale';
import { Progress } from "@/components/ui/progress";
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventNotification } from '@/api/entities';
import { notifyEventCreated, notifyPaymentRequired } from '@/utils/notificationManager';

// CardCom Integration
const CARDCOM_TERMINAL_NUMBER = "1000";
const CARDCOM_USERNAME = "barak9611";
const CARDCOM_API_URL = "https://secure.cardcom.solutions/Interface/LowProfile.aspx";

const generateAccessCode = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const eventTypes = [
  { value: "wedding", label: "חתונה" },
  { value: "corporate", label: "ערב חברה" },
  { value: "birthday", label: "יום הולדת" },
  { value: "bar_mitzvah", label: "בר מצווה" },
  { value: "bat_mitzvah", label: "בת מצווה" },
  { value: "bachelor_party", label: "מסיבת רווקות/רווקים" },
  { value: "henna", label: "חינה" }, // Added
  { value: "party", label: "מסיבה" },
  { value: "other", label: "אחר" },
];

const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hours = String(Math.floor(i / 2)).padStart(2, '0');
    const minutes = String((i % 2) * 30).padStart(2, '0');
    return `${hours}:${minutes}`;
});

const highlightIconsList = [
  { name: 'Users', Icon: Users }, { name: 'Heart', Icon: Heart }, { name: 'Music2', Icon: Music2 },
  { name: 'GlassWater', Icon: GlassWater }, { name: 'Cake', Icon: Cake }, { name: 'Gift', Icon: Gift },
  { name: 'PartyPopper', Icon: PartyPopper }, { name: 'Camera', Icon: Camera }, { name: 'VideoIconLucide', Icon: VideoIconLucide },
  { name: 'Mic2', Icon: Mic2 }, { name: 'Presentation', Icon: Presentation }, { name: 'Coffee', Icon: Coffee },
  { name: 'Smile', Icon: Smile }, { name: 'ThumbsUp', Icon: ThumbsUp },
  { name: 'Sun', Icon: Sun }, { name: 'Moon', Icon: Moon }, { name: 'Sparkles', Icon: Sparkles },
  { name: 'Megaphone', Icon: Megaphone }, { name: 'Palette', Icon: Palette }, { name: 'ShoppingBag', Icon: ShoppingBag },
  { name: 'Briefcase', Icon: Briefcase }, { name: 'GraduationCap', Icon: GraduationCap }, { name: 'Plane', Icon: Plane },
  { name: 'Ship', Icon: Ship }, { name: 'Car', Icon: Car }, { name: 'Bike', Icon: Bike },
  { name: 'TreeDeciduous', Icon: TreeDeciduous }, { name: 'Flower2', Icon: Flower2 }, { name: 'Award', Icon: Award },
  { name: 'Trophy', Icon: Trophy }, { name: 'Film', Icon: Film }, { name: 'Clapperboard', Icon: Clapperboard },
  { name: 'Ticket', Icon: Ticket }, { name: 'Baby', Icon: Baby }, { name: 'Dog', Icon: Dog }, { name: 'Cat', Icon: Cat },
  { name: 'ScrollText', Icon: ScrollText }, { name: 'Disc3', Icon: Disc3 }
];

const defaultHighlightSuggestions = {
  wedding: [
    { name: "קבלת פנים", icon_name: "Users" }, { name: "טקס חופה", icon_name: "Heart" },
    { name: "ריקודים", icon_name: "Music2" }, { name: "אוכל ושתייה", icon_name: "GlassWater" },
    { name: "משפחה וחברים", icon_name: "PartyPopper" }, { name: "ברכות", icon_name: "Mic2"}
  ],
  corporate: [
    { name: "הרצאות", icon_name: "Presentation" }, { name: "פעילות צוות", icon_name: "Users" },
    { name: "כיבוד", icon_name: "Coffee" }, { name: "מינגלינג", icon_name: "Smile" }
  ],
  birthday: [
    { name: "עוגה וברכות", icon_name: "Cake" }, { name: "מתנות", icon_name: "Gift" },
    { name: "משחקים והפעלות", icon_name: "PartyPopper" }, { name: "חברים ומשפחה", icon_name: "Users" }
  ],
  bar_mitzvah: [
    { name: "עלייה לתורה", icon_name: "ScrollText" }, { name: "ריקודים", icon_name: "Music2" },
    { name: "משפחה", icon_name: "Users" }, { name: "דרשה/נאום", icon_name: "Mic2" }
  ],
  bat_mitzvah: [
    { name: "הדלקת נרות", icon_name: "Sparkles" }, { name: "ריקודים", icon_name: "Music2" },
    { name: "משפחה", icon_name: "Users" }, { name: "נאומים", icon_name: "Mic2" }
  ],
  bachelor_party: [
    { name: "ריקודים", icon_name: "Music2" }, { name: "חברים", icon_name: "Users" },
    { name: "בר/שתיה", icon_name: "GlassWater" }, { name: "אווירה", icon_name: "PartyPopper" }
  ],
  henna: [ // Added suggestions for Henna
    { name: "טקס חינה", icon_name: "Palette" }, { name: "תלבושות", icon_name: "ShoppingBag" },
    { name: "ריקודים מסורתיים", icon_name: "Music2" }, { name: "מתוקים", icon_name: "Cake" },
    { name: "משפחה וחברים", icon_name: "Users" }
  ],
  party: [
    { name: "DJ ומוזיקה", icon_name: "Disc3" }, { name: "ריקודים", icon_name: "Music2" },
    { name: "אווירה", icon_name: "Sparkles" }, { name: "חברים", icon_name: "Users" }
  ],
};

const ADVANCE_PAYMENT_FIXED_AMOUNT = 500; // Defined for consistency
const STRINGS_CONTACT_EMAIL = "strings.eventalbums@gmail.com";
const STRINGS_CONTACT_WHATSAPP_URL = "https://wa.me/972501234567";
const STRINGS_INSTAGRAM_URL = "https://www.instagram.com/strings.eventalbums/";
const YOUR_BANK_DETAILS = "בנק הפועלים (12), סניף 123, חשבון 123456, על שם 'סטרינגס הפקות'";
const STRINGS_INTERNAL_EMAIL = "stringsalbumapp@gmail.com"; // Define your internal email address

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [locationText, setLocationText] = useState('');
  const [braceletsCount, setBraceletsCount] = useState(''); // Updated field name and purpose
  const [guestCountEstimate, setGuestCountEstimate] = useState(''); // Now optional
  const [organizerPhoneNumber, setOrganizerPhoneNumber] = useState('');
  const [totalDealAmount, setTotalDealAmount] = useState(''); // Added field

  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [guestThankYouMessage, setGuestThankYouMessage] = useState(''); // New state for the thank you message
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [previewCoverImageUrl, setPreviewCoverImageUrl] = useState('');
  const [allowVideoUploads, setAllowVideoUploads] = useState(true);
  // Removed autoApproveMedia - it will be true by default

  const [highlightCategories, setHighlightCategories] = useState([]);
  const [newHighlightName, setNewHighlightName] = useState('');
  const [newHighlightIcon, setNewHighlightIcon] = useState('');
  const [suggestedHighlights, setSuggestedHighlights] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [createdEventId, setCreatedEventId] = useState(null);
  const [createdEventDetails, setCreatedEventDetails] = useState(null);
  const [finalAccessCode, setFinalAccessCode] = useState('');
  
  const [agreedToPaymentTerms, setAgreedToPaymentTerms] = useState(false);
  const [agreedToTermsOfService, setAgreedToTermsOfService] = useState(false); // New state for terms of service
  const [showTermsModal, setShowTermsModal] = useState(false); // New state for terms modal

  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [cardcomPaymentUrl, setCardcomPaymentUrl] = useState('');

  const qrCodeBaseUrl = "https://api.qrserver.com/v1/create-qr-code/";

  const safeShowToast = (type, title, description) => {
    if (window.showToast) {
      window.showToast(type, title, description);
    } else {
      console.warn("window.showToast not available. Message:", title, description);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        if (user.phone_number) {
            setOrganizerPhoneNumber(user.phone_number);
        }
      } catch (error) {
        safeShowToast("error", "שגיאת אימות", "יש להתחבר כדי ליצור אירוע.");
        navigate(createPageUrl('MyEvents'));
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (eventType && defaultHighlightSuggestions[eventType]) {
      const existingCategoryNames = highlightCategories.map(cat => cat.name);
      const newSuggestions = defaultHighlightSuggestions[eventType].filter(
        suggestion => !existingCategoryNames.includes(suggestion.name)
      );
      setSuggestedHighlights(newSuggestions);
    } else {
      setSuggestedHighlights([]);
    }
  }, [eventType, highlightCategories]);

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      setPreviewCoverImageUrl(URL.createObjectURL(file));
    }
  };

  const validateStep1 = () => {
    if (!eventName || !eventType || !eventDate || !startTime || !locationText || !braceletsCount || !organizerPhoneNumber || !totalDealAmount) { // Added totalDealAmount
      safeShowToast("error", "שדות חובה חסרים", "אנא מלא את כל השדות המסומנים בכוכבית (*).");
      return false;
    }
    if (isNaN(parseInt(braceletsCount)) || parseInt(braceletsCount) <= 0) {
      safeShowToast("error", "כמות צמידים לא תקינה", "אנא הזן כמות צמידים חיובית.");
      return false;
    }
    if (guestCountEstimate && (isNaN(parseInt(guestCountEstimate)) || parseInt(guestCountEstimate) < 0)) {
      safeShowToast("error", "כמות אורחים לא תקינה", "כמות האורחים חייבת להיות מספר חיובי (או להישאר ריקה).");
      return false;
    }
    if (!/^\d{9,10}$/.test(organizerPhoneNumber.replace(/-/g, ''))) {
      safeShowToast("error", "מספר טלפון לא תקין", "אנא הזן מספר טלפון ישראלי תקין (9-10 ספרות).");
      return false;
    }
    if (isNaN(parseFloat(totalDealAmount)) || parseFloat(totalDealAmount) <= 0) {
        safeShowToast("error", "סכום עסקה לא תקין", "אנא הזן סכום עסקה כולל חיובי.");
        return false;
    }
    return true;
  };

  const getQrCodeUrl = (data, size = "1000x1000", ecc = "H") => {
    const pageNameWithParam = `GuestAccess?code=${data}`;
    const relativeGuestAccessUrl = createPageUrl(pageNameWithParam);
    // IMPORTANT: Ensure window.location.origin is correct.
    // For local dev, it might be http://localhost:XXXX, for prod, the actual domain.
    const currentOrigin = window.location.origin;
    const fullGuestAccessUrl = `${currentOrigin}${relativeGuestAccessUrl}`;

    console.log(`CreateEvent.js - getQrCodeUrl - Code for QR: ${data}`);
    console.log(`CreateEvent.js - getQrCodeUrl - Page name for createPageUrl: ${pageNameWithParam}`);
    console.log(`CreateEvent.js - getQrCodeUrl - Relative URL from createPageUrl: ${relativeGuestAccessUrl}`);
    console.log(`CreateEvent.js - getQrCodeUrl - window.location.origin: ${currentOrigin}`);
    console.log(`CreateEvent.js - getQrCodeUrl - Full URL for QR (to be encoded): ${fullGuestAccessUrl}`);

    const qrServiceUrl = `${qrCodeBaseUrl}?data=${encodeURIComponent(fullGuestAccessUrl)}&size=${size}&ecc=${ecc}&margin=10&color=5C1A1B&bgcolor=FFF8E7&qzone=1&format=png`;
    console.log(`CreateEvent.js - getQrCodeUrl - Final QR Service URL: ${qrServiceUrl}`);
    return qrServiceUrl;
  };

  // New function for black and white QR code
  const getQrCodeUrlBlackWhite = (data, size = "1000x1000", ecc = "H") => {
    const pageNameWithParam = `GuestAccess?code=${data}`;
    const relativeGuestAccessUrl = createPageUrl(pageNameWithParam);
    const currentOrigin = window.location.origin;
    const fullGuestAccessUrl = `${currentOrigin}${relativeGuestAccessUrl}`;

    const qrServiceUrl = `${qrCodeBaseUrl}?data=${encodeURIComponent(fullGuestAccessUrl)}&size=${size}&ecc=${ecc}&margin=10&color=000000&bgcolor=FFFFFF&qzone=1&format=png`;
    console.log(`CreateEvent.js - getQrCodeUrlBlackWhite - Final Black & White QR Service URL: ${qrServiceUrl}`);
    return qrServiceUrl;
  };

  const handleProceedToPaymentInstructions = async () => {
    if (!validateStep1()) return;
    setIsSubmitting(true);
    let uploadedCoverImageUrl = '';

    try {
      if (coverImageFile) {
        const uploadResult = await UploadFile({ file: coverImageFile });
        uploadedCoverImageUrl = uploadResult.file_url;
      }

      const tempAccessCode = generateAccessCode(); // Generate code before creating event

      // Create basic event data that matches existing database schema
      const eventData = {
        name: eventName,
        description: `${eventType} event at ${locationText}`,
        date: format(eventDate, "yyyy-MM-dd"),
        location: locationText,
        access_code: tempAccessCode,
        organizer_name: currentUser?.full_name || 'Unknown',
        organizer_phone: organizerPhoneNumber,
        organizer_email: currentUser?.email,
        advance_payment_status: 'pending_payment',
        advance_payment_amount: ADVANCE_PAYMENT_FIXED_AMOUNT,
        created_by: currentUser?.id,
        // Add new fields only if they exist in database
        ...(eventType && { event_type: eventType }),
        ...(eventDate && { event_date: format(eventDate, "yyyy-MM-dd") }),
        ...(startTime && { start_time: startTime }),
        ...(locationText && { location_text: locationText }),
        ...(braceletsCount && { bracelets_count: parseInt(braceletsCount) }),
        ...(guestCountEstimate && { guest_count_estimate: parseInt(guestCountEstimate) }),
        ...(organizerPhoneNumber && { organizer_phone_number: organizerPhoneNumber }),
        ...(welcomeMessage && { welcome_message: welcomeMessage }),
        ...(guestThankYouMessage && { guest_thank_you_message: guestThankYouMessage }),
        ...(uploadedCoverImageUrl && { cover_image_url: uploadedCoverImageUrl }),
        allow_video_uploads: false,
        auto_approve_media: true,
        total_deal_amount: parseFloat(totalDealAmount),
        advance_payment_fixed_amount: ADVANCE_PAYMENT_FIXED_AMOUNT,
        user_agreed_to_payment_terms: false
      };

      const createdEvent = await Event.create(eventData);
      setCreatedEventId(createdEvent.id);
      setFinalAccessCode(createdEvent.access_code); // Ensure finalAccessCode is set from the created event
      setCreatedEventDetails(createdEvent);

      // Admin notification will be sent later with full event details

      for (const category of highlightCategories) {
        if (category.id && category.id.toString().startsWith('temp-')) {
            await HighlightCategory.create({
                event_id: createdEvent.id,
                name: category.name,
                icon_name: category.icon_name,
            });
        }
      }

      // Generate QR codes for email and for internal notification
      const pageNameWithParam = `GuestAccess?code=${createdEvent.access_code}`;
      const relativeGuestAccessUrl = createPageUrl(pageNameWithParam);
      const currentOrigin = window.location.origin;
      const fullGuestAccessUrl = `${currentOrigin}${relativeGuestAccessUrl}`;

      // Also generate direct URL with event ID (new method)
      const directGuestUrl = `${currentOrigin}/guest/${createdEvent.id}`;

      // High-quality QR for email display
      const emailQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(directGuestUrl)}&size=300x300&ecc=M&margin=1&color=5C1A1B&bgcolor=F8F4E6&format=png`;
      
      // High-quality QR for bracelet printing (1.5cm size)
      const braceletQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(directGuestUrl)}&size=200x200&ecc=H&margin=0&color=000000&bgcolor=FFFFFF&qzone=0&format=png`;
      
      // High-quality QR with minimal margin for tight spaces
      const compactQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(directGuestUrl)}&size=400x400&ecc=H&margin=1&color=000000&bgcolor=FFFFFF&qzone=0&format=png`;

      // Email to user confirming event creation
      const eventTypeHebrew = eventTypes.find(type => type.value === eventType)?.label || eventType;
      const eventDateFormatted = eventDate ? format(eventDate, "PPP", { locale: he }) : 'לא צוין';

      const emailBodyToUser = `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; max-width: 600px; margin: 0 auto; background-color: #FEFBF3; padding: 20px;">
            <div style="background: linear-gradient(135deg, #5C1A1B 0%, #8B2635 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🎉 האירוע שלך נוצר בהצלחה!</h1>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <h2 style="color: #5C1A1B; margin-top: 0; border-bottom: 2px solid #F5F5DC; padding-bottom: 10px;">${createdEvent.name}</h2>
                
                <div style="display: grid; gap: 10px; margin: 15px 0;">
                    <div><strong>🎭 סוג אירוע:</strong> ${eventTypeHebrew}</div>
                    <div><strong>📅 תאריך:</strong> ${eventDateFormatted} בשעה ${startTime}</div>
                    <div><strong>📍 מיקום:</strong> ${locationText}</div>
                    <div><strong>🎫 צמידים:</strong> ${braceletsCount}</div>
                    <div><strong>💰 סכום עסקה:</strong> ₪${totalDealAmount}</div>
                    <div><strong>🏷️ קוד גישה:</strong> <span style="font-family: monospace; background: #F5F5DC; padding: 5px 10px; border-radius: 6px; font-weight: bold; font-size: 18px;">${createdEvent.access_code}</span></div>
                </div>
            </div>

            <div style="background: #FFF3E0; border: 2px solid #FF9800; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: #E65100; margin-top: 0;">📋 השלבים הבאים:</h4>
                <ol style="color: #BF360C; font-size: 14px; margin: 0; padding-right: 20px;">
                    <li><strong>תשלום מקדמה:</strong> בצע תשלום מקדמה בסך ₪${ADVANCE_PAYMENT_FIXED_AMOUNT} להפעלת האירוע</li>
                    <li><strong>אישור תשלום:</strong> לאחר התשלום, קוד הגישה לאורחים יופעל אוטומטית</li>
                    <li><strong>ניהול האירוע:</strong> תוכל לערוך פרטים ולהוריד קוד QR מהממשק שלך</li>
                    <li><strong>שיתוף עם אורחים:</strong> חלק את קוד ה-QR או הקוד הטקסטואלי עם האורחים</li>
                </ol>
            </div>

            <div style="background: #E3F2FD; border: 2px solid #2196F3; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                <h4 style="color: #1565C0; margin-top: 0; font-size: 18px;">📱 QR Code לאורחים - מוכן להדפסה!</h4>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; display: inline-block;">
                    <img src="${emailQrUrl}" alt="QR Code for Event Access" style="display: block; margin: 0 auto;" />
                    <p style="margin: 10px 0 5px 0; font-size: 14px; color: #666;">קוד QR לגישה ישירה לאלבום</p>
                    <p style="margin: 0; font-size: 12px; color: #999;">הדפס או שלח לאורחים</p>
                </div>
                
                <div style="background: #FFF8E1; padding: 10px; border-radius: 6px; margin: 15px 0; font-size: 14px;">
                    <strong>📋 הוראות שימוש:</strong><br/>
                    • סרוק עם המצלמה או אפליקציית QR<br/>
                    • הדפס על הזמנות, צמידים או שלטים<br/>
                    • שלח בווטסאפ או מייל לאורחים
                </div>
                
                <div style="margin: 15px 0;">
                    <p style="font-size: 14px; color: #666; margin: 5px 0;">קישור ישיר:</p>
                    <a href="${directGuestUrl}" style="font-family: monospace; font-size: 12px; color: #2196F3; word-break: break-all;">${directGuestUrl}</a>
                </div>
            </div>

            <div style="background: #E8F5E8; border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <h4 style="color: #2E7D32; margin-top: 0;">🔗 קישורים שימושיים</h4>
                <div style="margin: 15px 0;">
                    <a href="${window.location.origin}${createPageUrl('MyEvents')}" style="display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 5px;">
                        📊 הממשק שלי
                    </a>
                    <a href="${window.location.origin}${createPageUrl(`EditEvent?id=${createdEvent.id}`)}" style="display: inline-block; background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 5px;">
                        ✏️ ערוך אירוע
                    </a>
                </div>
            </div>

            ${welcomeMessage ? `
            <div style="background: #FFF8E0; border-right: 4px solid #D4AF37; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: #B8860B; margin-top: 0;">💬 ההודעה שלך לאורחים:</h4>
                <p style="font-style: italic; color: #8B7355; margin: 0;">"${welcomeMessage}"</p>
            </div>
            ` : ''}

            <div style="background: #F0F0F0; border-radius: 8px; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 0;">💌 קיבלת מייל זה כי יצרת אירוע במערכת STRINGS</p>
                <p style="margin: 5px 0 0 0;">🕐 נשלח ב: ${format(new Date(), 'PPp', { locale: he })}</p>
            </div>
        </div>
        `;

      await SendEmail({
          to: currentUser?.email,
          subject: `✨ האירוע "${createdEvent.name}" נוצר בהצלחה! | קוד: ${createdEvent.access_code}`,
          body: emailBodyToUser,
      });

      // Generate QR codes for STRINGS team email (using direct guest URL)
      const stringsEmailQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(directGuestUrl)}&size=250x250&ecc=M&margin=1&color=5C1A1B&bgcolor=F8F4E6&format=png`;
      const stringsBraceletQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(directGuestUrl)}&size=200x200&ecc=H&margin=0&color=000000&bgcolor=FFFFFF&qzone=0&format=png`;

      // Email to STRINGS team with downloadable QR versions
      const emailBodyToStrings = `
            <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; max-width: 600px; margin: 0 auto; background-color: #FEFBF3; padding: 20px;">
                <div style="background: linear-gradient(135deg, #5C1A1B 0%, #8B2635 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🎉 אירוע חדש נוצר במערכת STRINGS</h1>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                    <h2 style="color: #5C1A1B; margin-top: 0; border-bottom: 2px solid #F5F5DC; padding-bottom: 10px;">${createdEvent.name}</h2>
                    
                    <div style="display: grid; gap: 10px; margin: 15px 0;">
                        <div><strong>🎭 סוג אירוע:</strong> ${eventTypeHebrew}</div>
                        <div><strong>📅 תאריך:</strong> ${eventDateFormatted} בשעה ${startTime}</div>
                        <div><strong>📍 מיקום:</strong> ${locationText}</div>
                        <div><strong>👤 מארגן:</strong> ${currentUser?.full_name || 'לא ידוע'} (${currentUser?.email})</div>
                        <div><strong>📞 טלפון:</strong> ${organizerPhoneNumber}</div>
                        <div><strong>🎫 צמידים:</strong> ${braceletsCount}</div>
                        <div><strong>💰 סכום עסקה:</strong> ₪${totalDealAmount}</div>
                        <div><strong>🏷️ קוד גישה (מיושן):</strong> <span style="font-family: monospace; background: #F5F5DC; padding: 5px 10px; border-radius: 6px; font-weight: bold; font-size: 18px;">${createdEvent.access_code}</span></div>
                        <div><strong>🚀 גישה ישירה:</strong> <a href="${directGuestUrl}" style="color: #2196F3; font-weight: bold;">${directGuestUrl}</a></div>
                    </div>
                </div>

                <div style="background: #E3F2FD; border: 2px solid #2196F3; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                    <h3 style="color: #1976D2; margin-top: 0;">🏷️ קוד QR לצמידים (1.5x1.5 ס"מ)</h3>
                    <div style="margin: 15px 0;">
                        <img src="${stringsBraceletQrUrl}" alt="קוד QR לצמידים" style="border: 2px solid #2196F3; border-radius: 8px; max-width: 100px; background: white; padding: 5px;" />
                    </div>
                    <p style="font-size: 14px; color: #1976D2; margin: 10px 0; font-weight: bold;">
                        📏 מידות: בדיוק 1.5x1.5 ס"מ<br>
                        🔍 אופטימיזציה לצמידים קטנים<br>
                        ⚡ ללא מרווחים - מקסימום שטח QR<br>
                        🚀 גישה ישירה - בלי קוד גישה!
                    </p>
                    <div style="margin: 15px 0;">
                        <a href="${stringsBraceletQrUrl}" download="QR_${createdEvent.id}_bracelet.png" style="display: inline-block; background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            💾 הורד QR לצמידים
                        </a>
                    </div>
                </div>

                <div style="background: #E8F5E8; border: 2px solid #4CAF50; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                    <h3 style="color: #2E7D32; margin-top: 0;">🖨️ קוד QR איכותי (גרסה גדולה)</h3>
                    <div style="margin: 15px 0;">
                        <img src="${stringsEmailQrUrl}" alt="קוד QR איכותי" style="border: 2px solid #4CAF50; border-radius: 8px; max-width: 150px;" />
                    </div>
                    <p style="font-size: 14px; color: #2E7D32; margin: 10px 0; font-weight: bold;">
                        📏 רזולוציה גבוהה: 400x400 פיקסלים<br>
                        🔍 להדפסה איכותית או הגדלה<br>
                        💎 תיקון שגיאות מתקדם
                    </p>
                    <div style="margin: 15px 0;">
                        <a href="${stringsEmailQrUrl}" download="QR_${createdEvent.id}_high_quality.png" style="display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            💾 הורד QR איכותי
                        </a>
                    </div>
                    <div style="background: white; padding: 10px; border-radius: 6px; margin-top: 10px;">
                        <p style="font-size: 12px; color: #555; margin: 0;">
                            <strong>הוראות הדפסה:</strong><br>
                            • שמור את התמונה מהמייל<br>
                            • הדפס ב-300 DPI או יותר<br>
                            • לצמידים: הדפס בגודל 1.5x1.5 ס"מ בדיוק<br>
                            • ודא שהמדפסת מכוילת לדיוק מקסימלי
                        </p>
                    </div>
                </div>

                <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; text-align: center;">
                    <h3 style="color: #5C1A1B; margin-top: 0;">📱 קוד QR לתצוגה באימייל</h3>
                    <div style="margin: 15px 0;">
                        <img src="${stringsEmailQrUrl}" alt="קוד QR לאירוע" style="border: 3px solid #5C1A1B; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
                    </div>
                    <div style="margin: 15px 0;">
                        <a href="${stringsEmailQrUrl}" download="QR_${createdEvent.id}_display.png" style="display: inline-block; background: #5C1A1B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            💾 הורד QR צבעוני
                        </a>
                    </div>
                </div>

                <div style="background: #FFE0B2; border: 2px solid #FF9800; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #E65100; margin-top: 0;">💡 איך להוריד את הקודים:</h4>
                    <ol style="color: #BF360C; font-size: 13px; margin: 0; padding-right: 20px;">
                        <li><strong>בדפדפן:</strong> לחץ על כפתור "הורד" מתחת לכל קוד</li>
                        <li><strong>בטלפון:</strong> לחץ זמן ארוך על התמונה ו"שמור תמונה"</li>
                        <li><strong>קליק ימני:</strong> על התמונה ו"שמור תמונה בשם"</li>
                        <li><strong>גיבוי:</strong> שמור את כל 3 הגרסאות - כל אחת לשימוש אחר</li>
                    </ol>
                </div>

                <div style="background: #FFF3E0; border: 2px solid #FF9800; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #E65100; margin-top: 0;">🔄 טיפים לקוד QR עגול:</h4>
                    <ul style="color: #BF360C; font-size: 13px; margin: 0; padding-right: 20px;">
                        <li>אם אתה רוצה מראה עגול, חתוך את התמונה בצורה עגולה לאחר ההדפסה</li>
                        <li>השאר את קוד ה-QR עצמו מרובע כדי לשמור על הפונקציונליות</li>
                        <li>אפשר להוסיף מסגרת עגולה סביב הקוד המרובע</li>
                        <li>קוד QR חייב להישאר מרובע כדי שהמכשירים יוכלו לקרוא אותו</li>
                    </ul>
                </div>

                <div style="background: #F3E5F5; border: 2px solid #9C27B0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #7B1FA2; margin-top: 0;">📋 קישורים ישירים להורדה:</h4>
                    <div style="background: white; padding: 10px; border-radius: 6px; margin-top: 10px; font-family: monospace; font-size: 11px;">
                        <p style="margin: 5px 0;"><strong>צמידים:</strong> <a href="${braceletQrUrl}" style="color: #2196F3;">${braceletQrUrl}</a></p>
                        <p style="margin: 5px 0;"><strong>איכותי:</strong> <a href="${compactQrUrl}" style="color: #4CAF50;">${compactQrUrl}</a></p>
                        <p style="margin: 5px 0;"><strong>צבעוני:</strong> <a href="${emailQrUrl}" style="color: #5C1A1B;">${emailQrUrl}</a></p>
                    </div>
                </div>

                ${welcomeMessage ? `
                <div style="background: #FFF8E0; border-right: 4px solid #D4AF37; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #B8860B; margin-top: 0;">💬 הודעת פתיחה לאורחים:</h4>
                    <p style="font-style: italic; color: #8B7355; margin: 0;">"${welcomeMessage}"</p>
                </div>
                ` : ''}

                <div style="background: #F0F0F0; border-radius: 8px; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                    <p style="margin: 0;">📧 מייל זה נשלח אוטומטית ממערכת STRINGS</p>
                    <p style="margin: 5px 0 0 0;">🕐 נשלח ב: ${format(new Date(), 'PPp', { locale: he })}</p>
                </div>
            </div>
            `;

      await SendEmail({
          to: STRINGS_INTERNAL_EMAIL,
          subject: `🎉 אירוע חדש: ${createdEvent.name} | קוד: ${createdEvent.access_code}`,
          body: emailBodyToStrings,
      });

      // Create notification for STRINGS admin (existing logic)
      try {
        // The QR images for the notification are already generated by getQrCodeUrl and getQrCodeUrlBlackWhite functions
        // They might be different than the ones generated for the email, which is fine as they serve different purposes.
        const qrImageUrl = getQrCodeUrl(createdEvent.access_code);
        const qrImageUrlBlackWhite = getQrCodeUrlBlackWhite(createdEvent.access_code, "1000x1000", "H");
        const guestAccessLink = `${window.location.origin}${createPageUrl(`GuestAccess?code=${createdEvent.access_code}`)}`;
        
        const eventDetailsForNotification = {
          event_name: createdEvent.name,
          event_type: eventTypes.find(et => et.value === createdEvent.event_type)?.label || createdEvent.event_type,
          event_date: createdEvent.event_date ? format(parseISO(createdEvent.event_date), "PPP", { locale: he }) : 'לא צוין',
          start_time: createdEvent.start_time,
          location_text: createdEvent.location_text,
          bracelets_count: createdEvent.bracelets_count,
          guest_count_estimate: createdEvent.guest_count_estimate || 'לא צוין',
          organizer_phone_number: createdEvent.organizer_phone_number,
          total_deal_amount: createdEvent.total_deal_amount,
          advance_payment_status: 'ממתין לתשלום',
          advance_payment_fixed_amount: createdEvent.advance_payment_fixed_amount,
          welcome_message: createdEvent.welcome_message || 'ללא',
          guest_thank_you_message: createdEvent.guest_thank_you_message || 'ללא', // Add to notification
          cover_image_url: createdEvent.cover_image_url ? 'יש' : 'אין',
          allow_video_uploads: createdEvent.allow_video_uploads ? 'כן' : 'לא',
          highlight_categories: highlightCategories.length > 0 ? highlightCategories.map(cat => `${cat.name} (אייקון: ${cat.icon_name || 'ללא'})`).join(', ') : 'ללא',
          access_code: createdEvent.access_code,
          guest_access_link: guestAccessLink,
          qr_code_colored: qrImageUrl,
          qr_code_black_white: qrImageUrlBlackWhite
        };

        await notifyEventCreated(createdEvent, currentUser);

        // Send payment required notification if payment is pending
        if (createdEvent.advance_payment_status === 'pending_payment') {
          try {
            await notifyPaymentRequired(createdEvent, currentUser);
            console.log('✅ Payment required notification sent to admin');
          } catch (notificationError) {
            console.warn('⚠️ Failed to send payment required notification:', notificationError);
          }
        }

        safeShowToast("success", "האירוע נוצר בהצלחה!", "פרטי האירוע נשמרו במערכת ונשלחה התראה לצוות STRINGS.");
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
        safeShowToast("warn", "שגיאה בשמירת התראה", "האירוע נוצר אך לא נשמרה התראה לצוות.");
      }

      setCurrentStep(2);
    } catch (error) {
      console.error("Error creating event (step 1):", error);
      safeShowToast("error", "שגיאה ביצירת האירוע", "אירעה שגיאה בשמירת פרטי האירוע. נסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateCardComPayment = async () => {
    if (!createdEventId || !createdEventDetails) {
      safeShowToast("error", "שגיאה", "פרטי האירוע לא נמצאו.");
      return;
    }

    setPaymentInProgress(true);
    
    try {
      const eventDateFormattedForCardCom = eventDate ? format(eventDate, "yyyy-MM-dd") : 'לא צוין';

      // Prepare CardCom payment parameters
      const paymentParams = {
        TerminalNumber: CARDCOM_TERMINAL_NUMBER,
        UserName: CARDCOM_USERNAME,
        Sum: ADVANCE_PAYMENT_FIXED_AMOUNT,
        Coin: 1, // ILS
        Language: "he",
        Operation: 1, // Charge
        ProductName: `מקדמה עבור אירוע: ${createdEventDetails.name}`,
        UserId: createdEventDetails.id, // Using event_id as UserId for CardCom
        APILevel: 10,
        ReturnValue: `event_id=${encodeURIComponent(createdEventDetails.id)}&access_code=${encodeURIComponent(createdEventDetails.access_code)}`,
        SuccessRedirectUrl: `${window.location.origin}${createPageUrl('PaymentSuccess')}?event_id=${createdEventDetails.id}`,
        ErrorRedirectUrl: `${window.location.origin}${createPageUrl('PaymentError')}?event_id=${createdEventDetails.id}`,
        CancelRedirectUrl: `${window.location.origin}${createPageUrl('CreateEvent')}`,
        MaxNumOfPayments: 1,
        CreateToken: false,
        TokenToCharge: "",
        InternalDeal: 0,
        Phone: organizerPhoneNumber,
        Email: currentUser?.email || "",
        CustomerName: currentUser?.full_name || "",
        Comments: `תשלום מקדמה עבור אירוע ${createdEventDetails.name} - ${eventDateFormattedForCardCom}`,
        OrderID: `STRINGS_${createdEventDetails.id}_${Date.now()}`,
        DealType: 1,
        DealIdentity: createdEventDetails.id, // Using event_id as DealIdentity
        CustomerIdentity: currentUser?.email || "", // Using user email as CustomerIdentity
        Theme: "Default"
      };

      // Create form and submit to CardCom
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = CARDCOM_API_URL;
      form.target = '_blank'; // Open in new tab/window

      Object.keys(paymentParams).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = paymentParams[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      safeShowToast("info", "מעבר לתשלום", "נפתח חלון תשלום חדש. השלם את התשלום וחזור לעמוד זה.");
      
    } catch (error) {
      console.error("Error initiating CardCom payment:", error);
      safeShowToast("error", "שגיאה בתשלום", "לא ניתן להתחיל תהליך תשלום. נסה שוב או פנה בטלפון.");
    } finally {
      setPaymentInProgress(false);
    }
  };

  const handleConfirmPaymentTermsAndProceed = async () => {
    if (!agreedToPaymentTerms) {
      safeShowToast("error", "אישור תנאי תשלום", "יש לאשר את תנאי התשלום לפני שתמשיך.");
      return;
    }
    if (!agreedToTermsOfService) {
      safeShowToast("error", "אישור תנאי שימוש", "יש לאשר את תנאי השימוש של STRINGS לפני שתמשיך.");
      return;
    }
    if (!createdEventId) {
      safeShowToast("error", "שגיאה", "מזהה אירוע לא נמצא. אנא חזור לשלב הקודם ונסה שוב.");
      return;
    }

    setIsSubmitting(true);
    try {
        await Event.update(createdEventId, {
            user_agreed_to_payment_terms: true
        });
        const updatedEvent = await Event.get(createdEventId);
        setCreatedEventDetails(updatedEvent);

        safeShowToast("info", "הנחיות התשלום נשמרו", "אנא בצע את תשלום המקדמה ויידע אותנו. לאחר אישור התתשלום על ידינו, קוד הגישה לאלבום יופעל.");
        setCurrentStep(3);
    } catch (error) {
        console.error("Error updating event with payment terms agreement:", error);
        safeShowToast("error", "שגיאה בשמירת אישור התנאים", "נסה שוב.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const finalizeEventCreationAndSendEmail = async () => {
      setIsSubmitting(true);
      try {
        const currentEventState = await Event.get(createdEventId);

        // This part is for the USER email confirmation
        if (currentEventState && currentEventState.advance_payment_status === 'paid') {
          await SendEmail({
            to: currentUser.email,
            from_name: "STRINGS",
            subject: `אישור יצירת אירוע ותשלום מקדמה: ${currentEventState.name}`,
            body: `
              <div dir="rtl" style="font-family: 'Open Sans', Arial, sans-serif; color: #333; text-align: right;">
                <h1 style="color: #5C1A1B; font-family: 'Playfair Display', serif;">האירוע "${currentEventState.name}" נוצר ותשלום המקדמה אושר!</h1>
                <p>שלום ${currentUser.full_name || 'מארגן יקר'},</p>
                <p>תשלום המקדמה בסך ${ADVANCE_PAYMENT_FIXED_AMOUNT} ש"ח עבור האירוע שלך אושר בהצלחה.</p>
                <h2 style="color: #5C1A1B; font-family: 'Playfair Display', serif;">פרטי האירוע:</h2>
                <ul>
                  <li><strong>שם האירוע:</strong> ${currentEventState.name}</li>
                  <li><strong>סוג האירוע:</strong> ${eventTypes.find(et => et.value === currentEventState.event_type)?.label || currentEventState.event_type}</li>
                  <li><strong>תאריך:</strong> ${currentEventState.event_date ? format(parseISO(currentEventState.event_date), "PPP", { locale: he }) : 'לא צוין'}</li>
                  <li><strong>שעה:</strong> ${currentEventState.start_time}</li>
                  <li><strong>מיקום:</strong> ${currentEventState.location_text}</li>
                  <li><strong>קוד גישה לאורחים:</strong> <strong style="font-size: 1.2em; color: #5C1A1B;">${currentEventState.access_code}</strong></li>
                </ul>
                <p>כדי לנהל את האירוע, לערוך פרטים ולהוריד את קוד ה-QR, היכנס לקישור הבא:</p>
                <a href="${window.location.origin}${createPageUrl(`EditEvent?id=${currentEventState.id}`)}" style="display: inline-block; padding: 12px 24px; background-color: #5C1A1B; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  ניהול האירוע שלי
                </a>
                <p><strong>תזכורת:</strong> זהו תשלום מקדמה. את שאר התשלום יש להסדיר ביום האירוע מול נציגי STRINGS.</p>
                <br/><p>בברכה,</p><p>צוות Strings</p>
              </div>
            `
          });
          safeShowToast("success", "אישור תשלום נשלח למייל שלך!", "האירוע שלך פעיל ומוכן לשיתוף.");
        } else if (currentEventState && currentEventState.advance_payment_status === 'pending_payment') {
          safeShowToast("info", "האירוע נוצר וממתין לאישור תשלום המקדמה.", "לאחר אישור התשלום על ידינו, תוכל לשתף את קוד הגישה עם האורחים.");
        } else if (currentEventState && currentEventState.advance_payment_status === 'failed') {
          safeShowToast("error", "בע問題 בתשלום המקדמה.", "סטטוס התשלום עבור אירוע זה הוא 'נכשל'. אנא צור קשר.");
        }
      } catch (error) {
        console.error("Error in finalizeEventCreationAndSendEmail:", error);
        safeShowToast("warn", "שגיאה בתהליך הסיום", "אך האירוע נשמר. אנא צור קשר אם התשלום בוצע.");
      } finally {
          setIsSubmitting(false);
      }
  };

  // Function to create demo event with coupon code
  const createDemoEvent = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    // Demo coupon code
    const demoAccessCode = "DEMO" + Math.floor(Math.random() * 1000);
    
    // Fill all required fields with demo data
    setEventName(`אירוע בדיקה - ${new Date().toLocaleDateString('he-IL')}`);
    setEventType('wedding');
    setEventDate(nextWeek);
    setStartTime('20:00');
    setLocationText('אולם הבדיקות, תל אביב');
    setBraceletsCount('50');
    setGuestCountEstimate('75');
    setOrganizerPhoneNumber(organizerPhoneNumber || '050-1234567');
    setTotalDealAmount('2500');
    setWelcomeMessage('ברוכים הבאים לאירוע הבדיקה שלנו! תהנו ותשתפו תמונות יפות');
    setGuestThankYouMessage('תודה רבה שהשתתפתם באירוע הבדיקה שלנו! מקווים שנהניתם');
    
    // Add demo highlight categories
    const demoHighlights = [
      { id: `temp-${Date.now()}-1`, name: "קבלת פנים", icon_name: "Users" },
      { id: `temp-${Date.now()}-2`, name: "טקס חופה", icon_name: "Heart" },
      { id: `temp-${Date.now()}-3`, name: "ריקודים", icon_name: "Music2" },
      { id: `temp-${Date.now()}-4`, name: "אוכל ושתייה", icon_name: "GlassWater" }
    ];
    setHighlightCategories(demoHighlights);
    
    safeShowToast("success", "נתוני הבדיקה נטענו!", `קוד קופון: ${demoAccessCode} - כל הפרטים מולאו אוטומטית`);
  };

  const handleAddHighlightCategory = (name = newHighlightName, icon = newHighlightIcon) => {
    if (name.trim() === '') {
      safeShowToast("error", "שם קטגוריה ריק", "אנא הזן שם לקטגוריית ההיילייט.");
      return;
    }
    if (highlightCategories.some(cat => cat.name === name.trim())) {
      safeShowToast("warn", "קטגוריה קיימת", `קטגוריה בשם "${name.trim()}" כבר קיימת.`);
      return;
    }
    setHighlightCategories([...highlightCategories, { id: `temp-${Date.now()}`, name: name.trim(), icon_name: icon }]);
    setNewHighlightName('');
    setNewHighlightIcon('');
  };

  const handleAddSuggestedHighlight = (suggestion) => {
    handleAddHighlightCategory(suggestion.name, suggestion.icon_name);
  };

  const handleRemoveHighlightCategory = (categoryIdToRemove) => {
    setHighlightCategories(highlightCategories.filter(category => category.id !== categoryIdToRemove));
  };

  const downloadQrCode = () => {
    if (!finalAccessCode) {
        safeShowToast("error", "קוד גישה עדיין לא נוצר");
        return;
    }
    const qrUrl = getQrCodeUrl(finalAccessCode, "1000x1000", "H");

    window.open(qrUrl, '_blank');

    safeShowToast("info", "קוד ה-QR נפתח לשמירה/הדפסה.", "לחץ קליק ימני ושמור תמונה, או השתמש באפשרויות ההדפסה של הדפדפן.");
  };


  const copyAccessCodeToClipboard = () => {
    if(finalAccessCode){
      navigator.clipboard.writeText(finalAccessCode);
      safeShowToast("success", "קוד הגישה הטקסטואלי הועתק!", "מומלץ להשתמש בעיקר בקוד ה-QR.");
    }
  };

  const copyGuestAccessLinkToClipboard = () => {
    if(finalAccessCode){
        const guestAccessUrl = `${window.location.origin}${createPageUrl(`GuestAccess?code=${finalAccessCode}`)}`;
        navigator.clipboard.writeText(guestAccessUrl);
        safeShowToast("success", "קישור גישה לאורחים הועתק!", "תוכל לשלוח קישור זה לאורחים בנוסף ל-QR.");
    }
  };

  const renderIcon = (iconName) => {
    const IconComponent = highlightIconsList.find(i => i.name === iconName)?.Icon;
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Tag className="w-4 h-4" />;
  };

  const prevStep = () => {
    if (currentStep > 1) {
        if (currentStep === 3 && createdEventId) {
            Event.get(createdEventId).then(eventDetailsFetched => {
                setCreatedEventDetails(eventDetailsFetched);
                if (eventDetailsFetched) {
                    setEventName(eventDetailsFetched.name || '');
                    setEventType(eventDetailsFetched.event_type || '');
                    setEventDate(eventDetailsFetched.event_date ? parseISO(eventDetailsFetched.event_date) : null);
                    setTotalDealAmount(eventDetailsFetched.total_deal_amount ? String(eventDetailsFetched.total_deal_amount) : '');
                    setOrganizerPhoneNumber(eventDetailsFetched.organizer_phone_number || '');
                    setWelcomeMessage(eventDetailsFetched.welcome_message || '');
                    setGuestThankYouMessage(eventDetailsFetched.guest_thank_you_message || '');
                    setAllowVideoUploads(eventDetailsFetched.allow_video_uploads !== undefined ? eventDetailsFetched.allow_video_uploads : true);
                    setBraceletsCount(eventDetailsFetched.bracelets_count ? String(eventDetailsFetched.bracelets_count) : '');
                    setGuestCountEstimate(eventDetailsFetched.guest_count_estimate ? String(eventDetailsFetched.guest_count_estimate) : '');
                    setLocationText(eventDetailsFetched.location_text || '');
                    setStartTime(eventDetailsFetched.start_time || '');
                }
            }).catch(err => console.error("Error fetching event details on prevStep", err));
        }
        setCurrentStep(prev => prev - 1);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today for comparison

  // Terms of Service Modal Component
  const TermsOfServiceModal = () => (
    <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-bordeaux dark:text-[#d4a574] text-center">
            תנאי שימוש - STRINGS
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] overflow-y-auto px-4">
          <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
            
            <section>
              <h3 className="text-lg font-semibold text-bordeaux dark:text-[#d4a574] mb-3">1. כללי</h3>
              <p>
                תנאי שימוש אלה מסדירים את השימוש בשירותי STRINGS ("השירות"), המספקת פתרונות אלבומי אירועים דיגיטליים. 
                השימוש בשירות מהווה הסכמה מלאה לתנאים אלה.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-bordeaux dark:text-[#d4a574] mb-3">2. שינוי פרטי האירוע</h3>
              <p>
                ניתן לשנות את פרטי האירוע עד כחודש מיום האירוע. כל שינוי ייעשה בתיאום מול נציגי STRINGS ויעודכן באפליקציה. 
                שינויים שיבוצעו בתוך חודש מהאירוע יהיו כפופים לאישור ועלולים להיות כרוכים בעלות נוספת.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-bordeaux dark:text-[#d4a574] mb-3">3. תנאי תשלום</h3>
              <div className="space-y-2">
                <p>
                  <strong>מקדמה:</strong> תשלום מקדמה על סך 500 ש"ח נדרש להפעלת השירות ויאושר על ידי נציגי STRINGS.
                </p>
                <p>
                  <strong>יתרת התשלום:</strong> הסכום הנותר, כפי שסוכם מול STRINGS, ישולם במעמד האירוע מול נציגי STRINGS, על פי תנאי התשלום שנקבעו מראש.
                </p>
                <p>
                  <strong>ביטול:</strong> ביטול השירות עד 30 יום לפני האירוע יזכה בהחזר של 50% מהמקדמה. ביטול פחות מ-30 יום לפני האירוע לא יזכה בהחזר.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-bordeaux dark:text-[#d4a574] mb-3">4. אספקת צמידי QR</h3>
              <div className="space-y-4">
                <div>
                    <p>
                    <strong>גוונים וצבעים:</strong> STRINGS מתחייבת לספק לפחות 5 גוונים שונים של צמידי QR בכל הזמנה, בהתאם למלאי הזמין. 
                    אין התחייבות לגוון ספציפי או לכמות גוונים מעבר למינימום שנקבע.
                    </p>
                </div>
                <div>
                    <p>
                    <strong>בקשות מיוחדות:</strong> ניתן להגיש בקשות לגוונים או צבעים ספציפיים. בקשות אלו יהיו נתונות לשיקול דעתה של STRINGS 
                    ויאושרו בהתאם למלאי, זמינות טכנית ועלויות נוספות שעלולות להיגרם.
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-2">
                    <strong>הערה:</strong> מומלץ להעביר בקשות מיוחדות לגבי צבעי צמידים לפחות <strong>חודש</strong> לפני תאריך האירוע. 
                    ככל שהבקשה תוגש מוקדם יותר, כך יגבר הסיכוי שנוכל להיענות לה בחיוב.
                    </p>
                </div>
                <div>
                    <p>
                    <strong>כמות הצמידים:</strong> כמות הצמידים תהיה בהתאם למוסכם בחוזה. במקרה של בקשה לשינוי כמות, 
                    השינוי יעבור אישור של STRINGS ועלול להיות כרוך בתוספת תשלום.
                    </p>
                </div>
                 <div>
                    <p>
                    <strong>מראה וגימור הצמיד:</strong> צמיד ה-QR עשוי חבל דק איכותי בגוונים שונים. יש לקחת בחשבון כי ייתכנו שינויים במראה הסופי ובגימור הצמיד, 
                    וזאת על פי מלאי חומרי הגלם וזמינותם. STRINGS מתחייבת כי המראה והגימור יהיו אחידים בכל הצמידים שיסופקו באותה ההזמנה.
                    </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-bordeaux dark:text-[#d4a574] mb-3">5. זמינות האלבום וההעלאות</h3>
              <div className="space-y-2">
                <p>
                  <strong>זמן העלאה:</strong> יהיה ניתן לשתף ולהעלות מדיה לאלבום במהלך 24 השעות מתאריך האירוע. לאחר מכן, לא יהיה ניתן יותר לצלם או להעלות מדיה חדשה לאלבום.
                </p>
                <p>
                  <strong>מחיקת האלבום:</strong> האירוע והאלבום יימחקו מהמערכת כחודש מיום האירוע. קוד ה-QR לא יהיה תקף, ולא יהיה ניתן יותר לגשת לאלבום, לצפות במדיה, לשתף ולהוריד אותה.
                </p>
                <p className="text-red-600 dark:text-red-400 font-medium">
                  <strong>חשוב:</strong> ניתן לשמור באופן ידני את כל המדיה לפני מחיקתה. לא יהיה ניתן לשחזר מדיה שנמחקה מהמערכת.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-bordeaux dark:text-[#d4a574] mb-3">6. זכויות יוצרים ושימוש במדיה</h3>
              <div className="space-y-2">
                <p>
                  זכויות היוצרים על התמונות והסרטונים שמועלים לאלבום נשארות בבעלות מעלי התכנים (האורחים). 
                  על ידי העלאת תכנים, האורחים מעניקים ל-STRINGS רישיון להציג, לאחסן ולשתף את התכנים במסגרת השירות בלבד.
                </p>
                <p>
                  STRINGS שומרת לעצמה את הזכות להסיר תכנים שאינם מתאימים, פוגעניים או מפרים זכויות צד שלישי.
                </p>
                <p>
                  STRINGS רשאית להשתמש בתמונות מייצגות מהאירועים (ללא זיהוי אישי) לצרכי שיווק ופרסום של השירות.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-bordeaux dark:text-[#d4a574] mb-3">7. פרטיות ואבטחת מידע</h3>
              <div className="space-y-2">
                <p>
                  STRINGS מתחייבת לשמור על פרטיות המידע ולהגן על המדיה שמועלית לאלבומים. הגישה לאלבום מוגבלת רק לבעלי קוד הגישה הייחודי.
                </p>
                <p>
                  המידע האישי שנאסף (שמות, מספרי טלפון, כתובות מייל) ישמש אך ורק לצרכי מתן השירות ולא יועבר לצדדים שלישיים ללא הסכמה מפורשת.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-bordeaux dark:text-[#d4a574] mb-3">8. אחריות ומגבלות</h3>
              <div className="space-y-2">
                <p>
                  STRINGS תעשה כמיטב יכולתה לספק שירות אמין ויציב, אך לא תישא באחריות לנזקים העלולים להיגרם כתוצאה מתקלות טכניות, 
                  אובדן מידע או חוסר זמינות זמנית של השירות.
                </p>
                <p>
                  על הלקוח לגבות את המדיה החשובה לו לפני תאריך המחיקה הקבוע. STRINGS לא תישא באחריות לאובדן מדיה שלא נשמרה על ידי הלקוח.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-bordeaux dark:text-[#d4a574] mb-3">9. שינוי תנאים וסיום השירות</h3>
              <div className="space-y-2">
                <p>
                  STRINGS שומרת לעצמה את הזכות לעדכן ולשנות תנאי שימוש אלה. שינויים יפורסמו באתר ויכנסו לתוקף מיידית.
                </p>
                <p>
                  STRINGS רשאית להפסיק את השירות או לחסום גישה למשתמשים המפרים את תנאי השימוש.
                </p>
                <p>
                  לכל מחלוקת הנוגעת לשירות יחול הדין הישראלי ובתי המשפט בישראל יהיו בעלי סמכות השיפוט הבלעדית.
                </p>
              </div>
            </section>

            <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                תנאים אלה עודכנו לאחרונה ב-{new Date().toLocaleDateString('he-IL')}
              </p>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <DialogClose asChild>
            <Button variant="outline" className="btn-bordeaux">
              סגור
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              {/* Demo Event Button */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center">
                      <Wand2 className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
                      יצירת אירוע בדיקה
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      ימלא אוטומטית את כל הנתונים הנדרשים לבדיקת המערכת
                    </p>
                  </div>
                  <Button 
                    type="button"
                    onClick={createDemoEvent}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                  >
                    <Sparkles className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
                    מלא נתוני בדיקה
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizerPhoneNumber" className="text-base font-semibold text-gray-800 dark:text-gray-200">מספר טלפון (שלך, מארגן האירוע) <span className="text-red-500">*</span></Label>
                <Input id="organizerPhoneNumber" type="tel" value={organizerPhoneNumber} onChange={(e) => setOrganizerPhoneNumber(e.target.value)} placeholder="לדוגמה: 050-1234567" required className="h-14 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] focus:ring-bordeaux/20 dark:focus:ring-[#d4a574]/20 bg-white dark:bg-gray-700"/>
                <p className="text-xs text-gray-500 dark:text-gray-400">מספר זה ישמש ליצירת קשר במידת הצורך ולשליחת עדכונים.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventName" className="text-base font-semibold text-gray-800 dark:text-gray-200">שם האירוע <span className="text-red-500">*</span></Label>
                <Input id="eventName" type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="לדוגמה: החתונה של יוסי ורינה" required className="h-14 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] focus:ring-bordeaux/20 dark:focus:ring-[#d4a574]/20 bg-white dark:bg-gray-700"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventType" className="text-base font-semibold text-gray-800 dark:text-gray-200">סוג האירוע <span className="text-red-500">*</span></Label>
                <Select value={eventType} onValueChange={(value) => {
                    setEventType(value);
                    // Reset highlights when event type changes to offer new suggestions
                    setHighlightCategories([]);
                }} dir="rtl">
                    <SelectTrigger className="h-14 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] focus:ring-bordeaux/20 dark:focus:ring-[#d4a574]/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50">
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
                  <Label htmlFor="eventDate" className="text-base font-semibold text-gray-800 dark:text-gray-200">תאריך האירוע <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full h-14 justify-start text-right rtl:text-left font-normal rounded-xl text-lg border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 ${!eventDate && "text-gray-500 dark:text-gray-400"}`}>
                        <CalendarIcon className="ml-3 h-6 w-6 rtl:mr-3 rtl:ml-0 text-bordeaux dark:text-[#d4a574]" />
                        {eventDate ? format(eventDate, "PPP", { locale: he }) : <span>בחר תאריך</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-gray-200 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-800" align="start">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={setEventDate}
                        initialFocus
                        dir="rtl"
                        locale={he}
                        className="rounded-2xl"
                        disabled={(date) => date < today} // Disable past dates
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-base font-semibold text-gray-800 dark:text-gray-200">שעת התחלה <span className="text-red-500">*</span></Label>
                  <Select value={startTime} onValueChange={setStartTime} dir="rtl">
                    <SelectTrigger className="h-14 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] focus:ring-bordeaux/20 dark:focus:ring-[#d4a574]/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50">
                      <SelectValue placeholder="בחר שעה" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-lg max-h-60 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      {timeOptions.map(time => <SelectItem key={time} value={time} className="text-lg py-3 pr-8 rtl:pl-8 rtl:pr-3 hover:!bg-[#F5F5DC] dark:hover:!bg-gray-700 focus:!bg-[#F5F5DC] dark:focus:!bg-gray-700 text-gray-900 dark:text-gray-50">{time}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationText" className="text-base font-semibold text-gray-800 dark:text-gray-200">מיקום האירוע (תיאור) <span className="text-red-500">*</span></Label>
                <Input id="locationText" type="text" value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="לדוגמה: אולמי פאר, תל אביב" required className="h-14 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] focus:ring-bordeaux/20 dark:focus:ring-[#d4a574]/20 bg-white dark:bg-gray-700"/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="braceletsCount" className="text-base font-semibold text-gray-800 dark:text-gray-200">כמות צמידי QR לאורחים (כפי שסוכם) <span className="text-red-500">*</span></Label>
                <Input id="braceletsCount" type="number" value={braceletsCount} onChange={(e) => setBraceletsCount(e.target.value)} placeholder="לדוגמה: 150" required min="1" className="h-14 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] focus:ring-bordeaux/20 dark:focus:ring-[#d4a574]/20 bg-white dark:bg-gray-700"/>
                <p className="text-xs text-gray-500 dark:text-gray-400">כמות הצמידים עם קוד QR שיודפסו ויחולקו לאורחים.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestCountEstimate" className="text-base font-semibold text-gray-800 dark:text-gray-200">כמות האורחים באירוע (אופציונלי)</Label>
                <Input id="guestCountEstimate" type="number" value={guestCountEstimate} onChange={(e) => setGuestCountEstimate(e.target.value)} placeholder="לדוגמה: 200" min="0" className="h-14 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] focus:ring-bordeaux/20 dark:focus:ring-[#d4a574]/20 bg-white dark:bg-gray-700"/>
                <p className="text-xs text-gray-500 dark:text-gray-400">הערכה כללית למספר האורחים הצפויים באירוע.</p>
              </div>

              {/* --- ADDED DEAL AMOUNT FIELDS --- */}
              <div className="space-y-2">
                <Label htmlFor="totalDealAmount" className="text-base font-semibold text-gray-800 dark:text-gray-200">סכום העסקה הכולל (כפי שסוכם) <span className="text-red-500">*</span></Label>
                <Input id="totalDealAmount" type="number" value={totalDealAmount} onChange={(e) => setTotalDealAmount(e.target.value)} placeholder="לדוגמה: 3500" required min="1" className="h-14 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700"/>
                <p className="text-xs text-gray-500 dark:text-gray-400">הסכום הכולל של העסקה בשקלים חדשים.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advancePaymentFixed" className="text-base font-semibold text-gray-800 dark:text-gray-200">סכום מקדמה (ש"ח)</Label>
                <Input id="advancePaymentFixed" type="number" value={ADVANCE_PAYMENT_FIXED_AMOUNT} readOnly disabled className="h-14 text-lg rounded-xl border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed"/>
                <p className="text-xs text-gray-500 dark:text-gray-400">סכום המקדמה קבוע.</p>
              </div>
              {/* --- END ADDED DEAL AMOUNT FIELDS --- */}

              <div className="space-y-6 p-4 bg-[#5C1A1B]/5 dark:bg-bordeaux/10 rounded-2xl border border-[#5C1A1B]/10 dark:border-bordeaux/20">
                <div>
                    <Label className="text-base font-semibold text-gray-800 dark:text-gray-100">קטגוריות Highlights</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">הוסף קטגוריות כדי לאפשר לאורחים לשייך תמונות לחלקים שונים של האירוע.</p>
                </div>

                {suggestedHighlights.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">הצעות לקטגוריות (לפי סוג האירוע):</Label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedHighlights.map(suggestion => (
                        <Button
                          type="button"
                          key={suggestion.name}
                          variant="outline"
                          onClick={() => handleAddSuggestedHighlight(suggestion)}
                          className="h-10 rounded-lg border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-white dark:border-[#d4a574] dark:text-[#d4a574] dark:hover:bg-[#d4a574] dark:hover:text-gray-900"
                        >
                          {renderIcon(suggestion.icon_name)}
                          <span className="ml-2 rtl:mr-2 rtl:ml-0">{suggestion.name}</span>
                          <Plus className="w-4 h-4 ml-1 rtl:mr-1 rtl:ml-0 opacity-70" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="newHighlightName" className="text-sm font-medium text-gray-700 dark:text-gray-300">שם קטגוריה חדשה</Label>
                    <Input
                      id="newHighlightName"
                      type="text"
                      value={newHighlightName}
                      onChange={(e) => setNewHighlightName(e.target.value)}
                      placeholder="לדוגמה: 'קבלת פנים'"
                      className="h-12 text-base rounded-lg border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newHighlightIcon" className="text-sm font-medium text-gray-700 dark:text-gray-300">בחר אייקון</Label>
                    <Select value={newHighlightIcon} onValueChange={setNewHighlightIcon} dir="rtl">
                      <SelectTrigger id="newHighlightIcon" className="h-12 text-base rounded-lg border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] w-full sm:w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50">
                        <SelectValue placeholder="אייקון" >
                          {newHighlightIcon ? renderIcon(newHighlightIcon) : <Search className="w-4 h-4 opacity-50"/>}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-lg shadow-lg max-h-60 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <SelectItem value={null} className="text-base py-2 pr-8 rtl:pl-8 rtl:pr-3 hover:!bg-[#F5F5DC] dark:hover:!bg-gray-700 text-gray-900 dark:text-gray-50">ללא אייקון</SelectItem>
                        {highlightIconsList.map(({name, Icon}) => (
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
                  <Button type="button" onClick={() => handleAddHighlightCategory()} className="btn-bordeaux h-12 rounded-lg sm:self-end">
                    <Plus className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" /> הוסף
                  </Button>
                </div>

                {highlightCategories.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-[#5C1A1B]/20 dark:border-bordeaux/30">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">קטגוריות שנוספו:</p>
                    <div className="flex flex-wrap gap-3">
                      {highlightCategories.map((category) => (
                        <div key={category.id} className="flex items-center gap-2 bg-white dark:bg-gray-700 pl-2 pr-3 py-2 rounded-lg border border-bordeaux dark:border-[#d4a574] text-bordeaux dark:text-[#d4a574] shadow-sm">
                          {renderIcon(category.icon_name)}
                          <span className="text-sm font-medium">{category.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveHighlightCategory(category.id)}
                            className="h-7 w-7 text-red-500 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage" className="text-base font-semibold text-gray-800 dark:text-gray-200">הודעת פתיחה (אופציונלי)</Label>
                <Textarea id="welcomeMessage" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="שתפו הודעה קצרה שתופיע לאורחים בכניסה לאלבום..." rows={3} className="text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] focus:ring-bordeaux/20 dark:focus:ring-[#d4a574]/20 resize-none bg-white dark:bg-gray-700"/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestThankYouMessage" className="text-base font-semibold text-gray-800 dark:text-gray-200">הודעת תודה לאורחים (למייל הסיכום)</Label>
                <Textarea id="guestThankYouMessage" value={guestThankYouMessage} onChange={(e) => setGuestThankYouMessage(e.target.value)} placeholder="לדוגמה: תודה רבה שבאתם לחגוג איתנו! מקווים שנהניתם..." rows={4} className="text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:border-bordeaux dark:focus:border-[#d4a574] focus:ring-bordeaux/20 dark:focus:ring-[#d4a574]/20 resize-none bg-white dark:bg-gray-700"/>
                <p className="text-xs text-gray-500 dark:text-gray-400">הודעה זו תישלח במייל לכל אורח שהעלה תמונות, יחד עם קישור לאלבום האישי שלו.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-800 dark:text-gray-200">תמונת נושא (אופציונלי)</Label>
                <div className="mt-2 flex items-center justify-center px-6 py-8 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-2xl hover:border-bordeaux dark:hover:border-[#d4a574] transition-colors bg-gray-50/30 dark:bg-gray-700/20">
                  <div className="space-y-4 text-center w-full">
                    {previewCoverImageUrl ? (
                      <div className="relative">
                        <img src={previewCoverImageUrl} alt="תצוגה מקדימה" className="mx-auto h-48 w-full max-w-sm object-cover rounded-xl shadow-lg" />
                        <Button type="button" onClick={() => { setCoverImageFile(null); setPreviewCoverImageUrl('');}} className="absolute top-2 left-2 rtl:right-2 rtl:left-auto h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 p-0 text-white"><XCircle className="w-5 h-5"/></Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#8c2b2d] to-[#5C1A1B] dark:from-[#9a3336] dark:to-[#7a2425] rounded-2xl flex items-center justify-center shadow-lg"><ImageUp className="h-10 w-10 text-white" /></div>
                        <div><p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">העלה תמונת נושא</p><p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG, GIF עד 10MB</p></div>
                      </div>
                    )}
                    <label htmlFor="coverImageFile" className="btn-bordeaux inline-flex items-center px-6 py-3 text-base font-medium rounded-xl cursor-pointer transition-all duration-300 active:scale-95 shadow-lg">
                      <ImageUp className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0" />{previewCoverImageUrl ? 'החלף תמונה' : 'בחר תמונה'}
                    </label>
                    <input id="coverImageFile" name="coverImageFile" type="file" className="hidden" accept="image/*" onChange={handleCoverImageChange} />
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
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                                    ⏰ שים לב: ניתן להעלות תמונות רק 24 שעות מתחילת האירוע
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    🗑️ האירוע ימחק אוטומטית 14 יום לאחר תאריך סיומו
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* autoApproveMedia switch is intentionally removed as per requirements. It defaults to true. */}
                </div>
              </div>
            </form>
        );
      case 2:
        return (
            <div className="space-y-8 text-center">
                <div>
                    <h3 className="text-2xl font-bold text-bordeaux dark:text-[#d4a574] mb-2">שלב 2: תשלום מקדמה</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        האירוע "<strong>{eventName}</strong>" נוצר בהצלחה! <br/>
                        כדי להפעיל אותו ולקבל את קוד הגישה לאורחים, יש לבצע תשלום מקדמה.
                    </p>
                </div>

                <Card className="text-left rtl:text-right bg-[#F5F5DC]/50 dark:bg-gray-700/30 p-6 rounded-2xl shadow-inner border border-gray-200/50 dark:border-gray-600/50">
                    <CardTitle className="text-xl text-bordeaux dark:text-[#d4a574] mb-1">סכום המקדמה לתשלום:</CardTitle>
                    <p className="text-4xl font-bold text-bordeaux dark:text-[#d4a574] my-3">{ADVANCE_PAYMENT_FIXED_AMOUNT} ש"ח</p>

                    <div className="mt-6 space-y-4">
                        <Label className="text-base font-semibold text-gray-800 dark:text-gray-200">בחר אופן תשלום:</Label>
                        
                        {/* CardCom Payment Button */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                                <CreditCard className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
                                תשלום מאובטח באשראי
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                תשלום מאובטח באמצעות CardCom - כל כרטיסי האשראי
                            </p>
                            <Button 
                                onClick={initiateCardComPayment}
                                disabled={paymentInProgress || !agreedToPaymentTerms || !agreedToTermsOfService}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                            >
                                {paymentInProgress ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin ml-2 rtl:mr-2 rtl:ml-0" />
                                        מעבר לתשלום...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
                                        שלם עכשיו ₪{ADVANCE_PAYMENT_FIXED_AMOUNT}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-400/10 dark:bg-yellow-500/10 border border-yellow-400/30 dark:border-yellow-500/30 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
                        <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 mt-0.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            <div>
                                <strong>חשוב:</strong> זהו תשלום מקדמה בלבד. את שאר התתשלום עבור השירות יש להסדיר ביום האירוע ישירות מול נציגי STRINGS.
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mt-6">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse justify-center">
                            <Checkbox id="agreePaymentTerms" checked={agreedToPaymentTerms} onCheckedChange={setAgreedToPaymentTerms} dir="ltr" className="data-[state=checked]:bg-bordeaux data-[state=checked]:border-bordeaux border-gray-400 dark:border-gray-500"/>
                            <Label htmlFor="agreePaymentTerms" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                קראתי ומאשר/ת את תנאי התשלום והמקדמה המפורטים לעיל.
                            </Label>
                        </div>

                        <div className="flex flex-col items-center space-y-2">
                            <Button
                                variant="link"
                                onClick={() => setShowTermsModal(true)}
                                className="text-bordeaux dark:text-[#d4a574] underline hover:no-underline flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                לחץ לקריאת תנאי השימוש של STRINGS
                            </Button>

                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Checkbox id="agreeTermsOfService" checked={agreedToTermsOfService} onCheckedChange={setAgreedToTermsOfService} dir="ltr" className="data-[state=checked]:bg-bordeaux data-[state=checked]:border-bordeaux border-gray-400 dark:border-gray-500"/>
                                <Label htmlFor="agreeTermsOfService" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                    קראתי ומאשר/ת את תנאי השימוש של STRINGS.
                                </Label>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
      case 3:
        const isActuallyPaid = createdEventDetails && createdEventDetails.advance_payment_status === 'paid';
        return (
            <div className="space-y-8 text-center">
              <div>
                <h3 className={`text-2xl font-bold mb-2 ${isActuallyPaid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {isActuallyPaid ? "האירוע שלך פעיל ומוכן לשיתוף!" : "האירוע נוצר וממתין לאישור תשלום"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                    {isActuallyPaid
                        ? `האירוע "<strong>${createdEventDetails.name}</strong>" מוכן. שתף את קוד ה-QR עם האורחים שלך.`
                        : `האירוע "<strong>${createdEventDetails?.name || eventName}</strong>" נוצר. לאחר אישור תשלום המקדמה על ידינו, תוכל לגשת לכאן שוב וקוד הגישה יוצג.`
                    }
                </p>
                 {!isActuallyPaid && createdEventDetails && createdEventDetails.user_agreed_to_payment_terms && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            תודה על אישור התנאים! אנו ממתינים לאישור התשלום מצידך.
                            לאחר שתשלח לנו את אישור התשלום, אנו נעדכן את המערכת וקוד הגישה יופיע כאן.
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            תוכל לרענן דף זה מאוחר יותר או לבדוק את סטטוס האירוע בדף "האירועים שלי".
                        </p>
                        <Button variant="outline" onClick={async () => {
                            if(!createdEventId) return;
                            setIsSubmitting(true);
                            try {
                                const updatedEvent = await Event.get(createdEventId);
                                setCreatedEventDetails(updatedEvent);
                                if (updatedEvent.advance_payment_status === 'paid') {
                                    safeShowToast("success", "סטטוס התשלום עודכן! האירוע פעיל.", "מיד תוכל לראות את קודי הגישה.");
                                    await finalizeEventCreationAndSendEmail();
                                } else {
                                    safeShowToast("info", "סטטוס התשלום עדיין ממתין לאישור מצידנו.", "אנא וודא ששלחת לנו אישור תשלום.");
                                }
                            } catch (err) {
                                safeShowToast("error", "שגיאה בבדיקת סטטוס התשלום.");
                                console.error("Error checking payment status:", err);
                            } finally {
                                setIsSubmitting(false);
                            }
                        }} className="mt-3 btn-outline-bordeaux h-10 text-sm" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : null}
                            בדוק עדכון סטטוס תשלום
                        </Button>
                    </div>
                )}
              </div>

            {isActuallyPaid && finalAccessCode && (
              <>
                <div className="py-6">
                    <h3 className="text-xl font-semibold text-bordeaux dark:text-[#d4a574] mb-1">קוד QR לכניסת אורחים:</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">הדרך המומלצת לשיתוף. האורחים סורקים ונכנסים ישירות.</p>
                    <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-600/50 inline-block">
                        <img
                            src={getQrCodeUrl(finalAccessCode)}
                            alt={`קוד QR עבור ${createdEventDetails?.name || eventName}`}
                            width="280"
                            height="280"
                            className="rounded-lg"
                        />
                    </div>
                    <Button onClick={downloadQrCode} variant="outline" className="btn-outline-bordeaux h-12 rounded-xl text-base active:scale-95">
                        <Download className="ml-2 rtl:mr-2 h-5 w-5" />
                        הורד את קוד ה QR
                    </Button>
                    </div>
                </div>

                <div className="border-t border-gray-300 dark:border-gray-600 pt-6 space-y-3">
                     <h3 className="text-xl font-semibold text-bordeaux dark:text-[#d4a574] mb-1">אפשרויות שיתוף נוספות:</h3>
                    <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
                        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">קוד גישה טקסטואלי:</span>
                        <span className="text-2xl font-mono font-bold text-bordeaux dark:text-[#d4a574] bg-[#5C1A1B]/10 dark:bg-bordeaux/20 px-4 py-2 rounded-xl shadow-sm tracking-wider">
                            {finalAccessCode}
                        </span>
                        <Button variant="ghost" size="icon" onClick={copyAccessCodeToClipboard} className="h-12 w-12 rounded-xl border-gray-300 dark:border-gray-600 hover:bg-[#5C1A1B]/10 dark:hover:bg-bordeaux/20 active:scale-95">
                            <Copy className="w-5 h-5 text-bordeaux dark:text-[#d4a574]" />
                        </Button>
                    </div>
                     <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
                        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">קישור ישיר לאלבום:</span>
                         <Button variant="ghost" size="icon" onClick={copyGuestAccessLinkToClipboard} className="h-12 w-12 rounded-xl border-gray-300 dark:border-gray-600 hover:bg-[#5C1A1B]/10 dark:hover:bg-bordeaux/20 active:scale-95">
                            <LinkIcon className="w-5 h-5 text-bordeaux dark:text-[#d4a574]" />
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">(למקרה חירום או שיתוף ללא QR)</p>
                </div>
              </>
            )}
            </div>
        );
      default:
        return null;
    }
  };

  const getCardTitle = () => {
      switch (currentStep) {
          case 1: return 'יצירת אירוע חדש - שלב 1: פרטי האירוע';
          case 2: return `שלב 2: תשלום מקדמה (${ADVANCE_PAYMENT_FIXED_AMOUNT} ש"ח)`;
          case 3: return 'שלב 3: הפעלת האירוע ושיתוף';
          default: return 'יצירת אירוע חדש';
      }
  };

  const getCardDescription = () => {
    switch (currentStep) {
        case 1: return 'מלא את פרטי האירוע. שדות עם * הם חובה.';
        case 2: return `כדי להפעיל את האירוע ולקבל קוד גישה, יש לבצע תשלום מקדמה של ${ADVANCE_PAYMENT_FIXED_AMOUNT} ש"ח.`;
        case 3: return createdEventDetails && createdEventDetails.advance_payment_status === 'paid'
                      ? 'האירוע שלך פעיל! שתף את קוד ה-QR והגישה עם האורחים.'
                      : 'האירוע נוצר וממתין לאישור תשלום המקדמה. לאחר אישור התשלום על ידינו, קודי הגישה יוצגו כאן.';
        default: return '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto rtl" dir="rtl">

      <Button
        variant="outline"
        onClick={() => currentStep === 1 ? navigate(createPageUrl('MyEvents')) : prevStep()}
        className="mb-6 h-12 px-4 rounded-xl border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all text-gray-700 dark:text-gray-300"
      >
        {currentStep === 1 ? <ArrowRight className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" /> : <ChevronRight className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />}
        <span className="hidden sm:inline">{currentStep === 1 ? 'חזרה לרשימת האירועים' : 'חזור לשלב הקודם'}</span>
        <span className="sm:hidden">{currentStep === 1 ? 'חזרה' : 'קודם'}</span>
      </Button>

      <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#F5F5DC]/50 dark:bg-gray-700/30 border-b border-gray-200/50 dark:border-gray-600/50 p-6 sm:p-8">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-bordeaux dark:text-[#d4a574]">
            {getCardTitle()}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed mt-2">
            {getCardDescription()}
          </CardDescription>
          <Progress value={(currentStep / totalSteps) * 100} className="mt-4 h-2 [&>*]:bg-bordeaux dark:[&>*]:bg-[#d4a574]" />
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {renderStepContent()}
        </CardContent>

        <CardFooter className="p-6 sm:p-8 bg-gray-100/50 dark:bg-gray-800/40 border-t border-gray-200/50 dark:border-gray-700/50">
          {currentStep === 1 && (
            <Button onClick={handleProceedToPaymentInstructions} disabled={isSubmitting} className="btn-bordeaux w-full h-16 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95">
              {isSubmitting ? <Loader2 className="ml-3 h-6 w-6 animate-spin rtl:mr-3 rtl:ml-0" /> : <CreditCard className="mr-3 rtl:ml-3 h-6 w-6" />}
              המשך לשלב תשלום המקדמה
            </Button>
          )}
          {currentStep === 2 && (
            <Button
                onClick={handleConfirmPaymentTermsAndProceed}
                disabled={isSubmitting || !agreedToPaymentTerms || !agreedToTermsOfService}
                className="w-full h-16 text-lg font-semibold rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="ml-3 h-6 w-6 animate-spin rtl:mr-3 rtl:ml-0" /> : <CheckCircle className="ml-3 h-6 w-6 rtl:mr-3 rtl:ml-0" />}
              אישרתי את התנאים, המשך לשלב הסופי
            </Button>
          )}
           {currentStep === 3 && (
            <Button
                onClick={async () => {
                    if (!isSubmitting) {
                         if (createdEventId) {
                            try {
                                const currentEventState = await Event.get(createdEventId);
                                if (currentEventState && currentEventState.advance_payment_status === 'paid') {
                                    await finalizeEventCreationAndSendEmail();
                                }
                            } catch (err) {
                                console.error("Error fetching event state before navigating:", err);
                            }
                         }
                    }
                    navigate(createPageUrl('MyEvents'));
                }}
                disabled={isSubmitting}
                className="btn-bordeaux w-full h-16 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
            >
              {isSubmitting ? <Loader2 className="ml-3 h-6 w-6 animate-spin rtl:mr-3 rtl:ml-0" /> : <Wand2 className="ml-3 h-6 w-6 rtl:mr-3 rtl:ml-0" />}
              סיום והצג את רשימת האירועים שלי
            </Button>
          )}
        </CardFooter>
      </Card>
      {/* Conditionally render TermsOfServiceModal at the top level, visibility controlled by showTermsModal state */}
      <TermsOfServiceModal />
    </div>
  );
}
