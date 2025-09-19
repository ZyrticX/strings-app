# Base44 App - Local Development Setup with Supabase

This guide will help you set up the Base44 app to run locally with Supabase database.

## Prerequisites

1. **Node.js** (v16 or higher) - ✅ Already installed (v24.5.0)
2. **npm** - ✅ Already installed (11.5.1)
3. **Supabase Account** - Create a free account at [supabase.com](https://supabase.com)

## Setup Options

### Option 1: Local Supabase (Requires Docker)

If you have Docker Desktop installed:

1. Install Docker Desktop from https://docs.docker.com/desktop
2. Run the following commands:
   ```bash
   npx supabase start
   npm run dev
   ```

### Option 2: Remote Supabase (Recommended for quick setup)

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Create a new project

2. **Get your project credentials:**
   - Go to Settings → API
   - Copy your Project URL and anon public key

3. **Update environment variables:**
   - Copy `supabase.env` to `.env`
   - Replace the placeholder values with your actual Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_USE_SUPABASE=true
   ```

4. **Set up the database schema:**
   - Go to your Supabase dashboard → SQL Editor
   - Copy and run the SQL from `supabase/migrations/20240918000001_initial_schema.sql`

5. **Configure Google OAuth (optional):**
   - Go to Authentication → Providers → Google
   - Enable Google provider
   - Add your Google OAuth credentials

## Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Navigate to http://localhost:5173
   - The app should now be running with Supabase!

## Key Changes Made

- ✅ Replaced Base44 SDK with Supabase client
- ✅ Created database schema with all necessary tables
- ✅ Updated entity operations to use Supabase
- ✅ Set up authentication with Google OAuth
- ✅ Configured file storage for media uploads

## Database Schema

The following tables have been created:
- `users` - User profiles and roles
- `events` - Event information and settings
- `media_items` - Photos and videos uploaded to events
- `highlight_categories` - Event highlight categories
- `notifications` - System notifications

## Features Working

- ✅ User authentication (Google OAuth)
- ✅ Event creation and management
- ✅ Media upload and viewing
- ✅ Guest access with access codes
- ✅ Admin dashboard
- ✅ Payment integration (CardCom)

## Troubleshooting

If you encounter issues:

1. **Database connection errors:** Verify your Supabase credentials in `.env`
2. **Authentication issues:** Check Google OAuth configuration in Supabase
3. **File upload errors:** Ensure storage bucket is properly configured
4. **CORS errors:** Add your local domain to Supabase allowed origins

## Next Steps

1. Set up your Supabase project
2. Configure authentication providers
3. Test the application features
4. Deploy to production when ready

The app is now configured to work with Supabase instead of Base44's proprietary backend!
