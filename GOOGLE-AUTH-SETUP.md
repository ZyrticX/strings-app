# 🔐 Google Authentication Setup Guide

Let's add Google OAuth to your Base44 app running on Supabase!

## Step 1: Set Up Google OAuth in Google Cloud Console

### 1.1 Go to Google Cloud Console
1. Visit: [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account

### 1.2 Create or Select Project
1. **If you have no project**: Click "Create Project"
   - Name: `StringsShaked Auth` (or any name)
   - Click "Create"
2. **If you have a project**: Select it from the dropdown

### 1.3 Enable Google+ API
1. Go to **APIs & Services** → **Library**
2. Search for: **"Google+ API"**
3. Click on it and press **"Enable"**

### 1.4 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** (for public app)
3. Fill in required fields:
   - **App name**: `StringsShaked`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **"Save and Continue"**
5. **Scopes**: Skip for now, click **"Save and Continue"**
6. **Test users**: Skip for now, click **"Save and Continue"**

### 1.5 Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client IDs"**
3. **Application type**: Web application
4. **Name**: `StringsShaked Web Client`
5. **Authorized redirect URIs**: Add these URLs:
   ```
   https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
   http://localhost:5173
   ```
6. Click **"Create"**
7. **COPY and SAVE**:
   - **Client ID**: `123456789-abcdef.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxx`

## Step 2: Configure Google Auth in Supabase

### 2.1 Open Supabase Dashboard
1. Go to: [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Click your project: `jipyufhgjsuqqblzhvzo`

### 2.2 Enable Google Provider
1. Go to **Authentication** → **Providers**
2. Find **Google** in the list
3. **Toggle it ON** (enable)

### 2.3 Add Google Credentials
1. Paste your **Client ID** from Google Cloud Console
2. Paste your **Client Secret** from Google Cloud Console
3. Click **"Save"**

### 2.4 Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. **Site URL**: `http://localhost:5173`
3. **Redirect URLs**: Add:
   ```
   http://localhost:5173
   http://localhost:5173/
   https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
   ```

## Step 3: Test Google Authentication

### 3.1 Restart Your App
```bash
# Stop your dev server (Ctrl+C)
npm run dev
```

### 3.2 Test Login Flow
1. Open: http://localhost:5173
2. Click **"התחבר עם Google"** (Login with Google)
3. Should redirect to Google login
4. After login, should return to your app
5. Check browser console for user data

## Step 4: Verify User Creation

### 4.1 Check Supabase Users
1. In Supabase Dashboard → **Authentication** → **Users**
2. Should see your Google account after login

### 4.2 Check Database
1. Go to **Table Editor** → **users** table
2. Should see your user record created automatically

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**
   - Check Google Cloud Console redirect URIs match exactly
   - Ensure both localhost and Supabase URLs are added

2. **"invalid_client"**
   - Verify Client ID and Secret are correct in Supabase
   - Check Google Cloud Console project is correct

3. **Login redirects but no user**
   - Check Supabase RLS policies allow user creation
   - Verify auth triggers are working

4. **CORS errors**
   - Add your domain to Supabase allowed origins
   - Check redirect URLs in both Google and Supabase

### Debug Steps:
1. **Browser Console**: Check for error messages
2. **Supabase Logs**: Check Authentication logs
3. **Google Console**: Verify API quotas and usage
4. **Network Tab**: Check auth request/response

## Security Notes

- **Never commit** Client Secret to version control
- Use **environment variables** for production
- Consider **domain verification** for production use
- Review **OAuth scopes** for minimal access

## Production Deployment

For production, update redirect URIs in Google Cloud Console:
```
https://your-production-domain.com
https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
```

---

🎉 **Once configured, users can sign in with Google and your app will have full authentication!**
