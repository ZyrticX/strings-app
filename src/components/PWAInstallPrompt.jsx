
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
  return null; // This will prevent the component from rendering

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    
    // Check if iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show install prompt if not in standalone mode
    if (isIOS && !isStandalone) {
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-dismissed');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isIOS, isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-dismissed', 'true');
  };

  if (!showInstallPrompt || isStandalone) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto shadow-lg border-bordeaux" dir="rtl">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-bordeaux/10 p-2 rounded-full">
            <Smartphone className="w-5 h-5 text-bordeaux" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-bordeaux mb-1">התקן את STRINGS</h3>
            <p className="text-sm text-gray-600 mb-3">
              {isIOS 
                ? 'לחץ על כפתור "שתף" בדפדפן ובחר "הוסף למסך הבית"'
                : 'התקן את האפליקציה לגישה מהירה ונוחה יותר'
              }
            </p>
            <div className="flex gap-2">
              {!isIOS && (
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="btn-bordeaux flex-1"
                >
                  <Download className="w-4 h-4 ml-1" />
                  התקן
                </Button>
              )}
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;
