import React from 'react';
import Layout from "./Layout.jsx";

import MyEvents from "./MyEvents";

import CreateEvent from "./CreateEvent";

import EditEvent from "./EditEvent";

import GuestAccess from "./GuestAccess";

import GuestAlbum from "./GuestAlbum";

import CreateEventPage from "./CreateEventPage";

import PaymentPage from "./PaymentPage";

import AdminNotifications from "./AdminNotifications";
import UserNotifications from "./UserNotifications";

import AdminDashboard from "./AdminDashboard";

import PaymentSuccess from "./PaymentSuccess";

import PaymentError from "./PaymentError";

import SlideshowPage from "./SlideshowPage";

import Home from "./Home";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    MyEvents: MyEvents,
    
    CreateEvent: CreateEvent,
    
    EditEvent: EditEvent,
    
    GuestAccess: GuestAccess,
    
    GuestAlbum: GuestAlbum,
    
    CreateEventPage: CreateEventPage,
    
    PaymentPage: PaymentPage,
    
    AdminNotifications: AdminNotifications,
    
    AdminDashboard: AdminDashboard,
    
    PaymentSuccess: PaymentSuccess,
    
    PaymentError: PaymentError,
    
    SlideshowPage: SlideshowPage,
    
    Home: Home,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    
    // Simplified and safer page detection
    const getPageName = React.useCallback((pathname) => {
        try {
            const path = pathname.replace(/^\//, '').split('/')[0] || 'MyEvents';
            
            // Handle specific page mappings to match exact component names
            const pageMap = {
                'myevents': 'MyEvents',
                'createevent': 'CreateEvent',
                'editevent': 'EditEvent',
                'paymentpage': 'PaymentPage',
                'adminnotifications': 'AdminNotifications',
                'admindashboard': 'AdminDashboard',
                'usernotifications': 'UserNotifications',
                'guestaccess': 'GuestAccess',
                'guestalbum': 'GuestAlbum',
                'createeventpage': 'CreateEventPage',
                'paymentsuccess': 'PaymentSuccess',
                'paymenterror': 'PaymentError',
                'slideshowpage': 'SlideshowPage',
                'home': 'Home',
                'dashboard': 'Dashboard'
            };
            
            const lowerPath = path.toLowerCase();
            const pageName = pageMap[lowerPath] || path.charAt(0).toUpperCase() + path.slice(1);
            
            console.log('🔍 Page Detection Debug:');
            console.log('- pathname:', pathname);
            console.log('- path after cleanup:', path);
            console.log('- lowerPath:', lowerPath);
            console.log('- final pageName:', pageName);
            return pageName;
        } catch (error) {
            console.error('Error in getPageName:', error);
            return 'Home';
        }
    }, []);
    
    const currentPage = React.useMemo(() => {
        return getPageName(location.pathname);
    }, [location.pathname, getPageName]);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<Home />} />
                <Route path="/MyEvents" element={<MyEvents />} />
                <Route path="/CreateEvent" element={<CreateEvent />} />
                <Route path="/EditEvent" element={<EditEvent />} />
                <Route path="/GuestAccess" element={<GuestAccess />} />
                <Route path="/guest/:eventId" element={<GuestAccess />} />
                <Route path="/GuestAlbum" element={<GuestAlbum />} />
                <Route path="/CreateEventPage" element={<CreateEventPage />} />
                <Route path="/PaymentPage" element={<PaymentPage />} />
                <Route path="/AdminNotifications" element={<AdminNotifications />} />
                <Route path="/UserNotifications" element={<UserNotifications />} />
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
                <Route path="/PaymentError" element={<PaymentError />} />
                <Route path="/SlideshowPage" element={<SlideshowPage />} />
                <Route path="/Home" element={<Home />} />
                <Route path="/Dashboard" element={<MyEvents />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    try {
        return (
            <Router>
                <PagesContent />
            </Router>
        );
    } catch (error) {
        console.error('Error in Pages component:', error);
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-6">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">שגיאה בטעינת האפליקציה</h1>
                    <p className="text-gray-600 mb-4">אירעה שגיאה בניתוב. אנא רענן את הדף.</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        רענן דף
                    </button>
                </div>
            </div>
        );
    }
}