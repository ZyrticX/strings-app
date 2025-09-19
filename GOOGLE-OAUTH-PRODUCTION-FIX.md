# 🚨 URGENT: Google OAuth Production Fix

## הבעיה שזוהתה:
Google OAuth מפנה ל-localhost במקום לדומיין הפרודקשן!

## פתרון מיידי:

### שלב 1: Google Cloud Console
1. **כנס ל-Google Cloud Console**: https://console.cloud.google.com
2. **בחר את הפרויקט** שלך
3. **APIs & Services → Credentials**
4. **לחץ על ה-OAuth 2.0 Client ID** שלך

### שלב 2: עדכן JavaScript Origins
**הוסף את הדומיינים הבאים ל-Authorized JavaScript origins:**
```
https://www.strings-app.com
https://strings-app.com
https://strings-app-tawny.vercel.app
```

### שלב 3: עדכן Redirect URIs
**הוסף את הכתובות הבאות ל-Authorized redirect URIs:**
```
https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
https://www.strings-app.com
https://strings-app.com
https://strings-app-tawny.vercel.app
```

### שלב 4: Supabase Configuration
1. **כנס ל-Supabase Dashboard**: https://supabase.com/dashboard/projects
2. **בחר את הפרויקט**: jipyufhgjsuqqblzhvzo
3. **Authentication → URL Configuration**
4. **Site URL**: שנה ל-`https://www.strings-app.com`
5. **Redirect URLs**: הוסף:
   ```
   https://www.strings-app.com
   https://strings-app.com
   https://strings-app-tawny.vercel.app
   https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
   ```

## בדיקה:
1. שמור את כל השינויים
2. חכה 2-3 דקות (Google צריך זמן לעדכן)
3. נסה להתחבר שוב באתר הפרודקשן

## אם עדיין לא עובד:
1. בדוק שכל הכתובות נוספו נכון
2. ודא שאין שגיאות כתיב
3. נסה במצב גלישה פרטית
4. נקה cache של הדפדפן

## הגדרה מלאה צריכה להיראות כך:

### Google Cloud Console:
```
Application type: Web application
Name: StringsShaked Web Client

Authorized JavaScript origins:
✅ http://localhost:5173
✅ https://www.strings-app.com
✅ https://strings-app.com
✅ https://strings-app-tawny.vercel.app

Authorized redirect URIs:
✅ https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
✅ http://localhost:5173
✅ https://www.strings-app.com
✅ https://strings-app.com
✅ https://strings-app-tawny.vercel.app
```

### Supabase URL Configuration:
```
Site URL: https://www.strings-app.com

Redirect URLs:
✅ https://www.strings-app.com
✅ https://strings-app.com
✅ https://strings-app-tawny.vercel.app
✅ https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
```

## ⚠️ חשוב!
Google צריך כמה דקות לעדכן את ההגדרות. אל תיבהל אם זה לא עובד מיד!
