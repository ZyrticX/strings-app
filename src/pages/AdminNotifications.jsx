
import React, { useState, useEffect } from 'react';
import { EventNotification } from '@/api/entities';
import { User } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Eye, ExternalLink, Edit, Clock, AlertCircle, Trash2, CheckCircle, Calendar, User as UserIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const NotificationCard = ({ notification, onMarkAsRead, onNavigate }) => {
    const isNewEvent = notification.notification_type === 'new_event';
    const isUpdate = notification.notification_type === 'event_updated';

    const renderDetails = () => {
        if (isNewEvent) {
            return (
                <ul className="text-sm space-y-1">
                    <li><strong>מארגן:</strong> {notification.organizer_name} ({notification.organizer_email})</li>
                    {notification.event_details?.location && (
                        <li><strong>מיקום:</strong> {notification.event_details.location}</li>
                    )}
                    {notification.event_details?.start_time && (
                        <li><strong>שעת התחלה:</strong> {notification.event_details.start_time}</li>
                    )}
                    {notification.event_details?.bracelets_count && (
                        <li><strong>כמות צמידים:</strong> {notification.event_details.bracelets_count}</li>
                    )}
                    <li><strong>קוד גישה:</strong> <Badge variant="outline">{notification.access_code}</Badge></li>
                    {notification.event_details?.advance_amount && (
                        <li><strong>מקדמה:</strong> ₪{notification.event_details.advance_amount}</li>
                    )}
                </ul>
            );
        }
        if (isUpdate) {
            const changes = notification.event_details?.changes_made || {};
            if (Object.keys(changes).length === 0) {
                return <p className="text-sm text-gray-600">פרטי האירוע עודכנו (אין פירוט שינויים זמין להתראה זו).</p>;
            }
            return (
                <div>
                    <p className="font-semibold mb-2 text-bordeaux">השינויים שבוצעו:</p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                        {Object.entries(changes).map(([key, value]) => (
                            <li key={key}>
                                <strong>{keyMap[key] || key}:</strong> מ-"{value.from || 'ריק'}" ל-"{value.to || 'ריק'}"
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        if (notification.type === 'event_deleted') {
            return (
                <ul className="text-sm space-y-1">
                    <li><strong>מארגן:</strong> {notification.organizer_name} ({notification.organizer_email})</li>
                    {notification.event_details?.location && (
                        <li><strong>מיקום:</strong> {notification.event_details.location}</li>
                    )}
                    <li><strong>נמחק בתאריך:</strong> {notification.event_details?.deleted_at ? format(parseISO(notification.event_details.deleted_at), 'PPp', { locale: he }) : 'לא זמין'}</li>
                </ul>
            );
        }
        if (notification.type === 'payment_completed') {
            return (
                <ul className="text-sm space-y-1">
                    <li><strong>מארגן:</strong> {notification.organizer_name} ({notification.organizer_email})</li>
                    {notification.event_details?.advance_amount && (
                        <li><strong>סכום שהתקבל:</strong> <Badge variant="success">₪{notification.event_details.advance_amount}</Badge></li>
                    )}
                    <li><strong>סטטוס:</strong> <Badge variant="success">תשלום התקבל</Badge></li>
                </ul>
            );
        }
        if (notification.type === 'payment_reminder') {
            return (
                <ul className="text-sm space-y-1">
                    <li><strong>מארגן:</strong> {notification.organizer_name} ({notification.organizer_email})</li>
                    {notification.event_details?.advance_amount && (
                        <li><strong>סכום נדרש:</strong> <Badge variant="destructive">₪{notification.event_details.advance_amount}</Badge></li>
                    )}
                    <li><strong>סטטוס:</strong> <Badge variant="destructive">ממתין לתשלום</Badge></li>
                </ul>
            );
        }
        return <p className="text-sm text-gray-600">פרטי ההתראה: {notification.message}</p>;
    };

    const keyMap = { 
        name: "שם אירוע", 
        event_type: "סוג אירוע", 
        event_date: "תאריך", 
        start_time: "שעת התחלה", 
        location_text: "מיקום",
        bracelets_count: "כמות צמידים",
        guest_count_estimate: "אורחים (הערכה)",
        organizer_phone_number: "טלפון מארגן",
        welcome_message: "הודעת פתיחה",
        cover_image_url: "תמונת נושא",
        allow_video_uploads: "אפשר העלאת וידאו",
        total_deal_amount: "סכום עסקה כולל",
        advance_payment_amount: "סכום מקדמה",
        advance_payment_status: "סטטוס מקדמה"
    };

    return (
        <Card className={`${!notification.is_read ? 'border-bordeaux bg-red-50' : 'bg-white'}`}>
            <CardHeader className="flex flex-row justify-between items-start">
                <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2 mb-2">
                        {isNewEvent && <><Bell className="w-5 h-5 text-green-500" />אירוע חדש נוצר</>}
                        {isUpdate && <><Edit className="w-5 h-5 text-blue-500" />אירוע עודכן</>}
                        {notification.type === 'event_deleted' && <><Trash2 className="w-5 h-5 text-red-500" />אירוע נמחק</>}
                        {notification.type === 'payment_completed' && <><CheckCircle className="w-5 h-5 text-green-500" />תשלום התקבל</>}
                        {notification.type === 'payment_reminder' && <><AlertCircle className="w-5 h-5 text-orange-500" />נדרש תשלום</>}
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-bordeaux mb-1">
                        {notification.event_name}
                    </CardDescription>
                    {notification.event_details && (
                        <div className="text-sm text-gray-600 space-y-1">
                            {notification.event_details.type_hebrew && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{notification.event_details.type_hebrew}</span>
                                    {notification.event_details.formatted_date && (
                                        <span className="text-gray-500">• {notification.event_details.formatted_date}</span>
                                    )}
                                </div>
                            )}
                            {notification.organizer_name && (
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    <span>מארגן: {notification.organizer_name}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="text-xs text-gray-500 text-left">
                    <div className="font-medium">תאריך התראה:</div>
                    {notification.created_at 
                        ? format(parseISO(notification.created_at), 'PPp', { locale: he })
                        : 'תאריך לא זמין'
                    }
                </div>
            </CardHeader>
            <CardContent>
                {renderDetails()}
            </CardContent>
            <CardFooter className="bg-gray-50 p-2 flex justify-end gap-2">
                 {!notification.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)}>
                        <Eye className="w-4 h-4 ml-1" /> סמן כנקרא
                    </Button>
                 )}
                 <Button variant="outline" size="sm" onClick={() => onNavigate(notification.event_id)}>
                     <ExternalLink className="w-4 h-4 ml-1" /> עבור לאירוע
                 </Button>
            </CardFooter>
        </Card>
    );
};

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdminAndFetch = async () => {
            try {
                console.log('🔍 AdminNotifications - Starting admin check...');
                const user = await User.me(); 
                console.log('👤 AdminNotifications - Current user role:', user?.role);
                
                if (user.role !== 'admin') {
                    console.warn('❌ User is not admin, redirecting. Role:', user?.role);
                    navigate(createPageUrl('MyEvents'));
                    return;
                }
                
                console.log('✅ User is admin, loading notifications...');
                
                // Try to fetch notifications with better error handling
                try {
                    const fetchedNotifications = await EventNotification.list('-created_at');
                    console.log('📋 Fetched notifications:', fetchedNotifications);
                    setNotifications(fetchedNotifications || []);
                } catch (notificationError) {
                    console.error('❌ Error fetching notifications specifically:', notificationError);
                    console.error('❌ Notification error details:', notificationError.message, notificationError.details);
                    // Set empty array instead of crashing
                    setNotifications([]);
                    // You could show a toast here if needed
                }
                
            } catch (error) {
                console.error("❌ Failed to check admin status:", error);
                console.error("❌ Error details:", error.message, error.details);
                navigate(createPageUrl('MyEvents'));
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAndFetch();
    }, [navigate]);

    const handleMarkAsRead = async (id) => {
        try {
            await EventNotification.update(id, { is_read: true });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            // Optionally, show an error message to the user
        }
    };
    
    const handleNavigate = (eventId) => {
        navigate(createPageUrl(`EditEvent?id=${eventId}`));
    };

    if (isLoading) return <div className="p-8">טוען התראות...</div>;
    
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="max-w-4xl mx-auto p-4" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-bordeaux">התראות מנהל</h1>
                <Badge variant={unreadCount > 0 ? "destructive" : "secondary"}>
                    {unreadCount} התראות שלא נקראו
                </Badge>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">אין התראות חדשות</h3>
                    <p className="mt-1 text-sm text-gray-500">התראות על אירועים חדשים ועדכונים יופיעו כאן.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map(notification => (
                        <NotificationCard 
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onNavigate={handleNavigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
