
import React, { useState, useEffect } from 'react';
import { Event } from '@/api/entities';
import { User } from '@/api/entities';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit3, Users, Eye, Copy, CalendarDays, AlertTriangle, CheckCircle, Clock, Sparkles, PackageOpen, Search as SearchIcon, LogIn, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from '@/lib/supabase';

const EventCard = ({ event, onDebug }) => {
  const navigate = useNavigate();

  const copyAccessCode = () => {
    if (event && event.access_code) {
      navigator.clipboard.writeText(event.access_code);
      window.showToast("success", "קוד הגישה הועתק!", `קוד: ${event.access_code}`);
    } else {
      window.showToast("error", "שגיאה בהעתקת קוד", "קוד הגישה לא זמין.");
    }
  };

  const handleEditClick = () => {
    if (!event || !event.id) {
        console.error("EventCard: event.id is missing, cannot navigate to EditEvent");
        if(window.showToast) window.showToast("error", "שגיאה בניווט", "לא ניתן לערוך אירוע ללא מזהה תקין.");
        return;
    }
    localStorage.setItem('currentEditingEventId', event.id);
    
    const editPageUrl = createPageUrl('EditEvent');
    const urlWithParams = `${editPageUrl}?id=${event.id}`; 
    console.log("Navigating to EditEvent with URL:", urlWithParams, "and localStorage ID:", event.id);
    navigate(urlWithParams);
  };

  const eventDateFormatted = event.event_date ? format(new Date(event.event_date), 'PPP', { locale: he }) : 'לא צוין תאריך';
  const cardBgGradient = "from-[#F5F5DC]/50 to-[#FFF8E7]/50 dark:from-gray-800/50 dark:to-gray-700/50";
  const headerImageDefaultBg = "from-[#8c2b2d] via-[#5C1A1B] to-[#4a1516] dark:from-[#9a3336] dark:via-[#7a2425] dark:to-[#5C1A1B]";

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 hover:scale-[1.02] active:scale-[0.98] rounded-2xl">
      <CardHeader className="p-0 relative">
        {event.cover_image_url ? (
          <div className="relative">
            <img 
              src={event.cover_image_url} 
              alt={event.name} 
              className="w-full h-48 sm:h-56 object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 rtl:right-4 rtl:left-auto">
              <div className="bg-black/30 backdrop-blur-md rounded-xl px-3 py-1 border border-white/20">
                <span className="text-white text-sm font-medium flex items-center">
                  <CalendarDays className="w-4 h-4 ml-1 rtl:mr-1 rtl:ml-0" />
                  {eventDateFormatted}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className={`w-full h-48 sm:h-56 bg-gradient-to-br ${headerImageDefaultBg} flex items-center justify-center relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <CalendarDays className="w-20 h-20 text-white/70" />
            <div className="absolute bottom-4 left-4 rtl:right-4 rtl:left-auto">
              <div className="bg-black/30 backdrop-blur-md rounded-xl px-3 py-1 border border-white/20">
                <span className="text-white text-sm font-medium flex items-center">
                  <CalendarDays className="w-4 h-4 ml-1 rtl:mr-1 rtl:ml-0" />
                  {eventDateFormatted}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 rtl:right-4 rtl:left-auto">
          <div className="bg-white/90 dark:bg-gray-700/90 backdrop-blur-md rounded-full p-2 shadow-lg">
            <Sparkles className="w-5 h-5 text-yellow-500" /> 
          </div>
        </div>
      </CardHeader>

      <CardContent className={`p-4 sm:p-6 bg-gradient-to-br ${cardBgGradient}`}>
        <CardTitle className="text-xl sm:text-2xl font-bold text-bordeaux dark:text-[#d4a574] mb-2 line-clamp-2"> 
          {event.name}
        </CardTitle>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#5C1A1B]/5 dark:bg-bordeaux/10 rounded-xl border border-[#5C1A1B]/10 dark:border-bordeaux/20">
            <div className="flex items-center">
              <Users className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
              <span className="text-sm font-medium text-[#4a1516] dark:text-gray-300">קוד גישה:</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="font-mono text-lg font-bold text-[#5C1A1B] dark:text-[#d4a574] bg-white dark:bg-gray-700 px-3 py-1 rounded-lg shadow-sm border border-[#5C1A1B]/20 dark:border-bordeaux/30">
                {event.access_code}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={copyAccessCode} 
                className="h-10 w-10 rounded-lg hover:bg-[#5C1A1B]/10 dark:hover:bg-bordeaux/20 active:scale-95 transition-all"
              >
                <Copy className="w-5 h-5 text-bordeaux dark:text-[#d4a574]" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            {event.advance_payment_status === 'paid' ? (
              <>
                <CheckCircle className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">אירוע פעיל</span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">ממתין להפעלה</span>
              </>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className={`p-4 sm:p-6 bg-gray-100/60 dark:bg-gray-700/60 border-t border-gray-200/50 dark:border-gray-600/50`}>
        <div className="w-full">
          <Button 
            variant="outline" 
            onClick={handleEditClick}
            className="btn-outline-bordeaux h-12 rounded-xl font-medium transition-all active:scale-95 w-full"
          >
            <Edit3 className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
            עריכה וניהול
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default function MyEventsPage() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({ paid: false, unpaid: false, upcoming: false, past: false });

  const showToast = (type, title, description) => {
    if (window.showToast) {
      window.showToast(type, title, description);
    } else {
      console.warn(`Toast fallback: ${type} - ${title} - ${description}`);
    }
  };
  
  // This page is now protected by Layout.js, so we can assume a user exists.
  useEffect(() => {
    const fetchUserDataAndEvents = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        fetchEvents(currentUser);
      } catch (error) {
        // This case should be handled by Layout.js which redirects to Home.
        console.error("User check failed on MyEvents, should have been redirected.");
        navigate(createPageUrl('Home'));
      }
    };
    fetchUserDataAndEvents();
  }, []); // Run only once on mount

  useEffect(() => {
    if(user) { 
      fetchEvents(user);
    }
  }, [searchTerm, activeFilters, user]);

  const fetchEvents = async (currentUser) => {
    if (!currentUser || !currentUser.email) {
      showToast("warn", "משתמש לא מאומת", "לא ניתן לטעון אירועים.");
      return;
    }

    try {
      let fetchedEvents;

      if (currentUser.role === 'admin') {
        fetchedEvents = await Event.list('-created_at');
      } else {
        fetchedEvents = await Event.filter({ created_by: currentUser.id }, '-created_at');
      }

      if (searchTerm) {
        fetchedEvents = fetchedEvents.filter(event =>
          event.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0); 

      fetchedEvents = fetchedEvents.filter(event => {
        const eventDate = event.event_date ? new Date(event.event_date) : null;
        if (eventDate) eventDate.setHours(0,0,0,0);

        let keep = true;
        if (activeFilters.upcoming && (!eventDate || eventDate <= now)) keep = false;
        if (activeFilters.past && (!eventDate || eventDate > now)) keep = false;
        
        return keep;
      });
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      showToast("error", "שגיאה בטעינת אירועים", error.message);
    }
  };
  
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק אירוע זה? פעולה זו אינה הפיכה.")) {
      try {
        await Event.delete(eventId);
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        showToast("success", "האירוע נמחק בהצלחה!");
      } catch (error) {
        console.error("Error deleting event:", error);
        showToast("error", "שגיאה במחיקת האירוע", error.message);
      }
    }
  };


  const debugEventDeletion = async (eventId) => {
    if (!user?.role === 'admin') {
      showToast("error", "גישה נדחתה", "רק מנהלים יכולים לבצע ניפוי שגיאות.");
      return;
    }

    try {
      console.log(`🔍 Debugging deletion for event: ${eventId}`);
      
      // Check if event exists
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (eventError) {
        console.error('Event check error:', eventError);
        showToast("error", "בדיקת אירוע נכשלה", eventError.message);
        return;
      }
      
      console.log('Event data:', event);
      
      // Check related data
      const tables = ['notifications', 'media_items', 'highlight_categories'];
      
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);
          
          if (error) {
            console.error(`${table} count error:`, error);
          } else {
            console.log(`${table}: ${count} records`);
          }
        } catch (e) {
          console.error(`${table} exception:`, e);
        }
      }
      
      // Try to check guest_wishes (might not exist)
      try {
        const { count, error } = await supabase
          .from('guest_wishes')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);
        
        if (error) {
          console.error('guest_wishes count error:', error);
        } else {
          console.log(`guest_wishes: ${count} records`);
        }
      } catch (e) {
        console.error('guest_wishes exception (table might not exist):', e);
      }
      
      showToast("info", "ניפוי שגיאות הושלם", "בדוק את הקונסול לפרטים מלאים");
      
    } catch (error) {
      console.error("Error in debug:", error);
      showToast("error", "שגיאה בניפוי שגיאות", error.message);
    }
  };
  
  const filteredAndSortedEvents = [...events].sort((a, b) => {
    const dateA = a.event_date ? new Date(a.event_date) : 0;
    const dateB = b.event_date ? new Date(b.event_date) : 0;
    return dateB - dateA; // Sort descending by date (newest first)
  });

  if (!user) {
    // Show a loader while the initial user check (and potential redirect) happens.
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#FEFBF3] to-[#F8F4E6]">
            <Loader2 className="w-12 h-12 text-bordeaux animate-spin" />
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <div className="p-4 md:p-8 flex-grow">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-bordeaux dark:text-[#d4a574]">האירועים שלי</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-lg">נהל את כל אירועי הזיכרונות שלך במקום אחד</p>
          </div>
        </div>

        {/* Search and Filter UI */}
        <div className="mb-6 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-1/2">
            <input
              type="search"
              placeholder="חפש אירועים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-bordeaux focus:border-bordeaux transition-shadow shadow-sm"
            />
            {/* Right side icon for RTL */}
            <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto flex items-center pl-3 rtl:pr-3 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Button variant="outline" size="sm" className={`rounded-full ${activeFilters.upcoming ? 'bg-bordeaux/10 border-bordeaux text-bordeaux' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`} onClick={() => setActiveFilters({...activeFilters, upcoming: !activeFilters.upcoming})}>
              עתידיים
            </Button>
            <Button variant="outline" size="sm" className={`rounded-full ${activeFilters.past ? 'bg-bordeaux/10 border-bordeaux text-bordeaux' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`} onClick={() => setActiveFilters({...activeFilters, past: !activeFilters.past})}>
              היסטוריים
            </Button>
          </div>
        </div>
        
        {filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-12">
            <PackageOpen className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">לא נמצאו אירועים</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || Object.values(activeFilters).some(v => v) ? "נסה להסיר חלק מהמסננים או לשנות את מונח החיפוש." : "עדיין לא יצרת אירועים. לחץ על 'צור אירוע חדש' כדי להתחיל."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
            {filteredAndSortedEvents.map(event => <EventCard key={event.id} event={event} onDelete={() => handleDeleteEvent(event.id)} onDebug={() => debugEventDeletion(event.id)} />)}
          </div>
        )}
      </div>
      

      {/* "Create Event" FAB with text for all screen sizes */}
      <div className="fixed bottom-8 right-8 rtl:left-8 rtl:right-auto z-50">
         <Button 
            onClick={() => navigate(createPageUrl('CreateEvent'))} 
            className="btn-bordeaux h-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 flex items-center justify-center px-5 gap-2"
            aria-label="צור אירוע חדש"
            title="צור אירוע חדש"
          >
            <PlusCircle className="h-6 w-6" />
            <span className="font-semibold text-md">צור אירוע חדש</span>
        </Button>
      </div>
    </div>
  );
}
