# 🚀 הגדרת משתני סביבה ב-Vercel

## שלב 1: דרך הממשק (המומלץ)

1. **כנס ל-Vercel Dashboard:**
   - לך ל: https://vercel.com/dashboard
   - בחר את הפרויקט שלך: `strings-app`

2. **כנס להגדרות:**
   - לחץ על `Settings` (הגדרות)
   - בחר `Environment Variables` (משתני סביבה)

3. **הוסף את המשתנים הבאים:**
   
   **משתנה 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://jipyufhgjsuqqblzhvzo.supabase.co`
   - Environment: `Production`, `Preview`, `Development` (בחר הכל)

   **משתנה 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcHl1ZmhnanN1cXFibHpodnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDM1NDgsImV4cCI6MjA3Mzc3OTU0OH0.yybdgQSLVBrUgLFMCgEdRqBU-WoQwPTDMy8vcWhASXU`
   - Environment: `Production`, `Preview`, `Development`

   **משתנה 3:**
   - Name: `VITE_SUPABASE_SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcHl1ZmhnanN1cXFibHpodnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIwMzU0OCwiZXhwIjoyMDczNzc5NTQ4fQ.IUFmgJJR9k7CVe7yhqfQEH0lIpjv8sJt5RKzwKmlCUM`
   - Environment: `Production`, `Preview`, `Development`

   **משתנה 4:**
   - Name: `VITE_USE_SUPABASE`
   - Value: `true`
   - Environment: `Production`, `Preview`, `Development`

   **משתנה 5:**
   - Name: `VITE_BASE44_APP_ID`
   - Value: `6832c99dacb30a9202a94b52`
   - Environment: `Production`, `Preview`, `Development`

   **משתנה 6:**
   - Name: `VITE_PRODUCTION_DOMAIN`
   - Value: `https://www.strings-app.com`
   - Environment: `Production`, `Preview`, `Development`

4. **שמור ופרוס מחדש:**
   - לחץ `Save` על כל משתנה
   - לך ל-`Deployments` ולחץ `Redeploy` על הפריסה האחרונה

## שלב 2: דרך ה-CLI (אלטרנטיבה)

```bash
# התקן Vercel CLI אם עדיין לא מותקן
npm i -g vercel

# התחבר לחשבון
vercel login

# קישור הפרויקט
vercel link

# הוספת משתני סביבה
vercel env add VITE_SUPABASE_URL production
# הכנס: https://jipyufhgjsuqqblzhvzo.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# הכנס: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcHl1ZmhnanN1cXFibHpodnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDM1NDgsImV4cCI6MjA3Mzc3OTU0OH0.yybdgQSLVBrUgLFMCgEdRqBU-WoQwPTDMy8vcWhASXU

vercel env add VITE_SUPABASE_SERVICE_ROLE_KEY production
# הכנס: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcHl1ZmhnanN1cXFibHpodnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIwMzU0OCwiZXhwIjoyMDczNzc5NTQ4fQ.IUFmgJJR9k7CVe7yhqfQEH0lIpjv8sJt5RKzwKmlCUM

vercel env add VITE_USE_SUPABASE production
# הכנס: true

vercel env add VITE_BASE44_APP_ID production
# הכנס: 6832c99dacb30a9202a94b52

vercel env add VITE_PRODUCTION_DOMAIN production
# הכנס: https://www.strings-app.com

# פריסה מחדש
vercel --prod
```

## שלב 3: בדיקה

לאחר ההגדרה, הכנס לקונסול של הדפדפן באתר הפרודקשן ובדוק:

```javascript
// צריך להציג את ה-URL הנכון של Supabase
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

// צריך להציג true
console.log('Production mode:', import.meta.env.PROD)
```

## ⚠️ חשוב!

אחרי הוספת משתני הסביבה, **חובה לעשות Redeploy** כדי שהשינויים ייכנסו לתוקף!

## 🔍 פתרון בעיות

אם עדיין יש בעיה:

1. בדוק שכל המשתנים נוספו בכל הסביבות (Production, Preview, Development)
2. ודא שעשית Redeploy אחרי ההוספה
3. בדוק בקונסול של הדפדפן שהמשתנים נטענים נכון
4. נקה cache של הדפדפן
