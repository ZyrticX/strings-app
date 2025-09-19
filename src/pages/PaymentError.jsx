import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, MessageSquare } from 'lucide-react';

export default function PaymentErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('event_id');

  return (
    <div className="max-w-2xl mx-auto p-6" dir="rtl">
      <Card className="bg-red-50 border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-800">בעיה בתשלום</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-600">
            התשלום לא הושלם בהצלחה. ייתכן שהתשלום בוטל או שהייתה בעיה טכנית.
          </p>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate(createPageUrl('CreateEvent'))} 
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              נסה שוב
            </Button>
            
            <Button 
              onClick={() => window.open('https://wa.me/972542565889?text=היי, הייתה בעיה בתשלום המקדמה', '_blank')} 
              variant="outline" 
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 ml-2" />
              צור קשר לעזרה
            </Button>
            
            <Button 
              onClick={() => navigate(createPageUrl('MyEvents'))} 
              variant="ghost" 
              className="w-full"
            >
              חזור לרשימת האירועים
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}