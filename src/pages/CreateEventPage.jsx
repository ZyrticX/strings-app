
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event } from '@/api/entities';
import { HighlightCategory } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
    Calendar as CalendarIcon, Users, ImageUp, Loader2, CheckCircle, Info, ExternalLink, 
    MessageSquare, Edit3, ArrowRight, QrCode, Copy, Download as DownloadIcon, Link as LinkIcon, 
    ShieldCheck, PartyPopper, ShoppingCart, ArrowLeft, Phone, FileText, Banknote, 
    CreditCard, Smartphone, XCircle, GlassWater, Camera, Heart, Gift, Mic2, Presentation, Coffee, Smile, ThumbsUp, MapPin, Sun, Moon, Sparkles as SparklesIcon, Megaphone, Palette, ShoppingBag, Briefcase, GraduationCap, Plane, Ship, CarIcon, Bike, TreeDeciduous, Flower2, Award, Trophy, Film, Clapperboard, Ticket, Baby, Dog, Cat, ScrollText, Disc3, Plus, ChevronLeft, Tag
} from 'lucide-react';
import { format, parseISO, isValid, addDays } from "date-fns";
import { he } from 'date-fns/locale';
import { toast } from '@/components/ui/sonner';
import { createPageUrl } from '@/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@/api/entities';
import { Textarea } from '@/components/ui/textarea';
import { UploadFile } from '@/api/integrations';
import { Switch } from '@/components/ui/switch';

const eventTypes = [
  { value: "wedding", label: "חתונה" },
  { value: "corporate", label: "ערב חברה" },
  { value: "birthday", label: "יום הולדת" },
  { value: "bar_mitzvah", label: "בר מצווה" },
  { value: "bat_mitzvah", label: "בת מצווה" },
  { value: "party", label: "מסיבה" },
  { value: "other", label: "אחר" },
];

const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hours = String(Math.floor(i / 2)).padStart(2, '0');
    const minutes = String((i % 2) * 30).padStart(2, '0');
    return `${hours}:${minutes}`;
});

const ADVANCE_PAYMENT_AMOUNT = 500;

