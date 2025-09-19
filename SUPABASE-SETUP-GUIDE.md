# 🚀 Complete Supabase Setup Guide

Follow these steps to connect your Base44 app to Supabase database.

## Step 1: Create Supabase Project

### 1.1 Sign Up for Supabase
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub, Google, or email
4. Verify your email if needed

### 1.2 Create New Project
1. Click **"New Project"**
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `StringsShaked` (or any name you prefer)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Select "Free" for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for project setup

## Step 2: Get Your Credentials

### 2.1 Navigate to Project Settings
1. In your Supabase dashboard, click **Settings** (gear icon)
2. Click **API** in the left sidebar

### 2.2 Copy Your Credentials
You'll see:
- **Project URL**: `https://your-project-id.supabase.co`
- **Project API keys**:
  - `anon public` key (starts with `eyJ...`)
  - `service_role` key (starts with `eyJ...`)

**Copy these values - you'll need them next!**

## Step 3: Update Your Local Environment

### 3.1 Edit Environment File
1. Open the `.env` file in your project root
2. Replace the placeholder values:

```env
# Replace these with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here

# Keep these as they are
VITE_BASE44_APP_ID=6832c99dacb30a9202a94b52
VITE_USE_SUPABASE=true
```

### 3.2 Example of Filled Environment File
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMAs_-e3Dc
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
VITE_BASE44_APP_ID=6832c99dacb30a9202a94b52
VITE_USE_SUPABASE=true
```

## Step 4: Set Up Database Schema

### 4.1 Open SQL Editor
1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**

### 4.2 Run Database Migration
1. Copy the entire contents of `supabase/migrations/20240918000001_initial_schema.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** button
4. You should see "Success. No rows returned" message

### 4.3 Verify Tables Created
1. Click **Table Editor** in the left sidebar
2. You should see these tables:
   - `users`
   - `events`
   - `media_items`
   - `highlight_categories` 
   - `notifications`

## Step 5: Configure Authentication (Optional but Recommended)

### 5.1 Enable Google OAuth
1. Go to **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. You'll need Google OAuth credentials:

### 5.2 Set Up Google OAuth (if you want Google login)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - `http://localhost:5173` (for local development)
6. Copy Client ID and Client Secret to Supabase

### 5.3 Alternative: Enable Email Auth
1. Go to **Authentication** → **Settings**
2. Ensure **"Enable email confirmations"** is **OFF** for easier testing
3. **"Enable email signups"** should be **ON**

## Step 6: Configure Storage

### 6.1 Create Storage Bucket
1. Go to **Storage** in Supabase dashboard
2. Click **"New bucket"**
3. Name: `media`
4. Make it **Public** (toggle ON)
5. Click **"Create bucket"**

### 6.2 Set Storage Policies
1. Click on your `media` bucket
2. Go to **Policies** tab
3. Click **"New policy"**
4. Use template: **"Give users access to own folder"**
5. Or create custom policy to allow public uploads

## Step 7: Test Your Connection

### 7.1 Restart Your Development Server
```bash
# Stop current server (Ctrl+C in terminal)
npm run dev
```

### 7.2 Check Console Logs
Open browser console (F12) and look for:
```
🏠 Running locally with Supabase configuration:
📍 Supabase URL: https://your-project-id.supabase.co
🔑 Using local development keys
```

### 7.3 Test Database Connection
Try these features:
- ✅ The app should load without errors
- ✅ Console should show your real Supabase URL
- ✅ No more "127.0.0.1" in the logs
- ✅ Authentication should work (if configured)

## Step 8: Production Deployment (Optional)

### 8.1 Environment Variables for Production
When deploying to production, set these environment variables:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_USE_SUPABASE=true
```

### 8.2 Update Authentication URLs
In Supabase Authentication settings, add your production domain to:
- **Site URL**
- **Redirect URLs**

## 🎉 Congratulations!

Your Base44 app is now connected to Supabase! You have:

- ✅ Real database with proper schema
- ✅ User authentication system
- ✅ File storage for media uploads
- ✅ Real-time capabilities
- ✅ Secure API with Row Level Security

## 🆘 Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Double-check your credentials in `.env`
2. **CORS errors**: Add your domain to allowed origins in Supabase
3. **Auth not working**: Verify OAuth configuration and redirect URLs
4. **Upload fails**: Check storage bucket permissions and policies
5. **Database errors**: Ensure migration SQL ran successfully

### Need Help?
- Check browser console for error messages
- Verify all environment variables are correct
- Ensure Supabase project is active
- Review Supabase documentation at [supabase.com/docs](https://supabase.com/docs)

---

**Your app is now ready for production! 🚀**
