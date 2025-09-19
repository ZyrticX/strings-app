import { Event, MediaItem, HighlightCategory } from '@/api/entities';
import { checkEventDeletion } from './eventTimeValidation';

/**
 * Event cleanup utilities for automatic deletion
 */

/**
 * Clean up expired events (14 days after event end)
 * This would typically run as a scheduled job or cron task
 * @param {boolean} dryRun - If true, only logs what would be deleted without actually deleting
 * @returns {Object} - Summary of cleanup operation
 */
export const cleanupExpiredEvents = async (dryRun = false) => {
  console.log(`🧹 Starting event cleanup ${dryRun ? '(DRY RUN)' : ''}`);
  
  const summary = {
    eventsChecked: 0,
    eventsDeleted: 0,
    mediaDeleted: 0,
    categoriesDeleted: 0,
    errors: []
  };

  try {
    // Get all events
    const allEvents = await Event.list();
    summary.eventsChecked = allEvents.length;
    
    console.log(`📊 Found ${allEvents.length} events to check`);

    for (const event of allEvents) {
      try {
        const deletionStatus = checkEventDeletion(event);
        
        if (deletionStatus.shouldDelete) {
          console.log(`🗑️ Event "${event.name}" should be deleted (expired on ${deletionStatus.deletionDate})`);
          
          if (!dryRun) {
            // Delete related media items first
            const mediaItems = await MediaItem.filter({ event_id: event.id });
            for (const media of mediaItems) {
              await MediaItem.delete(media.id);
              summary.mediaDeleted++;
            }
            
            // Delete highlight categories
            const categories = await HighlightCategory.filter({ event_id: event.id });
            for (const category of categories) {
              await HighlightCategory.delete(category.id);
              summary.categoriesDeleted++;
            }
            
            // Finally delete the event
            await Event.delete(event.id);
            summary.eventsDeleted++;
            
            console.log(`✅ Successfully deleted event "${event.name}" and all related data`);
          } else {
            summary.eventsDeleted++; // Count what would be deleted
            console.log(`🔍 Would delete event "${event.name}"`);
          }
        } else if (deletionStatus.daysUntilDeletion <= 7) {
          // Warn about events that will be deleted soon
          console.log(`⚠️ Event "${event.name}" will be deleted in ${deletionStatus.daysUntilDeletion} days`);
        }
      } catch (error) {
        const errorMsg = `Error processing event "${event.name}": ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        summary.errors.push(errorMsg);
      }
    }
    
  } catch (error) {
    const errorMsg = `Error fetching events: ${error.message}`;
    console.error(`❌ ${errorMsg}`);
    summary.errors.push(errorMsg);
  }

  console.log(`📋 Cleanup summary:`, summary);
  return summary;
};

/**
 * Check if a specific event should be deleted
 * @param {string} eventId - Event ID to check
 * @returns {Object} - Deletion status and info
 */
export const checkEventForDeletion = async (eventId) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return { error: 'Event not found' };
    }
    
    const deletionStatus = checkEventDeletion(event);
    return {
      event,
      ...deletionStatus
    };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Get events that are close to deletion (within 7 days)
 * @returns {Array} - Events with deletion warning
 */
export const getEventsNearDeletion = async () => {
  try {
    const allEvents = await Event.list();
    const warningEvents = [];
    
    for (const event of allEvents) {
      const deletionStatus = checkEventDeletion(event);
      
      if (!deletionStatus.shouldDelete && deletionStatus.daysUntilDeletion <= 7) {
        warningEvents.push({
          ...event,
          daysUntilDeletion: deletionStatus.daysUntilDeletion,
          deletionDate: deletionStatus.deletionDate
        });
      }
    }
    
    return warningEvents;
  } catch (error) {
    console.error('Error getting events near deletion:', error);
    return [];
  }
};
