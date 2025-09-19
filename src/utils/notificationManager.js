import { EventNotification } from '@/api/entities';
import { User } from '@/api/entities';

/**
 * Central notification manager for sending notifications to admins
 */

/**
 * Send notification to all admins
 * @param {Object} notificationData - The notification data
 * @param {string} notificationData.type - Type of notification (new_event, payment_reminder, event_update, new_media)
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.event_id - Related event ID (optional)
 * @param {string} notificationData.event_name - Related event name (optional)
 * @param {Object} notificationData.event_details - Additional event details (optional)
 * @param {string} notificationData.organizer_name - Event organizer name (optional)
 * @param {string} notificationData.organizer_email - Event organizer email (optional)
 * @param {string} notificationData.organizer_phone - Event organizer phone (optional)
 */
export const sendAdminNotification = async (notificationData) => {
  try {
    console.log('📢 Sending admin notification:', notificationData);
    
    // Get current user info
    const currentUser = await User.me();
    console.log('👤 Current user for notification:', currentUser);
    
    // Create the notification record
    const notification = {
      type: notificationData.type || 'event_update',
      notification_type: notificationData.type || 'event_update',
      title: notificationData.title,
      message: notificationData.message,
      event_id: notificationData.event_id || null,
      event_name: notificationData.event_name || null,
      event_details: notificationData.event_details || null,
      organizer_name: notificationData.organizer_name || currentUser?.full_name || 'משתמש לא ידוע',
      organizer_email: notificationData.organizer_email || currentUser?.email || null,
      organizer_phone: notificationData.organizer_phone || null,
      access_code: notificationData.access_code || null,
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    console.log('📋 Notification object to save:', notification);
    
    // Save notification to database
    const savedNotification = await EventNotification.create(notification);
    console.log('✅ Notification saved to database:', savedNotification);
    
    return savedNotification;
    
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    console.error('Error details:', error.message, error.details);
    throw error;
  }
};

/**
 * Send notification when a new event is created
 */
export const notifyEventCreated = async (event, organizer) => {
  // Format event date for display
  const eventDate = event.event_date || event.date;
  const formattedEventDate = eventDate ? new Date(eventDate).toLocaleDateString('he-IL') : 'לא צוין';
  
  // Get event type in Hebrew
  const eventTypeMap = {
    'wedding': 'חתונה',
    'bar_mitzvah': 'בר מצווה',
    'bat_mitzvah': 'בת מצווה',
    'birthday': 'יום הולדת',
    'corporate': 'אירוע עסקי',
    'other': 'אחר'
  };
  const eventTypeHebrew = eventTypeMap[event.event_type] || event.event_type || 'לא צוין';
  
  const notificationData = {
    type: 'new_event',
    title: 'אירוע חדש נוצר',
    message: `נוצר אירוע חדש: "${event.name}" | ${eventTypeHebrew} | ${formattedEventDate} | על ידי ${organizer.full_name || organizer.email}`,
    event_id: event.id,
    event_name: event.name,
    event_details: {
      date: eventDate,
      formatted_date: formattedEventDate,
      location: event.location_text || event.location,
      type: event.event_type,
      type_hebrew: eventTypeHebrew,
      guest_count: event.guest_count_estimate,
      total_amount: event.total_deal_amount,
      start_time: event.start_time,
      bracelets_count: event.bracelets_count
    },
    organizer_name: organizer.full_name || organizer.email,
    organizer_email: organizer.email,
    organizer_phone: organizer.organizer_phone || event.organizer_phone_number,
    access_code: event.access_code
  };
  
  return await sendAdminNotification(notificationData);
};

/**
 * Send notification when an event is updated
 */
export const notifyEventUpdated = async (event, organizer, changes = []) => {
  // Format event date for display
  const eventDate = event.event_date || event.date;
  const formattedEventDate = eventDate ? new Date(eventDate).toLocaleDateString('he-IL') : 'לא צוין';
  
  // Get event type in Hebrew
  const eventTypeMap = {
    'wedding': 'חתונה',
    'bar_mitzvah': 'בר מצווה',
    'bat_mitzvah': 'בת מצווה',
    'birthday': 'יום הולדת',
    'corporate': 'אירוע עסקי',
    'other': 'אחר'
  };
  const eventTypeHebrew = eventTypeMap[event.event_type] || event.event_type || 'לא צוין';
  
  const changesText = changes.length > 0 ? ` (שינויים: ${changes.join(', ')})` : '';
  
  const notificationData = {
    type: 'event_update',
    title: 'אירוע עודכן',
    message: `עודכן: "${event.name}" | ${eventTypeHebrew} | ${formattedEventDate} | על ידי ${organizer.full_name || organizer.email}${changesText}`,
    event_id: event.id,
    event_name: event.name,
    event_details: {
      date: eventDate,
      formatted_date: formattedEventDate,
      location: event.location_text || event.location,
      type: event.event_type,
      type_hebrew: eventTypeHebrew,
      changes: changes,
      start_time: event.start_time,
      bracelets_count: event.bracelets_count
    },
    organizer_name: organizer.full_name || organizer.email,
    organizer_email: organizer.email,
    organizer_phone: organizer.organizer_phone || event.organizer_phone_number
  };
  
  return await sendAdminNotification(notificationData);
};

/**
 * Send notification when an event is deleted
 */
export const notifyEventDeleted = async (event, organizer) => {
  // Format event date for display
  const eventDate = event.event_date || event.date;
  const formattedEventDate = eventDate ? new Date(eventDate).toLocaleDateString('he-IL') : 'לא צוין';
  
  // Get event type in Hebrew
  const eventTypeMap = {
    'wedding': 'חתונה',
    'bar_mitzvah': 'בר מצווה',
    'bat_mitzvah': 'בת מצווה',
    'birthday': 'יום הולדת',
    'corporate': 'אירוע עסקי',
    'other': 'אחר'
  };
  const eventTypeHebrew = eventTypeMap[event.event_type] || event.event_type || 'לא צוין';
  
  const notificationData = {
    type: 'event_deleted',
    title: 'אירוע נמחק',
    message: `נמחק: "${event.name}" | ${eventTypeHebrew} | ${formattedEventDate} | על ידי ${organizer.full_name || organizer.email}`,
    event_id: event.id,
    event_name: event.name,
    event_details: {
      deleted_at: new Date().toISOString(),
      date: eventDate,
      formatted_date: formattedEventDate,
      location: event.location_text || event.location,
      type: event.event_type,
      type_hebrew: eventTypeHebrew,
      start_time: event.start_time,
      bracelets_count: event.bracelets_count
    },
    organizer_name: organizer.full_name || organizer.email,
    organizer_email: organizer.email,
    organizer_phone: organizer.organizer_phone || event.organizer_phone_number
  };
  
  return await sendAdminNotification(notificationData);
};

/**
 * Send notification when payment is required
 */
export const notifyPaymentRequired = async (event, organizer) => {
  // Format event date for display
  const eventDate = event.event_date || event.date;
  const formattedEventDate = eventDate ? new Date(eventDate).toLocaleDateString('he-IL') : 'לא צוין';
  
  // Get event type in Hebrew
  const eventTypeMap = {
    'wedding': 'חתונה',
    'bar_mitzvah': 'בר מצווה',
    'bat_mitzvah': 'בת מצווה',
    'birthday': 'יום הולדת',
    'corporate': 'אירוע עסקי',
    'other': 'אחר'
  };
  const eventTypeHebrew = eventTypeMap[event.event_type] || event.event_type || 'לא צוין';
  
  const notificationData = {
    type: 'payment_reminder',
    title: 'נדרש תשלום מקדמה',
    message: `נדרש תשלום: "${event.name}" | ${eventTypeHebrew} | ${formattedEventDate} | מקדמה: ₪${event.advance_payment_amount || 'לא צוין'}`,
    event_id: event.id,
    event_name: event.name,
    event_details: {
      date: eventDate,
      formatted_date: formattedEventDate,
      type: event.event_type,
      type_hebrew: eventTypeHebrew,
      total_amount: event.total_deal_amount,
      advance_amount: event.advance_payment_amount,
      payment_status: event.advance_payment_status,
      start_time: event.start_time,
      bracelets_count: event.bracelets_count
    },
    organizer_name: organizer.full_name || organizer.email,
    organizer_email: organizer.email,
    organizer_phone: organizer.organizer_phone || event.organizer_phone_number,
    access_code: event.access_code
  };
  
  return await sendAdminNotification(notificationData);
};

/**
 * Send notification when payment is completed
 */
export const notifyPaymentCompleted = async (event, organizer) => {
  // Format event date for display
  const eventDate = event.event_date || event.date;
  const formattedEventDate = eventDate ? new Date(eventDate).toLocaleDateString('he-IL') : 'לא צוין';
  
  // Get event type in Hebrew
  const eventTypeMap = {
    'wedding': 'חתונה',
    'bar_mitzvah': 'בר מצווה',
    'bat_mitzvah': 'בת מצווה',
    'birthday': 'יום הולדת',
    'corporate': 'אירוע עסקי',
    'other': 'אחר'
  };
  const eventTypeHebrew = eventTypeMap[event.event_type] || event.event_type || 'לא צוין';
  
  const notificationData = {
    type: 'payment_completed',
    title: 'תשלום מקדמה התקבל',
    message: `תשלום התקבל: "${event.name}" | ${eventTypeHebrew} | ${formattedEventDate} | סכום: ₪${event.advance_payment_amount || 'לא צוין'}`,
    event_id: event.id,
    event_name: event.name,
    event_details: {
      date: eventDate,
      formatted_date: formattedEventDate,
      type: event.event_type,
      type_hebrew: eventTypeHebrew,
      total_amount: event.total_deal_amount,
      advance_amount: event.advance_payment_amount,
      payment_status: 'completed',
      start_time: event.start_time,
      bracelets_count: event.bracelets_count
    },
    organizer_name: organizer.full_name || organizer.email,
    organizer_email: organizer.email,
    organizer_phone: organizer.organizer_phone || event.organizer_phone_number,
    access_code: event.access_code
  };
  
  return await sendAdminNotification(notificationData);
};

/**
 * Send notification when new media is uploaded
 */
export const notifyNewMediaUploaded = async (event, uploaderName, mediaCount) => {
  const notificationData = {
    type: 'new_media',
    title: 'תמונות חדשות הועלו',
    message: `${uploaderName} העלה ${mediaCount} תמונות חדשות לאירוע "${event.name}"`,
    event_id: event.id,
    event_name: event.name,
    event_details: {
      uploader_name: uploaderName,
      media_count: mediaCount,
      date: new Date().toISOString()
    },
    organizer_name: event.organizer_name,
    organizer_email: event.organizer_email,
    access_code: event.access_code
  };
  
  return await sendAdminNotification(notificationData);
};

/**
 * Send notification when event is about to start (24 hours before)
 */
export const notifyEventStartingSoon = async (event, organizer) => {
  const notificationData = {
    type: 'event_starting_soon',
    title: 'האירוע מתחיל מחר',
    message: `האירוע "${event.name}" מתחיל מחר! וודא שהכל מוכן.`,
    event_id: event.id,
    event_name: event.name,
    event_details: {
      date: event.event_date,
      location: event.location_text,
      guest_count: event.guest_count_estimate
    },
    organizer_name: organizer.full_name || organizer.email,
    organizer_email: organizer.email,
    organizer_phone: organizer.organizer_phone || event.organizer_phone_number,
    access_code: event.access_code
  };
  
  return await sendAdminNotification(notificationData);
};

/**
 * Send notification for payment related events
 */
export const notifyPaymentEvent = async (event, organizer, paymentType, amount) => {
  const notificationData = {
    type: 'payment_reminder',
    title: `עדכון תשלום - ${event.name}`,
    message: `${paymentType} בסך ${amount}₪ עבור האירוע "${event.name}"`,
    event_id: event.id,
    event_name: event.name,
    event_details: {
      payment_type: paymentType,
      amount: amount,
      payment_time: new Date().toISOString()
    },
    organizer_name: organizer.full_name || organizer.email,
    organizer_email: organizer.email,
    organizer_phone: organizer.organizer_phone || event.organizer_phone_number
  };
  
  return await sendAdminNotification(notificationData);
};

// Backward compatibility aliases
export const notifyMediaUploaded = notifyNewMediaUploaded;