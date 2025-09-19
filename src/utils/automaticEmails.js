import { Event, MediaItem, User } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { showToast } from './toast';

/**
 * מיילים אוטומטיים למערכת STRINGS
 */

const STRINGS_ADMIN_EMAIL = "stringsalbumapp@gmail.com";

/**
 * שולח מייל אלבום אישי לאורח 24 שעות אחרי האירוע
 * @param {Object} event - פרטי האירוע
 * @param {Object} guest - פרטי האורח (name, email, mediaCount)
 * @param {Array} guestMedia - התמונות של האורח
 */
export const sendPersonalAlbumEmail = async (event, guest, guestMedia) => {
  try {
    console.log(`📧 Sending personal album email to ${guest.email} for event ${event.name}`);
    
    const eventDate = format(parseISO(event.event_date), 'PPP', { locale: he });
    const albumUrl = `${window.location.origin}/guest/${event.id}?email=${encodeURIComponent(guest.email)}`;
    
    // יצירת גלריה של התמונות
    const photosHtml = guestMedia.slice(0, 12).map(media => `
      <div style="display: inline-block; margin: 5px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <img src="${media.thumbnail_url || media.file_url}" alt="תמונה מהאירוע" style="width: 120px; height: 120px; object-fit: cover;" />
      </div>
    `).join('');
    
    const emailBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; max-width: 600px; margin: 0 auto; background-color: #FEFBF3; padding: 20px;">
        <div style="background: linear-gradient(135deg, #5C1A1B 0%, #8B2635 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">📸 האלבום האישי שלך מוכן!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">מאירוע: ${event.name}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #5C1A1B; margin-top: 0;">שלום ${guest.name}! 👋</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            תודה שהשתתפת באירוע "${event.name}" שהתקיים ב-${eventDate}!<br/>
            העלית <strong>${guest.mediaCount} תמונות</strong> מדהימות לאלבום, וכעת הן מוכנות לצפייה והורדה.
          </p>
        </div>

        <div style="background: #E3F2FD; border: 2px solid #2196F3; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
          <h3 style="color: #1565C0; margin-top: 0;">📱 התמונות שלך</h3>
          <div style="margin: 20px 0; text-align: center;">
            ${photosHtml}
            ${guestMedia.length > 12 ? `<p style="color: #666; font-size: 14px; margin-top: 10px;">ועוד ${guestMedia.length - 12} תמונות נוספות...</p>` : ''}
          </div>
          <div style="margin: 20px 0;">
            <a href="${albumUrl}" style="display: inline-block; background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🖼️ צפה בכל התמונות שלך
            </a>
          </div>
        </div>

        <div style="background: #FFF8E1; border: 2px solid #FF9800; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #E65100; margin-top: 0;">⏰ חשוב לדעת:</h4>
          <ul style="color: #BF360C; margin: 0; padding-right: 20px;">
            <li>התמונות יהיו זמינות להורדה עד 14 יום מתאריך האירוע</li>
            <li>לחץ על הקישור למעלה כדי לצפות ולהוריד את התמונות</li>
            <li>ניתן לשתף את הקישור עם משפחה וחברים</li>
          </ul>
        </div>

        <div style="background: #E8F5E8; border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h4 style="color: #2E7D32; margin-top: 0;">💚 תודה שהיית חלק מהאירוע!</h4>
          <p style="color: #388E3C; margin: 10px 0;">
            ${event.guest_thank_you_message || 'תודה רבה שבאת לחגוג איתנו! היה לנו אירוע מושלם בזכותך. מקווים שנהנית!'}
          </p>
        </div>

        <div style="background: #F0F0F0; border-radius: 8px; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <h4 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">יצירת קשר עם STRINGS</h4>
          <p style="margin: 5px 0;"><strong>WhatsApp:</strong> <a href="https://wa.me/972542565889" style="color: #5C1A1B; text-decoration: none;">054-2565889</a></p>
          <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:stringsalbumapp@gmail.com" style="color: #5C1A1B; text-decoration: none;">stringsalbumapp@gmail.com</a></p>
          <p style="margin: 5px 0;"><strong>Instagram:</strong> <a href="https://www.instagram.com/stringsalbum" target="_blank" style="color: #5C1A1B; text-decoration: none;">@stringsalbum</a></p>
        </div>
      </div>
    `;

    await SendEmail({
      to: guest.email,
      subject: `📸 האלבום האישי שלך מ"${event.name}" מוכן! (${guest.mediaCount} תמונות)`,
      body: emailBody,
    });

    console.log(`✅ Personal album email sent to ${guest.email}`);
    return { success: true, email: guest.email };

  } catch (error) {
    console.error(`❌ Error sending personal album email to ${guest.email}:`, error);
    return { success: false, email: guest.email, error: error.message };
  }
};

/**
 * שולח מיילים אוטומטיים 24 שעות אחרי אירוע לכל מי שהעלה תמונות
 * @param {string} eventId - מזהה האירוע (אופציונלי - אם לא מוגדר, בודק את כל האירועים)
 */
export const sendPostEventPersonalAlbums = async (eventId = null) => {
  try {
    console.log('🔍 Looking for events that need post-event personal album emails...');
    
    let eventsToCheck = [];
    
    if (eventId) {
      // בדיקת אירוע ספציפי
      const event = await Event.get(eventId);
      if (event) eventsToCheck.push(event);
    } else {
      // בדיקת כל האירועים
      const allEvents = await Event.list();
      eventsToCheck = allEvents || [];
    }

    const results = [];
    const now = new Date();

    for (const event of eventsToCheck) {
      if (!event.event_date) continue;

      const eventDate = parseISO(event.event_date);
      const oneDayAfter = addDays(eventDate, 1);
      const twoDaysAfter = addDays(eventDate, 2);

      // בדיקה אם עברו 24 שעות מהאירוע (אבל לא יותר מ-48 שעות)
      if (isAfter(now, oneDayAfter) && isBefore(now, twoDaysAfter)) {
        console.log(`📅 Event "${event.name}" is eligible for post-event emails`);
        
        // קבלת כל המדיה המאושרת של האירוע
        const allMedia = await MediaItem.filter({ event_id: event.id, status: 'approved' });
        
        if (allMedia.length === 0) {
          console.log(`⚠️ No approved media found for event ${event.name}`);
          continue;
        }

        // קיבוץ לפי אימייל של מעלה
        const guestGroups = new Map();
        allMedia.forEach(item => {
          if (item.uploader_email || item.created_by) {
            const email = item.uploader_email || item.created_by;
            if (email && email.includes('@')) {
              if (!guestGroups.has(email)) {
                guestGroups.set(email, {
                  name: item.uploader_name || 'אורח/ת יקר/ה',
                  email: email,
                  mediaCount: 0,
                  media: []
                });
              }
              const guest = guestGroups.get(email);
              guest.mediaCount++;
              guest.media.push(item);
              guestGroups.set(email, guest);
            }
          }
        });

        console.log(`👥 Found ${guestGroups.size} guests with uploaded media for event ${event.name}`);

        // שליחת מייל לכל אורח
        for (const [email, guest] of guestGroups) {
          const result = await sendPersonalAlbumEmail(event, guest, guest.media);
          results.push({
            eventId: event.id,
            eventName: event.name,
            ...result
          });
          
          // המתנה קצרה בין מיילים
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.log(`📊 Post-event email summary: ${results.length} emails processed`);
    return results;

  } catch (error) {
    console.error('❌ Error in sendPostEventPersonalAlbums:', error);
    throw error;
  }
};

/**
 * שולח מייל תזכורת למחיקה 13 יום אחרי האירוע
 * @param {Object} event - פרטי האירוע
 */
export const sendDeletionWarningEmail = async (event) => {
  try {
    console.log(`⚠️ Sending deletion warning email for event ${event.name}`);
    
    const eventDate = format(parseISO(event.event_date), 'PPP', { locale: he });
    const deletionDate = format(addDays(parseISO(event.event_date), 14), 'PPP', { locale: he });
    
    const emailBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; max-width: 600px; margin: 0 auto; background-color: #FEFBF3; padding: 20px;">
        <div style="background: linear-gradient(135deg, #D32F2F 0%, #F44336 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">⚠️ תזכורת חשובה - מחיקת אלבום</h1>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #D32F2F; margin-top: 0;">האלבום של "${event.name}" ימחק מחר!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            האירוע התקיים ב-${eventDate}, ומחר (${deletionDate}) יעברו 14 יום מתאריך האירוע.<br/>
            <strong>זוהי ההזדמנות האחרונה לגבות ולהוריד את כל התמונות מהאלבום!</strong>
          </p>
        </div>

        <div style="background: #FFEBEE; border: 3px solid #F44336; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="color: #C62828; margin-top: 0;">🚨 פעולות דחופות נדרשות:</h3>
          <ol style="color: #B71C1C; font-size: 16px; line-height: 1.8; margin: 0; padding-right: 20px;">
            <li><strong>גבה את כל התמונות</strong> - הורד אותן למחשב או לענן</li>
            <li><strong>שתף עם האורחים</strong> - וודא שכולם הורידו את התמונות שלהם</li>
            <li><strong>צור גיבוי נוסף</strong> - Google Drive, Dropbox או דיסק קשיח חיצוני</li>
            <li><strong>בדוק פעמיים</strong> - וודא שיש לך עותק של כל התמונות החשובות</li>
          </ol>
        </div>

        <div style="background: #E8F5E8; border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h4 style="color: #2E7D32; margin-top: 0;">🔗 גישה לאלבום</h4>
          <div style="margin: 15px 0;">
            <a href="${window.location.origin}/guest/${event.id}" style="display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              📂 פתח את האלבום עכשיו
            </a>
          </div>
        </div>

        <div style="background: #FFF3E0; border: 2px solid #FF9800; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #E65100; margin-top: 0;">💡 טיפים לגיבוי:</h4>
          <ul style="color: #BF360C; margin: 0; padding-right: 20px;">
            <li>השתמש בתפריט "הורד הכל" באלבום</li>
            <li>גבה גם לענן וגם למחשב</li>
            <li>ארגן את התמונות בתיקיות לפי תאריכים</li>
            <li>שמור גם את פרטי האירוע (תאריך, מיקום, משתתפים)</li>
          </ul>
        </div>

        <div style="background: #F0F0F0; border-radius: 8px; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">⏰ מייל זה נשלח 13 יום אחרי האירוע כתזכורת אוטומטית</p>
          <p style="margin: 5px 0 0 0;">📧 STRINGS - שירותי אלבומי אירועים</p>
        </div>
      </div>
    `;

    // שליחה למארגן האירוע
    if (event.organizer_email) {
      await SendEmail({
        to: event.organizer_email,
        subject: `⚠️ תזכורת דחופה: אלבום "${event.name}" ימחק מחר!`,
        body: emailBody,
      });
    }

    // שליחה למנהלת STRINGS
    await SendEmail({
      to: STRINGS_ADMIN_EMAIL,
      subject: `⚠️ תזכורת מחיקה: אלבום "${event.name}" ימחק מחר`,
      body: emailBody,
    });

    console.log(`✅ Deletion warning emails sent for event ${event.name}`);
    return { success: true, eventName: event.name };

  } catch (error) {
    console.error(`❌ Error sending deletion warning email for event ${event.name}:`, error);
    return { success: false, eventName: event.name, error: error.message };
  }
};

