import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import LoginPortal from '../components/LoginPortal';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [authStatus, setAuthStatus] = useState('checking');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
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
        
        // User is logged in, show home page
        setAuthStatus('authenticated');
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
  if (authStatus === 'unauthenticated') {
    return <LoginPortal />;
  }

  // User is logged in, show home dashboard
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#5C1A1B] mb-2">
          ברוכים הבאים ל-Strings App Events! 🎉
        </h1>
        <p className="text-xl text-gray-600">
          שלום {user?.full_name || 'משתמש'}, מה תרצה לעשות היום?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* My Events Card */}
        <div 
          onClick={() => navigate(createPageUrl('MyEvents'))}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-[#5C1A1B]/20"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-[#5C1A1B] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold text-[#5C1A1B] mb-2">האירועים שלי</h3>
            <p className="text-gray-600">צפה וערוך את כל האירועים שלך</p>
          </div>
        </div>

        {/* Create Event Card */}
        <div 
          onClick={() => navigate(createPageUrl('CreateEvent'))}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-[#5C1A1B]/20"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-[#5C1A1B] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">➕</span>
            </div>
            <h3 className="text-xl font-semibold text-[#5C1A1B] mb-2">צור אירוע חדש</h3>
            <p className="text-gray-600">התחל לתכנן אירוע חדש</p>
          </div>
        </div>

        {/* Admin Dashboard (if admin) */}
        {user?.role === 'admin' && (
          <div 
            onClick={() => navigate(createPageUrl('AdminDashboard'))}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-[#5C1A1B]/20"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-[#5C1A1B] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">⚙️</span>
              </div>
              <h3 className="text-xl font-semibold text-[#5C1A1B] mb-2">ניהול מערכת</h3>
              <p className="text-gray-600">כלי ניהול למנהלי המערכת</p>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div 
          onClick={() => navigate(createPageUrl(user?.role === 'admin' ? 'AdminNotifications' : 'UserNotifications'))}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-[#5C1A1B]/20"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-[#5C1A1B] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🔔</span>
            </div>
            <h3 className="text-xl font-semibold text-[#5C1A1B] mb-2">התראות</h3>
            <p className="text-gray-600">עדכונים והתראות חשובות</p>
          </div>
        </div>
      </div>
    </div>
  );
}