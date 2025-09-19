import React, { useState, useEffect } from 'react';
import { EventNotification } from '@/api/entities';
import { User } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Eye, ExternalLink, Edit, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const UserNotificationCard = ({ notification, onMarkAsRead, onNavigate }) => {
    const isNewEvent = notification.notification_type === 'new_event';
    const isUpdate = notification.notification_type === 'event_updated';
    const isPayment = notification.notification_type === 'payment_reminder';

    const getNotificationIcon = () => {
        if (isNewEvent) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
        if (isUpdate) return <Edit className="w-5 h-5 text-blue-600" />;
        if (isPayment) return <AlertCircle className="w-5 h-5 text-orange-600" />;
        return <Bell className="w-5 h-5 text-gray-600" />;
    };

    const getNotificationColor = () => {
        if (isNewEvent) return 'border-green-200 bg-green-50';
        if (isUpdate) return 'border-blue-200 bg-blue-50';
        if (isPayment) return 'border-orange-200 bg-orange-50';
        return 'border-gray-200 bg-gray-50';
    };

    return (
        <Card className={`${notification.is_read ? 'opacity-75' : ''} ${getNotificationColor()}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {getNotificationIcon()}
                        <div>
                            <CardTitle className="text-lg">
                                {notification.title || (isNewEvent ? 'אירוע נוצר' : isUpdate ? 'אירוע עודכן' : 'התראה')}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {notification.event_name && `אירוע: ${notification.event_name}`}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!notification.is_read && (
                            <Badge variant="secondary" className="bg-bordeaux text-white">
                                חדש
                            </Badge>
                        )}
                        <div className="text-xs text-gray-500 text-left">
                            {notification.created_at 
                                ? format(parseISO(notification.created_at), 'PPp', { locale: he })
                                : 'תאריך לא זמין'
                            }
                        </div>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent>
                {notification.message && (
                    <p className="text-gray-700 mb-3">{notification.message}</p>
                )}
                
                {notification.event_details && (
                    <div className="bg-white p-3 rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-2">פרטי האירוע:</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                            {notification.event_details.date && (
                                <div>📅 תאריך: {format(parseISO(notification.event_details.date), 'PPP', { locale: he })}</div>
                            )}
                            {notification.event_details.location && (
                                <div>📍 מיקום: {notification.event_details.location}</div>
                            )}
                            {notification.event_details.type && (
                                <div>🎭 סוג: {notification.event_details.type}</div>
                            )}
                            {notification.event_details.total_amount && (
                                <div>💰 סכום: ₪{notification.event_details.total_amount}</div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
            
            <CardFooter className="bg-white p-3 flex justify-end gap-2">
                {!notification.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)}>
                        <Eye className="w-4 h-4 ml-1" /> סמן כנקרא
                    </Button>
                )}
                {notification.event_id && (
                    <Button variant="outline" size="sm" onClick={() => onNavigate(notification.event_id)}>
                        <ExternalLink className="w-4 h-4 ml-1" /> עבור לאירוע
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default function UserNotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserNotifications = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
                console.log('🔍 Fetching notifications for user:', user);
                
                // Get all notifications and filter for this user's events
                const allNotifications = await EventNotification.list('-created_at');
                console.log('📋 All notifications:', allNotifications);
                
                // Filter notifications related to user's events or addressed to them
                const userNotifications = allNotifications.filter(notification => 
                    notification.organizer_email === user.email ||
                    notification.event_details?.organizer_email === user.email
                );
                
                console.log('👤 User notifications:', userNotifications);
                setNotifications(userNotifications);
                
            } catch (error) {
                console.error("Failed to fetch user notifications:", error);
                navigate(createPageUrl('MyEvents'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserNotifications();
    }, [navigate]);

    const handleMarkAsRead = async (id) => {
        try {
            await EventNotification.update(id, { is_read: true });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };
    
    const handleNavigate = (eventId) => {
        navigate(createPageUrl(`EditEvent?id=${eventId}`));
    };

    if (isLoading) return (
        <div className="max-w-4xl mx-auto p-4" dir="rtl">
            <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bordeaux"></div>
                <span className="mr-3">טוען התראות...</span>
            </div>
        </div>
    );
    
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="max-w-4xl mx-auto p-4" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-bordeaux">ההתראות שלי</h1>
                    <p className="text-gray-600 mt-1">עדכונים על האירועים שלך</p>
                </div>
                <Badge variant={unreadCount > 0 ? "destructive" : "secondary"}>
                    {unreadCount} התראות שלא נקראו
                </Badge>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">אין התראות</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        התראות על האירועים שלך יופיעו כאן.<br/>
                        כולל עדכונים על תשלומים, שינויים באירועים ועוד.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map(notification => (
                        <UserNotificationCard
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onNavigate={handleNavigate}
                        />
                    ))}
                </div>
            )}

            {unreadCount > 0 && (
                <div className="mt-6 text-center">
                    <Button 
                        variant="outline" 
                        onClick={async () => {
                            try {
                                // Mark all user notifications as read
                                const updates = notifications
                                    .filter(n => !n.is_read)
                                    .map(n => EventNotification.update(n.id, { is_read: true }));
                                
                                await Promise.all(updates);
                                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                            } catch (error) {
                                console.error("Failed to mark all as read:", error);
                            }
                        }}
                    >
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                        סמן הכל כנקרא
                    </Button>
                </div>
            )}
        </div>
    );
}