/**
 * בודק אירועים שזקוקים למייל תזכורת מחיקה (13 יום אחרי האירוע)
 */
export const sendDeletionWarnings = async () => {
  try {
    console.log('🔍 Looking for events that need deletion warning emails...');
    
    const allEvents = await Event.list();
    const results = [];
    const now = new Date();

    for (const event of allEvents) {
      if (!event.event_date) continue;

      const eventDate = parseISO(event.event_date);
      const thirteenDaysAfter = addDays(eventDate, 13);
      const fourteenDaysAfter = addDays(eventDate, 14);

      // בדיקה אם עברו 13 יום מהאירוע (אבל לא 14)
      if (isAfter(now, thirteenDaysAfter) && isBefore(now, fourteenDaysAfter)) {
        console.log(`📅 Event "${event.name}" needs deletion warning email`);
        const result = await sendDeletionWarningEmail(event);
        results.push(result);
        
        // המתנה קצרה בין מיילים
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📊 Deletion warning summary: ${results.length} events processed`);
    return results;

  } catch (error) {
    console.error('❌ Error in sendDeletionWarnings:', error);
    throw error;
  }
};

/**
 * פונקציה מרכזית להפעלת כל המיילים האוטומטיים
 */
export const runAutomaticEmails = async () => {
  console.log('🤖 Running automatic email system...');
  showToast('info', 'מפעיל מערכת מיילים אוטומטית', 'בודק אירועים שזקוקים למיילים...');
  
  try {
    // מיילים 24 שעות אחרי אירוע
    const personalAlbumResults = await sendPostEventPersonalAlbums();
    
    // מיילים 13 יום אחרי אירוע
    const deletionWarningResults = await sendDeletionWarnings();
    
    const summary = {
      personalAlbums: personalAlbumResults.length,
      deletionWarnings: deletionWarningResults.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Automatic emails summary:', summary);
    
    if (summary.personalAlbums === 0 && summary.deletionWarnings === 0) {
      showToast('info', 'לא נמצאו אירועים שזקוקים למיילים', 'כל האירועים מעודכנים');
    }
    
    return summary;
    
  } catch (error) {
    console.error('❌ Error in runAutomaticEmails:', error);
    showToast('error', 'שגיאה במערכת המיילים האוטומטית', error.message);
    throw error;
  }
};
