import React, { useState } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c1464f198_STRINGS__1_-removebg-preview.png";

export default function LoginPortal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await User.login();
    } catch (err) {
      setError("שגיאה בהתחברות עם גוגל. נסה שוב.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6]" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl border-0 bg-white/80 backdrop-blur-lg">
        <CardHeader className="text-center p-6">
          <img src={LOGO_URL} alt="Strings Logo" className="w-auto h-16 mx-auto mb-4" />
          <CardTitle className="text-2xl text-bordeaux font-bold">ברוכים הבאים ל-STRINGS</CardTitle>
          <CardDescription className="text-gray-600">מערכת הזיכרונות מהאירוע שלכם</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center">
              <AlertCircle className="w-5 h-5 ml-2" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="font-semibold text-center text-gray-700 text-lg">התחברות למערכת</h3>
            <Button onClick={handleGoogleLogin} disabled={isLoading} className="w-full h-14 btn-bordeaux text-lg">
              {isLoading ? (
                <Loader2 className="w-6 h-6 ml-2 animate-spin" />
              ) : (
                <LogIn className="w-6 h-6 ml-2" />
              )}
              התחברות עם Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="p-4 bg-gray-50/50 rounded-b-2xl">
            <p className="text-xs text-center text-gray-500 w-full">זקוקים לעזרה? פנו אלינו ב<a href="https://wa.me/972542565889" target="_blank" className="font-semibold text-bordeaux hover:underline">WhatsApp</a>.</p>
        </CardFooter>
      </Card>
    </div>
  );
}