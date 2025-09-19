import React, { useState, useEffect } from 'react';
import { Event } from '@/api/entities';
import { MediaItem } from '@/api/entities';
import { EventNotification } from '@/api/entities';
import { User } from '@/api/entities';
import { GuestWish } from '@/api/entities';
import { HighlightCategory } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Bell,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Trash2,
  Archive,
  Loader2,
  Shield,
  Edit
} from 'lucide-react';
import { format, parseISO, differenceInDays, addDays, subDays, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import { runAutomaticEmails, sendPostEventPersonalAlbums, sendDeletionWarnings } from '@/utils/automaticEmails';
import { showToast } from '@/utils/toast';

const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue", trend = null }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/20`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600 dark:text-green-400">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const UpcomingEventCard = ({ event, daysUntil }) => {
  const navigate = useNavigate();

  const getUrgencyColor = (days) => {
    if (days <= 7) return 'red';
    if (days <= 14) return 'orange';
    return 'blue';
  };

  const urgencyColor = getUrgencyColor(daysUntil);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{event.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(parseISO(event.event_date), 'PPP', { locale: he })}
            </p>
            <div className="mt-2 flex items-center space-x-2 rtl:space-x-reverse">
              <Badge variant={event.advance_payment_status === 'paid' ? 'default' : 'secondary'}>
                {event.advance_payment_status === 'paid' ? 'שולם' : 'לא שולם'}
              </Badge>
              <Badge variant={urgencyColor === 'red' ? 'destructive' : 'outline'}>
                {daysUntil === 0 ? 'היום!' : `${daysUntil} ימים`}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl(`EditEvent?id=${event.id}`))}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ExpiringEventCard = ({ event, daysUntilExpiry }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{event.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              אירוע: {format(parseISO(event.event_date), 'PPP', { locale: he })}
            </p>
            <div className="mt-2 flex items-center space-x-2 rtl:space-x-reverse">
              <Badge variant="outline" className="border-orange-400 text-orange-600">
                יפוג בעוד {daysUntilExpiry} ימים
              </Badge>
              <span className="text-xs text-gray-500">
                מחיקה: {format(addDays(parseISO(event.event_date), 30), 'PPP', { locale: he })}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl(`EditEvent?id=${event.id}`))}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ExpiredEventCard = ({ event, onDelete }) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את האירוע "${event.name}" לצמיתות? פעולה זו לא ניתנת לביטול.`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDelete(event.id);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('שגיאה במחיקת האירוע. נסה שוב מאוחר יותר.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Card className="border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{event.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              אירוע: {format(parseISO(event.event_date), 'PPP', { locale: he })}
            </p>
            <div className="mt-2 flex items-center space-x-2 rtl:space-x-reverse">
              <Badge variant="destructive">
                פג תוקף
              </Badge>
              <span className="text-xs text-gray-500">
                פג ב: {format(addDays(parseISO(event.event_date), 30), 'PPP', { locale: he })}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(createPageUrl(`EditEvent?id=${event.id}`))}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [mediaStats, setMediaStats] = useState({ total: 0, images: 0, videos: 0 });
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [emailOperations, setEmailOperations] = useState({
    isRunningAll: false,
    isRunningPersonal: false,
    isRunningDeletion: false,
    lastResults: null
  });
  const navigate = useNavigate();

  // Use the improved toast utility
  const safeShowToast = showToast;

  // פונקציות למיילים אוטומטיים
  const handleRunAllAutomaticEmails = async () => {
    setEmailOperations(prev => ({ ...prev, isRunningAll: true }));
    try {
      const results = await runAutomaticEmails();
      setEmailOperations(prev => ({ ...prev, lastResults: results }));
      safeShowToast("success", "מיילים אוטומטיים הופעלו", 
        `נשלחו ${results.personalAlbums} מיילים אישיים ו-${results.deletionWarnings} התראות מחיקה`);
    } catch (error) {
      console.error('Error running automatic emails:', error);
      safeShowToast("error", "שגיאה במיילים אוטומטיים", error.message);
    } finally {
      setEmailOperations(prev => ({ ...prev, isRunningAll: false }));
    }
  };

  const handleRunPersonalAlbumEmails = async () => {
    setEmailOperations(prev => ({ ...prev, isRunningPersonal: true }));
    try {
      const results = await sendPostEventPersonalAlbums();
      safeShowToast("success", "מיילים אישיים נשלחו", `נשלחו ${results.length} מיילים`);
    } catch (error) {
      console.error('Error sending personal album emails:', error);
      safeShowToast("error", "שגיאה במיילים אישיים", error.message);
    } finally {
      setEmailOperations(prev => ({ ...prev, isRunningPersonal: false }));
    }
  };

  const handleRunDeletionWarnings = async () => {
    setEmailOperations(prev => ({ ...prev, isRunningDeletion: true }));
    try {
      const results = await sendDeletionWarnings();
      safeShowToast("success", "התראות מחיקה נשלחו", `נשלחו ${results.length} התראות`);
    } catch (error) {
      console.error('Error sending deletion warnings:', error);
      safeShowToast("error", "שגיאה בהתראות מחיקה", error.message);
    } finally {
      setEmailOperations(prev => ({ ...prev, isRunningDeletion: false }));
    }
  };

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (user.role !== 'admin') {
          navigate(createPageUrl('MyEvents'));
          return;
        }

        await Promise.all([
          fetchEvents(),
          fetchMediaStats(),
          fetchNotifications()
        ]);
      } catch (error) {
        console.error('Error checking admin access:', error);
        // If there's an error fetching user or permissions, redirect away.
        navigate(createPageUrl('MyEvents'));
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndFetch();
  }, [navigate]);

  const fetchEvents = async () => {
    try {
      const allEvents = await Event.list('-created_date');
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchMediaStats = async () => {
    try {
      const allMedia = await MediaItem.list('-created_date');
      setMediaStats({
        total: allMedia.length,
        images: allMedia.filter(item => item.file_type === 'image').length,
        videos: allMedia.filter(item => item.file_type === 'video').length
      });
    } catch (error) {
      console.error('Error fetching media stats:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const allNotifications = await EventNotification.list('-created_at');
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const deleteExpiredEvent = async (eventId) => {
    try {
      // Delete all related data first
      const mediaItems = await MediaItem.filter({ event_id: eventId });
      for (const item of mediaItems) {
        await MediaItem.delete(item.id);
      }
      
      const guestWishes = await GuestWish.filter({ event_id: eventId });
      for (const wish of guestWishes) {
        await GuestWish.delete(wish.id);
      }
      
      const highlightCategories = await HighlightCategory.filter({ event_id: eventId });
      for (const category of highlightCategories) {
        await HighlightCategory.delete(category.id);
      }
      
      const notificationsToDelete = await EventNotification.filter({ event_id: eventId });
      for (const notification of notificationsToDelete) {
        await EventNotification.delete(notification.id);
      }
      
      // Finally delete the event itself
      await Event.delete(eventId);
      
      // Refresh the events list
      await fetchEvents();
      
      safeShowToast("success", "האירוע נמחק בהצלחה", "האירוע וכל הנתונים הקשורים אליו נמחקו מהמערכת.");
    } catch (error) {
      console.error('Error deleting expired event:', error);
      throw error;
    }
  };

  // Calculate statistics
  const now = new Date();
  const activeEvents = events.filter(event => event.advance_payment_status === 'paid');
  const pendingPayments = events.filter(event => event.advance_payment_status === 'pending_payment');

  const upcomingEvents = events
    .filter(event => {
      if (!event.event_date) return false;
      const eventDate = parseISO(event.event_date);
      return eventDate >= now && differenceInDays(eventDate, now) <= 30;
    })
    .sort((a, b) => parseISO(a.event_date) - parseISO(b.event_date))
    .slice(0, 5);

  const expiringEvents = events
    .filter(event => {
      if (!event.event_date) return false;
      const eventDate = parseISO(event.event_date);
      const expiryDate = addDays(eventDate, 30);
      const daysUntilExpiry = differenceInDays(expiryDate, now);
      return eventDate < now && daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    })
    .sort((a, b) => {
      const expiryA = addDays(parseISO(a.event_date), 30);
      const expiryB = addDays(parseISO(b.event_date), 30);
      return expiryA - expiryB;
    });

  const expiredEventsCalculated = events
    .filter(event => {
      if (!event.event_date) return false;
      const eventDate = parseISO(event.event_date);
      const expiryDate = addDays(eventDate, 30);
      return expiryDate < now;
    })
    .sort((a, b) => {
      const expiryA = addDays(parseISO(a.event_date), 30);
      const expiryB = addDays(parseISO(b.event_date), 30);
      return expiryA - expiryB;
    });

  // Revenue calculations
  const totalRevenue = events
    .filter(event => event.advance_payment_status === 'paid')
    .reduce((sum, event) => sum + (event.total_deal_amount || 0), 0);

  const monthlyRevenue = events
    .filter(event => {
      if (!event.advance_payment_date) return false;
      const paymentDate = parseISO(event.advance_payment_date);
      return paymentDate >= startOfMonth(now) && paymentDate <= endOfMonth(now);
    })
    .reduce((sum, event) => sum + (event.total_deal_amount || 0), 0);

  const pendingRevenue = pendingPayments.reduce((sum, event) => sum + (event.total_deal_amount || 0), 0);

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 text-bordeaux animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600">טוען נתוני דשבורד...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-bordeaux">דשבורד מנהל</h1>
          <p className="text-gray-600 mt-1">סקירה כללית של המערכת והעסק</p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('AdminNotifications'))}
            className="relative"
          >
            <Bell className="w-4 h-4 ml-2" />
            התראות
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="אירועים פעילים"
          value={activeEvents.length}
          subtitle={`מתוך ${events.length} אירועים סה"כ`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="הכנסות כוללות"
          value={`₪${totalRevenue.toLocaleString()}`}
          subtitle="מאירועים ששולמו"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="תשלומים ממתינים"
          value={pendingPayments.length}
          subtitle={`₪${pendingRevenue.toLocaleString()} בהמתנה`}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="מדיה במערכת"
          value={mediaStats.total}
          subtitle={`${mediaStats.images} תמונות, ${mediaStats.videos} סרטונים`}
          icon={Camera}
          color="purple"
        />
      </div>

      {/* Revenue Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 ml-2" />
            התקדמות הכנסות חודשית
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>הכנסות החודש: ₪{monthlyRevenue.toLocaleString()}</span>
              <span>יעד חודשי: ₪50,000</span>
            </div>
            <Progress value={(monthlyRevenue / 50000) * 100} className="h-3" />
            <p className="text-xs text-gray-500">
              {((monthlyRevenue / 50000) * 100).toFixed(1)}% מהיעד החודשי
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 ml-2" />
                אירועים קרובים
              </div>
              <Badge variant="outline">{upcomingEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">אין אירועים קרובים</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <UpcomingEventCard
                    key={event.id}
                    event={event}
                    daysUntil={differenceInDays(parseISO(event.event_date), now)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 ml-2 text-orange-500" />
                אירועים עומדים לפוג
              </div>
              <Badge variant="destructive">{expiringEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">אין אירועים שעומדים לפוג השבוע</p>
            ) : (
              <div className="space-y-3">
                {expiringEvents.map(event => (
                  <ExpiringEventCard
                    key={event.id}
                    event={event}
                    daysUntilExpiry={differenceInDays(addDays(parseISO(event.event_date), 30), now)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expired Events Section */}
      {expiredEventsCalculated.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Archive className="w-5 h-5 ml-2 text-red-500" />
                אירועים שפג תוקפם - מוכנים למחיקה
              </div>
              <Badge variant="destructive">{expiredEventsCalculated.length}</Badge>
            </CardTitle>
            <p className="text-sm text-red-600 mt-2">
              אירועים אלה עברו יותר מחודש מתאריך האירוע ומוכנים למחיקה. 
              <strong> וודא שהלקוחות שמרו את המדיה לפני המחיקה!</strong>
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiredEventsCalculated.slice(0, 10).map(event => (
                <ExpiredEventCard
                  key={event.id}
                  event={event}
                  onDelete={deleteExpiredEvent}
                />
              ))}
            </div>
            {expiredEventsCalculated.length > 10 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                ועוד {expiredEventsCalculated.length - 10} אירועים נוספים...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 ml-2" />
            פעילות אחרונה
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">אין התראות אחרונות</p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map(notification => (
                <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className={`w-2 h-2 rounded-full ${notification.is_read ? 'bg-gray-400' : 'bg-bordeaux'}`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {notification.title || (notification.notification_type === 'new_event' ? 'אירוע חדש נוצר' : 'אירוע עודכן')}: {notification.event_name}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(parseISO(notification.created_at), 'PPp', { locale: he })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(createPageUrl(`EditEvent?id=${notification.event_id}`))}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automatic Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 ml-2" />
            מיילים אוטומטיים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🤖 הפעלת כל המיילים האוטומטיים</h4>
              <p className="text-sm text-blue-700 mb-3">
                בודק ושולח אלבומים אישיים (24 שעות אחרי אירוע) והתראות מחיקה (13 יום אחרי אירוע)
              </p>
              <Button 
                onClick={handleRunAllAutomaticEmails}
                disabled={emailOperations.isRunningAll}
                className="w-full"
              >
                {emailOperations.isRunningAll ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מפעיל מיילים...
                  </>
                ) : (
                  '🚀 הפעל כל המיילים האוטומטיים'
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">📸 אלבומים אישיים</h4>
                <p className="text-sm text-green-700 mb-3">
                  שליחת אלבומים אישיים 24 שעות אחרי אירועים
                </p>
                <Button 
                  onClick={handleRunPersonalAlbumEmails}
                  disabled={emailOperations.isRunningPersonal}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {emailOperations.isRunningPersonal ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    'שלח אלבומים אישיים'
                  )}
                </Button>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">⚠️ התראות מחיקה</h4>
                <p className="text-sm text-red-700 mb-3">
                  התראות מחיקה 13 יום אחרי אירועים
                </p>
                <Button 
                  onClick={handleRunDeletionWarnings}
                  disabled={emailOperations.isRunningDeletion}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {emailOperations.isRunningDeletion ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    'שלח התראות מחיקה'
                  )}
                </Button>
              </div>
            </div>

            {emailOperations.lastResults && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📊 תוצאות אחרונות</h4>
                <div className="text-sm text-gray-700">
                  <p>• {emailOperations.lastResults.personalAlbums} מיילים אישיים נשלחו</p>
                  <p>• {emailOperations.lastResults.deletionWarnings} התראות מחיקה נשלחו</p>
                  <p className="text-xs text-gray-500 mt-2">
                    עדכון אחרון: {format(new Date(emailOperations.lastResults.timestamp), 'PPp', { locale: he })}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">💡 הגדרת הפעלה אוטומטית</h4>
              <p className="text-sm text-yellow-700">
                לביצוע אוטומטי יומי, הגדר Cron Job או Task Scheduler שיקרא ל-API endpoint או יפעיל את הפונקציות האלה.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Management - Admin Only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 ml-2" />
            ניהול תשלומים (מנהל בלבד)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">📊 סקירת תשלומים</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">תשלומים ממתינים:</p>
                  <p className="font-bold text-lg text-blue-900">{pendingPayments.length}</p>
                </div>
                <div>
                  <p className="text-blue-700">סכום בהמתנה:</p>
                  <p className="font-bold text-lg text-blue-900">₪{pendingRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            {pendingPayments.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-3">⏳ אירועים הממתינים לאישור תשלום</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pendingPayments.slice(0, 10).map(event => (
                    <div key={event.id} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.name}</p>
                        <p className="text-sm text-gray-600">
                          {event.event_date ? format(parseISO(event.event_date), 'PPP', { locale: he }) : 'ללא תאריך'}
                        </p>
                        <p className="text-sm text-yellow-700">
                          סכום: ₪{(event.total_deal_amount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {event.advance_payment_status === 'pending_payment' ? 'ממתין' : event.advance_payment_status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(createPageUrl(`EditEvent?id=${event.id}`))}
                          className="text-xs"
                        >
                          <Edit className="w-3 h-3 ml-1" />
                          עדכן סטטוס
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingPayments.length > 10 && (
                  <p className="text-xs text-yellow-600 mt-2 text-center">
                    מוצגים 10 מתוך {pendingPayments.length} אירועים
                  </p>
                )}
              </div>
            )}
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">💡 הוראות לעדכון תשלומים</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• לחץ על "עדכן סטטוס" ליד האירוע</li>
                <li>• בדף עריכת האירוע, שנה את סטטוס התשלום ל"שולם"</li>
                <li>• רק מנהלי המערכת יכולים לעדכן סטטוסי תשלום</li>
                <li>• לאחר עדכון ל"שולם", קודי הגישה יופיעו למארגן</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}