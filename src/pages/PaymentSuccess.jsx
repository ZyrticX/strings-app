import React, { useEffect, useState } from 'react';
import { Event } from '@/api/entities';
import { User } from '@/api/entities';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Copy, ExternalLink } from 'lucide-react';
import { SendEmail } from '@/api/integrations';
import { notifyPaymentCompleted } from '@/utils/notificationManager';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const eventId = searchParams.get('event_id');

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        if (eventId) {
          // Update event payment status
          await Event.update(eventId, {
            advance_payment_status: 'paid',
            advance_payment_date: new Date().toISOString()
          });

          const updatedEvent = await Event.get(eventId);
          setEvent(updatedEvent);

          // Send payment completion notification to admin
          try {
            await notifyPaymentCompleted(updatedEvent, currentUser);
            console.log('✅ Payment completion notification sent to admin');
          } catch (notificationError) {
            console.warn('⚠️ Failed to send payment completion notification:', notificationError);
          }

          // Send confirmation email
          await SendEmail({
            to: currentUser.email,
            subject: `אישור תשלום מקדמה - ${updatedEvent.name}`,
            body: `
              <div dir="rtl" style="font-family: Arial, sans-serif;">
                <h1>תשלום המקדמה אושר בהצלחה!</h1>
                <p>שלום ${currentUser.full_name},</p>
                <p>תשלום המקדמה בסך 500 ש"ח עבור האירוע "${updatedEvent.name}" אושר בהצלחה.</p>
                <p><strong>קוד גישה לאורחים:</strong> ${updatedEvent.access_code}</p>
                <p>האירוע שלך כעת פעיל ומוכן לשיתוף עם האורחים.</p>
                <br/>
                <p>בברכה,<br/>צוות STRINGS</p>
              </div>
            `
          });
        }
      } catch (error) {
        console.error('Error processing payment success:', error);
      } finally {
        setIsLoading(false);
      }
    };

    processPaymentSuccess();
  }, [eventId]);

  const copyAccessCode = () => {
    if (event?.access_code) {
      navigator.clipboard.writeText(event.access_code);
      alert('קוד הגישה הועתק!');
    }
  };

  const downloadQR = () => {
    if (event?.access_code) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`${window.location.origin}${createPageUrl(`GuestAccess?code=${event.access_code}`)}`)}}&size=400x400&ecc=H&margin=10&color=5C1A1B&bgcolor=FFF8E7`;
      window.open(qrUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p>מעבד את התשלום...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6" dir="rtl">
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">תשלום בוצע בהצלחה!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {event && (
            <>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                <p className="text-gray-600">האירוע שלך כעת פעיל ומוכן לשיתוף!</p>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">קוד גישה לאורחים:</h4>
                <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
                  <span className="font-mono text-lg font-bold">{event.access_code}</span>
                  <Button onClick={copyAccessCode} variant="outline" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={downloadQR} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 ml-2" />
                  הורד QR
                </Button>
                <Button onClick={() => navigate(createPageUrl(`EditEvent?id=${event.id}`))} className="flex-1">
                  <ExternalLink className="w-4 h-4 ml-2" />
                  נהל אירוע
                </Button>
              </div>
            </>
          )}

          <Button 
            onClick={() => navigate(createPageUrl('MyEvents'))} 
            variant="outline" 
            className="w-full"
          >
            חזור לרשימת האירועים
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}