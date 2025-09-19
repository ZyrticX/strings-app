
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Event } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle, Edit3, ExternalLink, ArrowLeft, Info, Loader2, CreditCard, AlertCircle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from '@/components/ui/sonner';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns'; // Added this import for the 'format' function

const ADVANCE_PAYMENT_AMOUNT = 500;

// CardCom Integration
const CARDCOM_TERMINAL_NUMBER = "1000";
const CARDCOM_USERNAME = "barak9611";
const CARDCOM_API_URL = "https://secure.cardcom.solutions/Interface/LowProfile.aspx";

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [eventId, setEventId] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
    const params = new URLSearchParams(location.search);
    const id = params.get('eventId');
    if (id) {
      setEventId(id);
      fetchEventDetails(id);
    } else {
      safeShowToast("error", "מזהה אירוע חסר", "לא ניתן להציג הוראות תשלום ללא מזהה אירוע.");
      navigate(createPageUrl('MyEvents'));
    }
  }, [location.search, navigate]);

  const fetchEventDetails = async (id) => {
    setIsLoading(true);
    try {
      const event = await Event.get(id);
      setEventDetails(event);
    } catch (error) {
      console.error("Error fetching event details for payment:", error);
      safeShowToast('error', 'שגיאה בטעינת פרטי אירוע', "אנא נסה שוב מאוחר יותר.");
      navigate(createPageUrl('MyEvents'));
    } finally {
      setIsLoading(false);
    }
  };

  const initiateCardComPayment = async () => {
    if (!eventDetails) {
      safeShowToast("error", "שגיאה", "פרטי האירוע לא נמצאו.");
      return;
    }

    setPaymentInProgress(true);
    
    try {
      const eventDateFormattedForCardCom = eventDetails.event_date ? format(new Date(eventDetails.event_date), "yyyy-MM-dd") : 'לא צוין';

      // Prepare CardCom payment parameters
      const paymentParams = {
        TerminalNumber: CARDCOM_TERMINAL_NUMBER,
        UserName: CARDCOM_USERNAME,
        Sum: ADVANCE_PAYMENT_AMOUNT,
        Coin: 1, // ILS
        Language: "he",
        Operation: 1, // Charge
        ProductName: `מקדמה עבור אירוע: ${eventDetails.name}`,
        UserId: eventDetails.id,
        APILevel: 10,
        ReturnValue: `event_id=${encodeURIComponent(eventDetails.id)}&access_code=${encodeURIComponent(eventDetails.access_code)}`,
        SuccessRedirectUrl: `${window.location.origin}${createPageUrl('PaymentSuccess')}?event_id=${eventDetails.id}`,
        ErrorRedirectUrl: `${window.location.origin}${createPageUrl('PaymentError')}?event_id=${eventDetails.id}`,
        CancelRedirectUrl: `${window.location.origin}${createPageUrl('MyEvents')}`,
        MaxNumOfPayments: 1,
        CreateToken: false,
        TokenToCharge: "",
        InternalDeal: 0,
        Phone: eventDetails.organizer_phone_number || "",
        Email: eventDetails.created_by || "",
        CustomerName: eventDetails.created_by || "",
        Comments: `תשלום מקדמה עבור אירוע ${eventDetails.name} - ${eventDateFormattedForCardCom}`,
        OrderID: `STRINGS_${eventDetails.id}_${Date.now()}`,
        DealType: 1,
        DealIdentity: eventDetails.id,
        CustomerIdentity: eventDetails.created_by || "",
        Theme: "Default"
      };

      // Create form and submit to CardCom
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = CARDCOM_API_URL;
      form.target = '_blank';

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] dark:from-gray-900 dark:to-gray-800 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-bordeaux" />
      </div>
    );
  }

  if (!eventDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-lg text-center p-8">
            <Info className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle className="text-xl text-red-600">שגיאה</CardTitle>
            <CardDescription className="mt-2">לא נמצאו פרטי אירוע. נסה לחזור לדף הקודם.</CardDescription>
            <Button onClick={() => navigate(createPageUrl('MyEvents'))} className="mt-6 btn-outline-bordeaux">
                חזור לאירועים שלי
            </Button>
        </Card>
      </div>
    );
  }
  
  // If payment already made, show different message or redirect
  if (eventDetails.advance_payment_status === 'paid') {
    return (
         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-lg text-center p-8 shadow-xl rounded-2xl">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-6" />
                <CardTitle className="text-2xl font-semibold text-green-600 mb-3">תשלום המקדמה התקבל!</CardTitle>
                <CardDescription className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                    אלבום האירוע <span className="font-bold text-bordeaux dark:text-[#d4a574]">"{eventDetails.name}"</span> פעיל ומוכן.
                    תוכל למצוא את קוד ה-QR וקוד הגישה לאורחים בדף עריכת האירוע.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => navigate(createPageUrl(`EditEvent?id=${eventId}`))} className="btn-bordeaux h-12 text-base">
                        <Edit3 className="ml-2 h-5 w-5" />
                        עבור לדף עריכת האירוע
                    </Button>
                    <Button onClick={() => navigate(createPageUrl('MyEvents'))} variant="outline" className="btn-outline-bordeaux h-12 text-base">
                        חזור לרשימת האירועים
                    </Button>
                </div>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6] py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60">
          <CardHeader className="bg-gradient-to-br from-[#8c2b2d] to-[#5C1A1B] dark:from-[#9a3336] dark:to-[#7a2425] p-8 text-center">
            <CardTitle className="text-3xl font-bold text-white font-serif-display">הוראות לתשלום מקדמה</CardTitle>
            <CardDescription className="text-[#FFF8E7]/80 dark:text-gray-300/80 text-lg mt-2">
              עבור אירוע: <span className="font-semibold">{eventDetails.name}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-10 space-y-8">
              <div className="p-4 bg-bordeaux/5 dark:bg-bordeaux/10 rounded-lg border border-bordeaux/20 dark:border-bordeaux/30 text-center">
                  <p className="text-xl font-semibold text-bordeaux dark:text-[#d4a574]">
                      סכום לתשלום: {ADVANCE_PAYMENT_AMOUNT} ש"ח
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      (מקדמה להפעלת אלבום האירוע)
                  </p>
              </div>
            
              <p className="text-gray-700 dark:text-gray-200 text-base leading-relaxed text-center">
                אנא בצע את תשלום המקדמה באמצעות כרטיס האשראי.
                לאחר התשלום המוצלח, האלבום יופעל אוטומטית.
              </p>

              {/* CardCom Payment Button */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
                  תשלום מאובטח באשראי
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4 text-center">
                  תשלום מאובטח באמצעות CardCom - כל כרטיסי האשראי
                </p>
                <Button 
                  onClick={initiateCardComPayment}
                  disabled={paymentInProgress}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all"
                >
                  {paymentInProgress ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2 rtl:mr-2 rtl:ml-0" />
                      מעבר לתשלום...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
                      שלם עכשיו ₪{ADVANCE_PAYMENT_AMOUNT}
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 p-4 bg-yellow-400/10 dark:bg-yellow-500/10 border border-yellow-400/30 dark:border-yellow-500/30 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 mt-0.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <div>
                    <strong>חשוב:</strong> זהו תשלום מקדמה בלבד. את שאר התשלום עבור השירות יש להסדיר ביום האירוע ישירות מול נציגי STRINGS.
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-4 pt-8 border-t border-gray-200/70 dark:border-gray-700/70">
                {/* Terms of Service Link */}
                <div className="mb-4">
                  <Button
                    variant="link"
                    onClick={() => setShowTermsModal(true)}
                    className="text-bordeaux dark:text-[#d4a574] underline hover:no-underline flex items-center gap-2 mx-auto"
                  >
                    <FileText className="w-4 h-4" />
                    קרא את תנאי השימוש של STRINGS
                  </Button>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">יצירת קשר</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed max-w-xl mx-auto">
                  במידה ויש שאלות או בעיות בתשלום, אנא פנו אלינו בוואטסאפ למספר <a href="https://wa.me/972542565889" target="_blank" rel="noopener noreferrer" className="text-bordeaux dark:text-[#d4a574] font-semibold hover:underline">054-2565889</a> או למייל <a href="mailto:stringsalbumapp@gmail.com" className="text-bordeaux dark:text-[#d4a574] font-semibold hover:underline">stringsalbumapp@gmail.com</a>.
                </p>
              </div>
          </CardContent>
          
          <CardFooter className="p-6 bg-gray-50 dark:bg-gray-800/30 border-t dark:border-gray-700">
              <Button 
                  variant="ghost" 
                  onClick={() => navigate(createPageUrl('MyEvents'))}
                  className="w-full text-gray-600 dark:text-gray-300 hover:text-bordeaux dark:hover:text-[#d4a574] h-12 rounded-lg"
              >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  חזור לאירועים שלי
              </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Terms of Service Modal */}
      <TermsOfServiceModal />
    </div>
  );
}
