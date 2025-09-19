import React, { useState } from 'react';
import { Event } from '@/api/entities';
import { MediaItem } from '@/api/entities';
import { GuestWish } from '@/api/entities';
import { HighlightCategory } from '@/api/entities';
import { EventNotification } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

const EventCleanupManager = ({ expiredEvents, onEventsDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  const deleteEventCompletely = async (eventId) => {
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
      
      const notifications = await EventNotification.filter({ event_id: eventId });
      for (const notification of notifications) {
        await EventNotification.delete(notification.id);
      }
      
      // Finally delete the event itself
      await Event.delete(eventId);
      
      return true;
    } catch (error) {
      console.error(`Error deleting event ${eventId}:`, error);
      return false;
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEvents.length === 0) {
      setDeletionStatus({ type: 'error', message: 'לא נבחרו אירועים למחיקה' });
      return;
    }

    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק ${selectedEvents.length} אירועים לצמיתות?\n\n` +
      'פעולה זו תמחק:\n' +
      '• את האירועים עצמם\n' +
      '• את כל התמונות והסרטונים\n' +
      '• את כל הברכות מהאורחים\n' +
      '• את כל ההתראות הקשורות\n\n' +
      'פעולה זו לא ניתנת לביטול!'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setDeletionProgress(0);
    setDeletionStatus(null);

    let successCount = 0;
    let failedEvents = [];

    for (let i = 0; i < selectedEvents.length; i++) {
      const eventId = selectedEvents[i];
      const success = await deleteEventCompletely(eventId);
      
      if (success) {
        successCount++;
      } else {
        const event = expiredEvents.find(e => e.id === eventId);
        failedEvents.push(event?.name || eventId);
      }

      setDeletionProgress(((i + 1) / selectedEvents.length) * 100);
    }

    setIsDeleting(false);
    setSelectedEvents([]);

    if (failedEvents.length === 0) {
      setDeletionStatus({
        type: 'success',
        message: `${successCount} אירועים נמחקו בהצלחה!`
      });
    } else {
      setDeletionStatus({
        type: 'partial',
        message: `${successCount} אירועים נמחקו בהצלחה. ${failedEvents.length} אירועים נכשלו: ${failedEvents.join(', ')}`
      });
    }

    // Notify parent component to refresh
    if (onEventsDeleted) {
      onEventsDeleted();
    }
  };

  const toggleEventSelection = (eventId) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const selectAllEvents = () => {
    setSelectedEvents(expiredEvents.map(event => event.id));
  };

  const deselectAllEvents = () => {
    setSelectedEvents([]);
  };

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trash2 className="w-5 h-5 ml-2 text-red-500" />
          ניהול מחיקת אירועים פגי תוקף
        </CardTitle>
        <CardDescription className="text-red-600">
          אירועים שעברו יותר מחודש מתאריך האירוע. וודא שהלקוחות שמרו את המדיה!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {expiredEvents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">אין אירועים פגי תוקף</h3>
            <p className="text-gray-500">כל האירועים במערכת עדיין בתוקף.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-x-2 rtl:space-x-reverse">
                <Button onClick={selectAllEvents} variant="outline" size="sm">
                  בחר הכל ({expiredEvents.length})
                </Button>
                <Button onClick={deselectAllEvents} variant="outline" size="sm">
                  בטל בחירה
                </Button>
              </div>
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                disabled={selectedEvents.length === 0 || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    מוחק...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 ml-2" />
                    מחק נבחרים ({selectedEvents.length})
                  </>
                )}
              </Button>
            </div>

            {isDeleting && (
              <div className="space-y-2">
                <Progress value={deletionProgress} className="w-full" />
                <p className="text-sm text-gray-600 text-center">
                  מוחק אירועים... {Math.round(deletionProgress)}%
                </p>
              </div>
            )}

            {deletionStatus && (
              <Alert variant={deletionStatus.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>
                  {deletionStatus.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {expiredEvents.map(event => {
                const expiredDays = Math.abs(differenceInDays(addDays(parseISO(event.event_date), 30), new Date()));
                return (
                  <div
                    key={event.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEvents.includes(event.id)
                        ? 'bg-red-100 border-red-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleEventSelection(event.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{event.name}</h4>
                        <p className="text-sm text-gray-500">
                          תאריך אירוע: {format(parseISO(event.event_date), 'PPP', { locale: he })}
                        </p>
                        <p className="text-xs text-red-600">
                          פג לפני {expiredDays} ימים
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event.id)}
                          onChange={() => toggleEventSelection(event.id)}
                          className="w-4 h-4 text-red-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCleanupManager;