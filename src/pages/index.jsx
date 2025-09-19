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
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<MyEvents />} />
                
                
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
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}