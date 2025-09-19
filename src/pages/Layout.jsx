

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { EventNotification } from '@/api/entities';
import { Home, PlusCircle, Settings, LogOut, Menu, X, Instagram, Mail, MessageCircle as WhatsAppIcon, Bell, BarChart3, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster, toast } from "@/components/ui/sonner";
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

// Global toast utility using Sonner - Define it immediately when the module loads
if (typeof window !== 'undefined') {
  window.showToast = (type, title, description) => {
  console.log(`Toast called: ${type} - ${title} - ${description}`);
  
  // If both title and description are provided, use title as main message and description as subtitle
  // If only title is provided, use it as the main message
  const mainMessage = title;
  const subtitle = description;
  
  const toastOptions = {
    description: subtitle,
    duration: type === 'error' ? 6000 : type === 'warn' || type === 'warning' ? 5000 : 4000
  };
  
  switch (type) {
    case 'success':
      toast.success(mainMessage, toastOptions);
      break;
    case 'error':
      toast.error(mainMessage, toastOptions);
      break;
    case 'warn':
    case 'warning':
      toast.warning(mainMessage, toastOptions);
      break;
    case 'info':
      toast.info(mainMessage, toastOptions);
      break;
    default:
      toast(mainMessage, toastOptions);
  }
  };
}

const navItemsAdmin = [
  { name: 'דשבורד', icon: BarChart3, href: createPageUrl('AdminDashboard') },
  { name: 'האירועים שלי', icon: Home, href: createPageUrl('MyEvents') },
  { name: 'יצירת אירוע חדש', icon: PlusCircle, href: createPageUrl('CreateEvent') },
  { name: 'התראות מנהל', icon: Bell, href: createPageUrl('AdminNotifications'), hasNotifications: true },
];

const navItemsUser = [
  { name: 'האירועים שלי', icon: Home, href: createPageUrl('MyEvents') },
  { name: 'יצירת אירוע חדש', icon: PlusCircle, href: createPageUrl('CreateEvent') },
  { name: 'ההתראות שלי', icon: Bell, href: createPageUrl('UserNotifications'), hasNotifications: true },
];

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c1464f198_STRINGS__1_-removebg-preview.png";

