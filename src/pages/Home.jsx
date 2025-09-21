import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import LoginPortal from '../components/LoginPortal';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [authStatus, setAuthStatus] = useState('checking');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        await User.me();
        
        // Check if there's a pending event access (from Google Auth in GuestAccess)
        const pendingEventAccess = localStorage.getItem('pendingEventAccess');
        if (pendingEventAccess) {
          console.log('🎯 Found pending event access after Google login');
          const eventInfo = JSON.parse(pendingEventAccess);
          localStorage.removeItem('pendingEventAccess');
          
          // Store Google auth info for the album
          localStorage.setItem('guestEventId', eventInfo.eventId);
          localStorage.setItem('guestAuthType', 'google');
          
          // Redirect directly to album
          navigate(createPageUrl('GuestAlbum'));
          return;
        }
        
        // Check if there's a stored redirect path
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          console.log('🔄 Redirecting after login to:', redirectPath);
          localStorage.removeItem('redirectAfterLogin');
          // If it's a guest page, redirect back there
          if (redirectPath.includes('/GuestAccess') || redirectPath.includes('/guest/')) {
            console.log('📱 Redirecting to guest page');
            window.location.href = redirectPath;
            return;
          }
        }
        
        // User is logged in, redirect to MyEvents (dashboard)
        navigate(createPageUrl('MyEvents'));
      } catch (error) {
        // User is not logged in, show the login portal
        setAuthStatus('unauthenticated');
      }
    };
    checkUser();
  }, [navigate]);

  // While checking, show a loader
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6]">
        <Loader2 className="w-12 h-12 text-bordeaux animate-spin" />
        <p className="mt-4 text-gray-600">טוען...</p>
      </div>
    );
  }

  // If user is not logged in, show login portal
  return <LoginPortal />;
}