const generateAccessCode = () => {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; 

  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [locationText, setLocationText] = useState('');
  const [braceletsCount, setBraceletsCount] = useState('');
  const [guestCountEstimate, setGuestCountEstimate] = useState('');
  const [organizerPhoneNumber, setOrganizerPhoneNumber] = useState('');

  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [previewCoverImageUrl, setPreviewCoverImageUrl] = useState('');
  const [allowVideoUploads, setAllowVideoUploads] = useState(true);

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
    let isValid = true;
    const showError = (title, description) => {
        safeShowToast("error", title, description);
        isValid = false;
    };

    if (!eventName || !eventType || !eventDate || !startTime || !locationText || !braceletsCount || !organizerPhoneNumber) {
      showError("שדות חובה חסרים", "אנא מלא את כל השדות המסומנים בכוכבית (*), כולל שם, סוג, תאריך, שעה, מיקום, כמות צמידים ומספר טלפון.");
    }
    if (isNaN(parseInt(braceletsCount)) || parseInt(braceletsCount) <= 0) {
      showError("כמות צמידים לא תקינה", "כמות הצמידים חייבת להיות מספר חיובי.");
    }
    if (guestCountEstimate && (isNaN(parseInt(guestCountEstimate)) || parseInt(guestCountEstimate) < 0)) {
      showError("כמות אורחים לא תקינה", "כמות האורחים חייבת להיות מספר חיובי (או להישאר ריקה).");
    }
    if (!/^\d{9,10}$/.test(organizerPhoneNumber.replace(/-/g, ''))) {
        showError("מספר טלפון לא תקין", "אנא הזן מספר טלפון ישראלי תקין (9-10 ספרות).");
    }
    return isValid;
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
      
      const eventData = {
        name: eventName,
        event_type: eventType,
        event_date: format(eventDate, "yyyy-MM-dd"),
        start_time: startTime,
        location_text: locationText,
        bracelets_count: parseInt(braceletsCount),
        guest_count_estimate: guestCountEstimate ? parseInt(guestCountEstimate) : null,
        organizer_phone_number: organizerPhoneNumber,
        access_code: generateAccessCode(),
        welcome_message: welcomeMessage,
        cover_image_url: uploadedCoverImageUrl,
        allow_video_uploads: allowVideoUploads,
        auto_approve_media: true,
        advance_payment_status: 'pending_payment',
        advance_payment_amount: ADVANCE_PAYMENT_AMOUNT,
        user_agreed_to_payment_terms: false,
      };

      const newEvent = await Event.create(eventData);
      setCreatedEventId(newEvent.id);
      setCreatedEventDetails(newEvent);
      setFinalAccessCode(newEvent.access_code);
      
      await Promise.all(
        highlightCategories.map(async (highlight) => {
          await HighlightCategory.create({
            event_id: newEvent.id,
            name: highlight.name,
            icon_name: highlight.icon_name,
          });
        })
      );

      safeShowToast("success", "האירוע נוצר בהצלחה!", "עבור לעמוד ההוראות תשלום.");
      navigate(createPageUrl(`PaymentPage?eventId=${newEvent.id}`));

    } catch (error) {
      console.error("Error creating event:", error);
      safeShowToast("error", "שגיאה ביצירת האירוע", error?.message || "נסה שוב מאוחר יותר.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPaymentTermsAndProceed = async () => {
    if (!agreedToPaymentTerms) {
        if (toast && typeof toast.error === 'function') {
            toast.error("אישור תנאים", { description: "יש לאשר את התנאים וההערה לגבי התשלום לפני שתמשיך."});
        } else {
            alert("יש לאשר את התנאים וההערה לגבי התשלום לפני שתמשיך.");
        }
        return;
    }
    if (!createdEventId) {
        if (toast && typeof toast.error === 'function') {
            toast.error("שגיאה", { description: "מזהה אירוע לא נמצא. אנא חזור לשלב הקודם ונסה שוב." });
        } else {
             alert("מזהה אירוע לא נמצא. אנא חזור לשלב הקודם ונסה שוב.");
        }
        return;
    }
    
    setIsSubmitting(true);
    try {
        await Event.update(createdEventId, { user_agreed_to_payment_terms: true });
        const updatedEvent = await Event.get(createdEventId);
        setCreatedEventDetails(updatedEvent);

        if (toast && typeof toast.info === 'function') {
            toast.info("הנחיות התשלום נשמרו", { description: "אנא בצע את תשלום המקדמה ויידע אותנו. לאחר אישור התשלום על ידינו, קוד הגישה לאלבום יופעל."});
        }
        setCurrentStep(3); 
    } catch (error) {
        console.error("Error updating event with payment terms agreement:", error);
        if (toast && typeof toast.error === 'function') {
            toast.error("שגיאה בשמירת אישור התנאים", { description: error?.message || "נסה שוב." });
        } else {
            alert("שגיאה בשמירת אישור התנאים. נסה שוב.");
        }
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const finalizeEventCreationAndSendEmail = async () => {
      if (toast && typeof toast.success === 'function') {
          toast.success("אישור תשלום נשלח למייל שלך!", { description: "האירוע שלך פעיל ומוכן לשיתוף."});
      }
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

  const copyToClipboard = (text, successMessage) => {
    navigator.clipboard.writeText(text).then(() => {
      if (toast && typeof toast.success === 'function') {
        toast.success(successMessage);
      }
    }).catch(err => {
      if (toast && typeof toast.error === 'function') {
        toast.error("שגיאה בהעתקה", { description: "לא ניתן היה להעתיק ללוח."});
      }
      console.error('Failed to copy: ', err);
    });
  };

  const downloadQRCode = () => {
    const qrCodeURL = document.getElementById('qrCode')?.querySelector('img')?.src;
    if (qrCodeURL) {
      const link = document.createElement('a');
      link.href = qrCodeURL;
      link.download = `strings_events_qr_code_${eventName.replace(/\s+/g, '_') || 'event'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (toast && typeof toast.error === 'function') {
        toast.error("שגיאה בהורדה", { description: "לא ניתן היה ליצור קוד QR." });
      }
    }
  };

  const renderIcon = (iconName) => {
    const IconComponent = highlightIconsList.find(i => i.name === iconName)?.Icon;
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Tag className="w-4 h-4" />;
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="organizerPhoneNumber" className="text-base font-semibold text-gray-800 dark:text-gray-200">מספר טלפון (שלך, מארגן האירוע) <span className="text-red-500">*</span></Label>
                <Input id="organizerPhoneNumber" type="tel" value={organizerPhoneNumber} onChange={(e) => setOrganizerPhoneNumber(e.target.value)} placeholder="לדוגמה: 050-1234567" required className="h-14 text-lg rounded-xl"/>
                <p className="text-xs text-gray-500 dark:text-gray-400">מספר זה ישמש ליצירת קשר במידת הצורך ולשליחת עדכונים.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventName" className="text-base font-semibold text-gray-800 dark:text-gray-200">שם האירוע <span className="text-red-500">*</span></Label>
                <Input id="eventName" type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="לדוגמה: החתונה של יוסי ורינה" required className="h-14 text-lg rounded-xl"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventType" className="text-base font-semibold text-gray-800 dark:text-gray-200">סוג האירוע <span className="text-red-500">*</span></Label>
                <Select value={eventType} onValueChange={setEventType} dir="rtl">
                    <SelectTrigger className="h-14 text-lg rounded-xl"><SelectValue placeholder="בחר סוג אירוע" /></SelectTrigger>
                    <SelectContent>{eventTypes.map(type => (<SelectItem key={type.value} value={type.value} className="text-lg">{type.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="eventDate" className="text-base font-semibold text-gray-800 dark:text-gray-200">תאריך האירוע <span className="text-red-500">*</span></Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className={`w-full h-14 justify-start text-right rtl:text-left font-normal text-lg ${!eventDate && "text-gray-500 dark:text-gray-400"}`}><CalendarIcon className="ml-3 h-6 w-6 rtl:mr-3 rtl:ml-0 text-bordeaux dark:text-[#d4a574]" />{eventDate ? format(eventDate, "PPP", { locale: he }) : <span>בחר תאריך</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus dir="rtl" locale={he} disabled={(date) => date < addDays(new Date(), -1)} /></PopoverContent> 
                    </Popover>
                </div>
                <div className="space-y-2"><Label htmlFor="startTime" className="text-base font-semibold text-gray-800 dark:text-gray-200">שעת התחלה <span className="text-red-500">*</span></Label><Select value={startTime} onValueChange={setStartTime} dir="rtl"><SelectTrigger className="h-14 text-lg rounded-xl"><SelectValue placeholder="בחר שעה" /></SelectTrigger><SelectContent>{timeOptions.map(time => <SelectItem key={time} value={time} className="text-lg">{time}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label htmlFor="locationText" className="text-base font-semibold text-gray-800 dark:text-gray-200">מיקום האירוע (תיאור) <span className="text-red-500">*</span></Label><Input id="locationText" type="text" value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="לדוגמה: אולמי פאר, תל אביב" required className="h-14 text-lg rounded-xl"/></div>
              
              <div className="space-y-2">
                <Label htmlFor="braceletsCount" className="text-base font-semibold text-gray-800 dark:text-gray-200">כמות צמידי QR לאורחים (כפי שסוכם) <span className="text-red-500">*</span></Label>
                <Input id="braceletsCount" type="number" value={braceletsCount} onChange={(e) => setBraceletsCount(e.target.value)} placeholder="לדוגמה: 100" required min="1" className="h-14 text-lg rounded-xl"/>
                <p className="text-xs text-gray-500 dark:text-gray-400">זהו מספר הצמידים עם קוד QR שיודפסו ויחולקו לאורחים.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestCountEstimate" className="text-base font-semibold text-gray-800 dark:text-gray-200">כמות אורחים באירוע (אופציונלי)</Label>
                <Input id="guestCountEstimate" type="number" value={guestCountEstimate} onChange={(e) => setGuestCountEstimate(e.target.value)} placeholder="לדוגמה: 150" min="0" className="h-14 text-lg rounded-xl"/>
                <p className="text-xs text-gray-500 dark:text-gray-400">הערכה כללית למספר האורחים הצפויים באירוע.</p>
              </div>
              
              <div className="space-y-6 p-4 bg-[#5C1A1B]/5 dark:bg-bordeaux/10 rounded-2xl border border-[#5C1A1B]/10 dark:border-bordeaux/20">
                
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage" className="text-base font-semibold text-gray-800 dark:text-gray-200">הודעת פתיחה (אופציונלי)</Label>
                <Textarea id="welcomeMessage" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="שתפו הודעה קצרה שתופיע לאורחים..." rows={3} className="text-lg rounded-xl"/>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-800 dark:text-gray-200">תמונת נושא (אופציונלי)</Label>
              </div>
              <div className="space-y-4 pt-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">הגדרות נוספות</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#5C1A1B]/5 dark:bg-bordeaux/10 rounded-2xl border border-[#5C1A1B]/10 dark:border-bordeaux/20">
                        <Label htmlFor="allowVideoUploads" className="flex flex-col space-y-1 flex-1">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">אפשר העלאת סרטונים</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">האם לאפשר לאורחים להעלות גם קבצי וידאו</span>
                        </Label>
                        <Switch id="allowVideoUploads" checked={allowVideoUploads} onCheckedChange={setAllowVideoUploads} dir="ltr" className="data-[state=checked]:bg-bordeaux dark:data-[state=checked]:bg-[#d4a574]"/>
                    </div>
                </div>
              </div>
            </form>
        );
      case 2:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="h-24 w-24 mx-auto text-green-500" />
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">כמעט סיימנו!</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              האירוע שלך כמעט מוכן. כדי להשלים את התהליך, עליך לסרוק את קוד ה-QR או לשתף את הקישור עם האורחים שלך.
            </p>

            <div className="space-y-4">
              <Card className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">קוד גישה</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">שתף את הקוד עם האורחים שלך</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-bordeaux dark:text-[#d4a574]">{finalAccessCode}</span>
                  <Button onClick={copyToClipboard} className="btn-bordeaux rounded-xl">
                    <Copy className="mr-2 rtl:ml-2 rtl:mr-0 h-5 w-5" />
                    העתק
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">קוד QR</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">סרוק את הקוד עם הטלפון שלך</CardDescription>
                </CardHeader>
                <CardContent>
                  <div id="qrCode" className="flex justify-center">
                    {finalAccessCode && (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${window.location.origin}/join/${finalAccessCode}`}
                        alt="QR Code"
                        className="rounded-xl"
                      />
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={downloadQRCode} className="btn-bordeaux rounded-xl w-full">
                    <DownloadIcon className="mr-2 rtl:ml-2 rtl:mr-0 h-5 w-5" />
                    הורד קוד QR
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              יש לך שאלות? <a href="https://strings.co.il/contact" target="_blank" rel="noopener noreferrer" className="text-bordeaux dark:text-[#d4a574] hover:underline">צור קשר</a>
            </p>
          </div>
        );
      case 3:
        return (
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-3">
              <ShoppingCart className="h-16 w-16 mx-auto text-bordeaux dark:text-[#d4a574]" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">צעד אחרון: תשלום מקדמה והפעלת האירוע</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                ליצירת האירוע והפעלת כל התכונות, נדרש תשלום מקדמה סמלי ומאובטח בסך {ADVANCE_PAYMENT_AMOUNT} ש"ח.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                המקדמה מאפשרת לנו לכסות עלויות תשתית ראשוניות ולהבטיח את מקומך.
              </p>
            </div>

            <Card className="bg-yellow-50/70 dark:bg-yellow-700/20 border-yellow-400 dark:border-yellow-600 border-l-4 p-4 rounded-lg shadow">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                </div>
                <div className="ml-3 rtl:mr-3 rtl:ml-0">
                  <h3 className="text-base font-semibold text-yellow-800 dark:text-yellow-200">לתשומת לבך:</h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <p>לאחר לחיצה על "המשך לתשלום", האירוע שלך יווצר במערכת עם סטטוס "ממתין לתשלום".</p>
                    <p>תועבר לדף עם הוראות תשלום. לאחר ביצוע התשלום וקבלת אישור מצידנו, האירוע שלך יופעל במלואו ותקבל גישה לקוד ה-QR ושאר הכלים.</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="items-top flex space-x-2 rtl:space-x-reverse pt-4">
              <Checkbox id="termsPayment" checked={agreedToPaymentTerms} onCheckedChange={setAgreedToPaymentTerms} className="w-5 h-5 mt-1 border-gray-400 data-[state=checked]:bg-bordeaux data-[state=checked]:border-bordeaux dark:data-[state=checked]:bg-[#d4a574] dark:data-[state=checked]:border-[#d4a574]" />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="termsPayment"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                >
                  קראתי ואני מאשר/ת את <Button variant="link" className="p-0 h-auto text-sm text-bordeaux dark:text-[#d4a574]" onClick={() => { if (toast && typeof toast.info === 'function') toast.info("תנאי השירות יוצגו כאן"); }}>תנאי התשלום והשירות</Button> של Strings Events.
                </label>
              </div>
            </div>
          </CardContent>
        );
      default:
        return null;
    }
  };

  const getCardTitle = () => {
    switch (currentStep) {
      case 1:
        return "הגדרת פרטי האירוע";
      case 2:
        return "שיתוף קוד גישה לאירוע";
      case 3:
        return "תשלום מקדמה והפעלת האירוע";
      default:
        return "יצירת אירוע חדש";
    }
  };

  const getCardDescription = () => {
    switch (currentStep) {
      case 1:
        return "אנא מלא את הפרטים הבאים כדי שנוכל להתחיל.";
      case 2:
        return "כדי להפעיל את האירוע, שתף את קוד הגישה עם האורחים שלך.";
      case 3:
        return "יש לבצע תשלום מקדמה כדי שהאירוע יהיה פעיל.";
      default:
        return "אנא מלא את הפרטים הבאים כדי שנוכל להתחיל.";
    }
  };

  return (
    <div className="max-w-2xl mx-auto rtl" dir="rtl">
      <Button 
        variant="outline" 
        onClick={() => currentStep === 1 ? navigate(createPageUrl('MyEvents')) : prevStep()} 
        className="mb-6 h-12 px-4 rounded-xl"
      >
        {currentStep === 1 ? <ArrowRight className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" /> : <ChevronLeft className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />}
      </Button>

      <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#F5F5DC]/50 dark:bg-gray-700/30 p-6 sm:p-8">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-bordeaux dark:text-[#d4a574] font-serif-display">
            {getCardTitle()}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8">
          {renderStepContent()}
        </CardContent>
        
      </Card>
    </div>
  );
}

const defaultHighlightSuggestions = { };
const highlightIconsList = [ ];