const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
    
    :root {
      direction: rtl;
      --font-open-sans: 'Open Sans', sans-serif;
    }

    body {
      font-family: var(--font-open-sans);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #2F2F2F; /* Default light mode text color */
      transition: background-color 0.3s ease, color 0.3s ease;
      text-align: right;
      background-color: #FEFBF3; /* Default light mode background */
    }

    * {
      direction: inherit;
      font-family: var(--font-open-sans) !important;
    }
    
    .text-bordeaux { color: #5C1A1B; }
    .bg-bordeaux { background-color: #5C1A1B; }

    .ml-1 { margin-right: 0.25rem !important; margin-left: 0 !important; }
    .mr-1 { margin-left: 0.25rem !important; margin-right: 0 !important; }
    .pl-2 { padding-right: 0.5rem !important; padding-left: 0 !important; }
    .pr-2 { padding-left: 0.5rem !important; padding-right: 0 !important; }
    
    .text-left { text-align: right !important; }
    .text-right { text-align: left !important; }

    .justify-start { justify-content: flex-end !important; }
    .justify-end { justify-content: flex-start !important; }

    .btn-bordeaux {
      background-color: #5C1A1B;
      color: white;
      border: 1px solid #5C1A1B;
    }
    .btn-bordeaux:hover {
      background-color: #4a1516;
      border-color: #4a1516;
    }

    .btn-outline-bordeaux {
      background-color: transparent;
      color: #5C1A1B;
      border: 1px solid #5C1A1B;
    }
    .btn-outline-bordeaux:hover {
      background-color: #5C1A1B;
      color: white;
    }

    /* Hide base44 edit button */
    iframe[src*="base44"] + div,
    div[class*="base44"],
    button[class*="base44"],
    [data-testid*="base44"],
    div:has(button:contains("Edit with base44")),
    div:has(span:contains("base44")),
    div[style*="position: fixed"][style*="bottom"] { /* To catch the container */
      display: none !important;
    }

    /* RTL Switch Thumb position and styling */
    /* Ensure the switch itself has RTL direction */
    button[role="switch"] {
      direction: ltr; /* Force LTR on the button itself for transform consistency */
    }

    body[dir="rtl"] button[role="switch"][data-state="checked"] span[data-radix-collection-item] {
      transform: translateX(calc(100% - 2px)); /* Move thumb to the far right considering padding */
    }
    
    body[dir="rtl"] button[role="switch"][data-state="unchecked"] span[data-radix-collection-item] {
      transform: translateX(2px); /* Move thumb to the far left considering padding */
    }

    /* Ensure correct background color for checked state and thumb color */
    button[role="switch"][data-state="checked"] {
      background-color: #5C1A1B !important; /* Bordeaux color when checked */
    }
     button[role="switch"] span[data-radix-collection-item] {
       background-color: white !important; /* Thumb color */
    }

    /* Checkbox Styling */
    button[role="checkbox"][data-state="checked"] {
      background-color: #5C1A1B !important; /* Bordeaux background when checked */
      border-color: #5C1A1B !important; /* Bordeaux border when checked */
    }
    button[role="checkbox"][data-state="checked"] svg {
      color: white !important; /* White check mark */
    }
    button[role="checkbox"][data-state="unchecked"] {
      border-color: #A0A0A0; /* A slightly darker border for unchecked state for better visibility */
    }
    button[role="checkbox"]:focus-visible { /* For better focus visibility if needed */
      outline: 2px solid #5C1A1B;
      outline-offset: 2px;
    }
  `}} />
);

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Define public pages that do not require any layout or user checks.
  // This is the "Guest List" for our "Bouncer".
  const publicPages = ['SlideshowPage', 'GuestAccess', 'GuestAlbum', 'PaymentSuccess', 'PaymentError'];
  const isPublicPage = publicPages.includes(currentPageName);

  // Fetch unread notifications count for admin users
  const fetchUnreadNotificationsCount = async () => {
    try {
      const notifications = await EventNotification.filter({ is_read: false }, '-created_date');
      setUnreadNotifications(notifications.length);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  };

  // This useEffect will run for ALL PAGES (but only do protected logic for non-public pages)
  useEffect(() => {
    // Force light mode for all pages
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('darkMode');
    }

    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
    
    document.documentElement.dir = 'rtl';

    let notificationInterval;

    // Only run user check for protected pages
    if (!isPublicPage) {
      const checkUserOnProtectedRoute = async () => {
        try {
          const currentUser = await User.me();
          setUser(currentUser);
          
          // If user is admin, fetch unread notifications count
          if (currentUser && currentUser.role === 'admin') {
            await fetchUnreadNotificationsCount();
            
            // Set up interval to refresh notifications count every 30 seconds
            notificationInterval = setInterval(fetchUnreadNotificationsCount, 30000);
          }
        } catch (error) {
          // If the check fails on a protected page, redirect to the Home page.
          navigate(createPageUrl('Home'));
        }
      };
      
      checkUserOnProtectedRoute();
    }

    return () => {
      if(document.head.contains(manifestLink)) document.head.removeChild(manifestLink);
      if (notificationInterval) {
        clearInterval(notificationInterval);
      }
    };
  }, [currentPageName, navigate, isPublicPage]);

  const handleLogout = async () => {
    try {
      await User.logout();
      navigate(createPageUrl('MyEvents'));
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const SidebarContent = ({ items, isMobile = false }) => (
    <nav className={`flex flex-col space-y-2 ${isMobile ? 'px-4' : ''} flex-grow`}>
      {items.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          onClick={() => isMobile && setIsSheetOpen(false)}
          className={`flex items-center justify-between space-x-3 rtl:space-x-reverse px-4 py-3 rounded-xl transition-all duration-200 font-medium relative
            ${location.pathname === item.href
              ? 'bg-[#5C1A1B] text-white shadow-lg shadow-[#5C1A1B]/30 transform scale-105'
              : 'text-gray-700 hover:bg-[#F5F5DC]/60 hover:text-[#5C1A1B] active:scale-95'
            }`}
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <item.icon className="w-6 h-6" />
            <span className="text-lg">{item.name}</span>
          </div>
          
          {/* Notification badge for admin notifications */}
          {item.hasNotifications && user && user.role === 'admin' && unreadNotifications > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </div>
          )}
        </Link>
      ))}
      
      {/* Logout button for mobile */}
      {isMobile && user && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setIsSheetOpen(false);
              handleLogout();
            }}
            className="flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-xl transition-all duration-200 font-medium w-full text-red-600 hover:bg-red-50 active:scale-95"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-lg">התנתק</span>
          </button>
        </div>
      )}
      
      {/* Contact section added to sidebar */}
      <div className={`mt-auto pt-6 ${isMobile ? '' : 'border-t border-gray-200/50'}`}>
        <h3 className="text-sm font-semibold text-gray-500 px-4 mb-2">ליצירת קשר עם STRINGS:</h3>
        <div className="flex flex-col space-y-1">
          <a 
            href="https://wa.me/972542565889"
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={() => isMobile && setIsSheetOpen(false)}
            className="flex items-center space-x-3 rtl:space-x-reverse px-4 py-2 rounded-md text-gray-600 hover:bg-[#F5F5DC]/60 hover:text-[#5C1A1B]"
          >
            <WhatsAppIcon className="w-5 h-5 text-green-500" />
            <span>WhatsApp</span>
          </a>
          <a 
            href="mailto:stringsalbumapp@gmail.com" 
            className="flex items-center space-x-3 rtl:space-x-reverse px-4 py-2 rounded-md text-gray-600 hover:bg-[#F5F5DC]/60 hover:text-[#5C1A1B]"
          >
            <Mail className="w-5 h-5 text-red-500" />
            <span>Email</span>
          </a>
          <a 
            href="https://www.instagram.com/stringsalbum?igsh=OGxxbGw5YmxrcjBm"
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={() => isMobile && setIsSheetOpen(false)}
            className="flex items-center space-x-3 rtl:space-x-reverse px-4 py-2 rounded-md text-gray-600 hover:bg-[#F5F5DC]/60 hover:text-[#5C1A1B]"
          >
            <Instagram className="w-5 h-5 text-pink-500" />
            <span>Instagram</span>
          </a>
        </div>
      </div>
    </nav>
  );

  // Early return for public pages - AFTER all hooks are declared
  if (isPublicPage) {
    return (
        <>
            <GlobalStyles /> 
            <Toaster richColors position="top-center" expand={true} closeButton />
            {currentPageName !== 'SlideshowPage' && <PWAInstallPrompt />}
            {children}
        </>
    );
  }

  // If we are here, it's a protected page and the user check is in progress.
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6]">
        <GlobalStyles />
        <Loader2 className="w-12 h-12 text-bordeaux animate-spin" />
      </div>
    );
  }

  // Determine which navigation items to show based on user role
  const currentNavItems = user && user.role === 'admin' ? navItemsAdmin : navItemsUser;
  const isAdminAreaPage = ['Home', 'MyEvents', 'CreateEvent', 'EditEvent', 'PaymentPage', 'AdminNotifications', 'AdminDashboard', 'UserNotifications'].includes(currentPageName);

  // Always include Toaster and PWA prompt regardless of page type
  const mainContent = (
    <>
      <GlobalStyles />
      <Toaster richColors position="top-center" expand={true} closeButton />
      <PWAInstallPrompt />
      {children}
    </>
  );

  if (!isAdminAreaPage) {
    return (
      <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6]">
        <main className="flex-grow">
          {mainContent}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex md:flex-row transition-colors duration-300 bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6]">
      
      <aside className="hidden md:flex md:flex-col md:w-72 bg-white/80 backdrop-blur-sm shadow-xl p-6 border-l border-gray-200/50 rtl:border-r rtl:border-l-0">
        <Link to={createPageUrl('MyEvents')} className="flex items-center justify-center mb-8 w-full">
          <img src={LOGO_URL} alt="Strings Logo" className="h-auto w-full max-w-[200px] sm:max-w-[240px]" />
        </Link>
        
        {/* User Profile Section - Desktop */}
        {user && (
          <div className="mb-6 p-4 bg-white/50 rounded-xl border border-gray-200/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full p-2 h-auto rounded-lg hover:bg-white/70">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Avatar className="h-10 w-10 border-2 border-bordeaux/50">
                      <AvatarImage src={user.profile_picture_url || ''} alt={user.full_name} />
                      <AvatarFallback className="bg-bordeaux/20 text-bordeaux font-semibold">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-right rtl:text-left">
                      <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.role === 'admin' ? 'מנהל מערכת' : 'משתמש'}</p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white shadow-xl rounded-xl border-gray-200">
                <DropdownMenuLabel className="px-3 py-2 text-gray-800">
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200"/>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:!bg-red-50 focus:!bg-red-50 cursor-pointer text-base py-2.5 px-3 rounded-md">
                  <LogOut className="mr-2 rtl:ml-2 rtl:mr-0 h-5 w-5" />
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        <SidebarContent items={currentNavItems} />
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link to={createPageUrl('MyEvents')} className="flex items-center flex-grow mr-4 rtl:ml-4 rtl:mr-0">
                <img src={LOGO_URL} alt="Strings Logo" className="h-auto w-full max-w-[180px]" />
              </Link>
              <div className="flex items-center flex-shrink-0">
                {user ? (
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-0 rounded-full ml-1 rtl:mr-1 rtl:ml-0 relative">
                        <Avatar className="h-10 w-10 border-2 border-bordeaux/50">
                            <AvatarImage src={user.profile_picture_url || ''} alt={user.full_name} />
                            <AvatarFallback className="bg-bordeaux/20 text-bordeaux font-semibold">
                            {getInitials(user.full_name)}
                            </AvatarFallback>
                        </Avatar>
                        {/* Show notification badge on mobile user avatar for admin */}
                        {user.role === 'admin' && unreadNotifications > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                          </div>
                        )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white shadow-xl rounded-xl border-gray-200">
                        <DropdownMenuLabel className="px-3 py-2 text-gray-800">
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-200"/>
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:!bg-red-50 focus:!bg-red-50 cursor-pointer text-base py-2.5 px-3 rounded-md">
                        <LogOut className="mr-2 rtl:ml-2 rtl:mr-0 h-5 w-5" />
                        התנתק
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                     <Button onClick={() => navigate(createPageUrl('MyEvents'))} variant="ghost" className="text-bordeaux ml-1 rtl:mr-1 rtl:ml-0">
                        כניסת מנהלים
                    </Button>
                )}
                 <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-600">
                      {isSheetOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72 bg-white/95 backdrop-blur-md p-6 border-l rtl:border-r rtl:border-l-0">
                    <div className="flex items-center justify-center mb-8 w-full">
                       <Link to={createPageUrl('MyEvents')} onClick={() => setIsSheetOpen(false)} className="flex items-center">
                        <img src={LOGO_URL} alt="Strings Logo" className="h-auto w-full max-w-[180px]" />
                      </Link>
                    </div>
                    <SidebarContent items={currentNavItems} isMobile={true} />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {mainContent}
        </main>
      </div>
      <GlobalStyles />
      <Toaster richColors position="top-center" expand={true} closeButton />
      <PWAInstallPrompt />
    </div>
  );
}

