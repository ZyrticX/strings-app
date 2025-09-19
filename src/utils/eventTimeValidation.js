import { isAfter, isBefore, addDays, addHours, parseISO, isValid } from 'date-fns';

/**
 * Event time validation utilities
 */

// Constants
export const UPLOAD_WINDOW_HOURS = 24; // 24 hours after event starts
export const AUTO_DELETE_DAYS = 14; // 14 days after event ends

/**
 * Check if event upload window is active (24 hours from event start)
 * @param {Object} event - Event object with event_date and start_time
 * @returns {Object} - { canUpload: boolean, reason: string, timeRemaining?: string }
 */
export const checkUploadWindow = (event) => {
  if (!event?.event_date) {
    return { canUpload: false, reason: 'תאריך האירוע לא מוגדר' };
  }

  try {
    // Parse event date and time
    const eventDate = parseISO(event.event_date);
    if (!isValid(eventDate)) {
      return { canUpload: false, reason: 'תאריך האירוע לא תקין' };
    }

    // If there's a start time, add it to the date
    let eventStartTime = eventDate;
    if (event.start_time) {
      const [hours, minutes] = event.start_time.split(':').map(Number);
      eventStartTime = new Date(eventDate);
      eventStartTime.setHours(hours || 0, minutes || 0, 0, 0);
    }

    const now = new Date();
    const uploadWindowEnd = addHours(eventStartTime, UPLOAD_WINDOW_HOURS);
    
    // Check if event has started
    if (isBefore(now, eventStartTime)) {
      const timeUntilStart = Math.ceil((eventStartTime - now) / (1000 * 60 * 60)); // hours
      const formattedTime = formatTimeRemaining(timeUntilStart);
      
      return { 
        canUpload: false, 
        reason: 'יהיה ניתן להעלות תמונות 24 שעות מתחילת האירוע!',
        timeRemaining: formattedTime,
        eventStartTime: eventStartTime
      };
    }
    
    // Check if upload window has ended
    if (isAfter(now, uploadWindowEnd)) {
      return { 
        canUpload: false, 
        reason: 'חלון ההעלאה נסגר (24 שעות מתחילת האירוע)'
      };
    }
    
    // Upload window is active
    const timeRemaining = Math.ceil((uploadWindowEnd - now) / (1000 * 60 * 60)); // hours
    return { 
      canUpload: true, 
      reason: 'ניתן להעלות תמונות',
      timeRemaining: timeRemaining > 1 ? `${timeRemaining} שעות` : 'פחות משעה'
    };
    
  } catch (error) {
    console.error('Error checking upload window:', error);
    return { canUpload: false, reason: 'שגיאה בבדיקת חלון ההעלאה' };
  }
};

/**
 * Check if event should be auto-deleted (14 days after event end)
 * @param {Object} event - Event object with event_date
 * @returns {Object} - { shouldDelete: boolean, daysUntilDeletion?: number, deletionDate?: Date }
 */
export const checkEventDeletion = (event) => {
  if (!event?.event_date) {
    return { shouldDelete: false };
  }

  try {
    const eventDate = parseISO(event.event_date);
    if (!isValid(eventDate)) {
      return { shouldDelete: false };
    }

    // Assume event ends at 23:59 on the event date
    const eventEndTime = new Date(eventDate);
    eventEndTime.setHours(23, 59, 59, 999);
    
    const deletionDate = addDays(eventEndTime, AUTO_DELETE_DAYS);
    const now = new Date();
    
    if (isAfter(now, deletionDate)) {
      return { shouldDelete: true, deletionDate };
    }
    
    const daysUntilDeletion = Math.ceil((deletionDate - now) / (1000 * 60 * 60 * 24));
    return { 
      shouldDelete: false, 
      daysUntilDeletion,
      deletionDate 
    };
    
  } catch (error) {
    console.error('Error checking event deletion:', error);
    return { shouldDelete: false };
  }
};

/**
 * Get event status summary
 * @param {Object} event - Event object
 * @returns {Object} - Complete status info
 */
export const getEventStatus = (event) => {
  const uploadStatus = checkUploadWindow(event);
  const deletionStatus = checkEventDeletion(event);
  
  return {
    upload: uploadStatus,
    deletion: deletionStatus,
    event
  };
};

/**
 * Format time remaining for display
 * @param {number} hours - Hours remaining
 * @returns {string} - Formatted string
 */
export const formatTimeRemaining = (hours) => {
  if (hours < 1) return 'פחות משעה';
  if (hours < 24) return `${Math.ceil(hours)} שעות`;
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) {
    return `${days} ימים`;
  }
  
  return `${days} ימים ו-${Math.ceil(remainingHours)} שעות`;
};
