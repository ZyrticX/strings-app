# הגדרת מיילים אוטומטיים - STRINGS

מערכת STRINGS כוללת 4 סוגי מיילים אוטומטיים:

## ✅ מיילים שכבר מוגדרים (אוטומטיים)

### 1. 📧 מייל יצירת אירוע
- **מתי**: מיד עם יצירת אירוע חדש
- **למי**: מארגן האירוע + מנהלת STRINGS
- **תוכן**: פרטי האירוע, QR code להדפסה, קישורים לניהול
- **סטטוס**: ✅ פעיל אוטומטית

### 2. 📝 מייל עדכון אירוע
- **מתי**: בכל שינוי באירוע (תאריך, צמידים, וכו')
- **למי**: מארגן האירוע + מנהלת STRINGS
- **תוכן**: רשימת שינויים, QR code מעודכן, פרטים חדשים
- **סטטוס**: ✅ פעיל אוטומטית

## 🔄 מיילים שדורשים הפעלה ידנית/מתוזמנת

### 3. 📸 מייל אלבום אישי (24 שעות אחרי אירוע)
- **מתי**: 24 שעות אחרי סיום האירוע
- **למי**: כל אורח שהעלה תמונות (לפי email)
- **תוכן**: גלריה של התמונות שהעלה, קישור לאלבום האישי
- **סטטוס**: 🟡 דורש הפעלה

### 4. ⚠️ מייל תזכורת מחיקה (13 יום אחרי אירוע)
- **מתי**: 13 יום אחרי האירוע (יום לפני המחיקה)
- **למי**: מארגן האירוע + מנהלת STRINGS
- **תוכן**: התראה על מחיקה מחר, הוראות גיבוי
- **סטטוס**: 🟡 דורש הפעלה

## 🚀 איך להפעיל מיילים אוטומטיים

### אפשרות 1: הפעלה ידנית מהממשק
1. היכנס לדף **Admin Dashboard**
2. גלול למטה לקטע **"מיילים אוטומטיים"**
3. לחץ על **"הפעל כל המיילים האוטומטיים"**

### אפשרות 2: הפעלה מתוזמנת (מומלץ)

#### Windows - Task Scheduler
```powershell
# צור task חדש שיפעיל את הדפדפן עם הקישור המתאים
schtasks /create /tn "StringsAutomaticEmails" /tr "powershell -Command \"Start-Process chrome 'http://localhost:5173/AdminDashboard'\"" /sc daily /st 09:00
```

#### Linux/Mac - Cron Job
```bash
# הוסף לקובץ crontab (crontab -e)
0 9 * * * curl -X POST http://localhost:5173/api/automatic-emails
```

#### Node.js Script (אפשרות מתקדמת)
```javascript
// automatic-emails-cron.js
import { runAutomaticEmails } from './src/utils/automaticEmails.js';

async function runDaily() {
  try {
    console.log('Running automatic emails...');
    const results = await runAutomaticEmails();
    console.log('Results:', results);
  } catch (error) {
    console.error('Error:', error);
  }
}

// הפעל כל יום ב-9:00
setInterval(runDaily, 24 * 60 * 60 * 1000); // כל 24 שעות
```

## 📊 מעקב ובקרה

### לוגים
- כל המיילים נרשמים בקונסול עם סטטוס הצלחה/כישלון
- ניתן לראות תוצאות אחרונות בדף Admin Dashboard

### בדיקה ידנית
```javascript
// בקונסול הדפדפן - בדיקת אירועים שזקוקים למיילים
import { sendPostEventPersonalAlbums, sendDeletionWarnings } from './src/utils/automaticEmails.js';

// בדיקת אלבומים אישיים
await sendPostEventPersonalAlbums();

// בדיקת התראות מחיקה  
await sendDeletionWarnings();
```

## ⚙️ הגדרות נוספות

### שינוי זמני השליחה
ערוך את הקובץ `src/utils/automaticEmails.js`:

```javascript
// שינוי מ-24 שעות ל-48 שעות אחרי אירוע
const oneDayAfter = addDays(eventDate, 2); // במקום 1

// שינוי מ-13 יום ל-10 יום לפני מחיקה  
const thirteenDaysAfter = addDays(eventDate, 10); // במקום 13
```

### הוספת נמענים
```javascript
// הוספת נמענים נוספים למיילי התראה
const ADDITIONAL_ADMINS = [
  "admin2@strings.com",
  "backup@strings.com"
];
```

## 🔧 פתרון בעיות

### מייל לא נשלח
1. בדוק חיבור לאינטרנט
2. בדוק הגדרות SMTP
3. בדוק לוגים בקונסול
4. בדוק שהאירוע עומד בקריטריונים (תאריך נכון, יש תמונות וכו')

### אין אירועים מתאימים
```javascript
// בדיקה ידנית של אירועים
const events = await Event.list();
console.log('All events:', events.map(e => ({
  name: e.name,
  date: e.event_date,
  daysFromNow: differenceInDays(new Date(), parseISO(e.event_date))
})));
```

### מיילים נשלחים כפול
- וודא שהתוכנה פועלת רק פעם אחת ביום
- בדוק שאין כמה instances של האפליקציה

## 📞 תמיכה

לשאלות נוספות:
- **WhatsApp**: 054-2565889  
- **Email**: stringsalbumapp@gmail.com
- **Instagram**: @stringsalbum

---

*מסמך זה עודכן לאחרונה: ספטמבר 2025*
