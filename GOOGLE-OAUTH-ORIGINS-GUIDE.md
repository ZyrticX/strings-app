# 🔒 Google OAuth - JavaScript Origins Configuration

## What are JavaScript Origins?

**JavaScript Origins** (also called **Authorized JavaScript Origins**) are the domains that Google allows to initiate OAuth requests from client-side JavaScript. This is a security feature to prevent unauthorized websites from using your OAuth credentials.

## Why You Need Them

When your React app (running client-side JavaScript) initiates a Google OAuth login, Google checks:
1. **Is this request coming from an authorized domain?** ← JavaScript Origins
2. **Where should I redirect after login?** ← Redirect URIs

## For Your StringsShaked App

### Current Setup Needed:

#### **JavaScript Origins (Authorized JavaScript origins):**
```
http://localhost:5173
http://localhost:3000
```

#### **Redirect URIs (Authorized redirect URIs):**
```
https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
http://localhost:5173
http://localhost:3000
```

## Step-by-Step Configuration in Google Cloud Console

### 1. Access Your OAuth Client
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID** (the one you created)

### 2. Configure JavaScript Origins
In the **Authorized JavaScript origins** section, add:

**For Development:**
```
http://localhost:5173
http://localhost:3000
```

**For Production (when you deploy):**
```
https://your-domain.com
https://www.your-domain.com
```

### 3. Configure Redirect URIs
In the **Authorized redirect URIs** section, add:

**For Development:**
```
https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
http://localhost:5173
http://localhost:3000
```

**For Production (when you deploy):**
```
https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
https://your-domain.com
https://www.your-domain.com
```

## Complete OAuth Configuration Example

Your Google OAuth client should look like this:

```
Application type: Web application
Name: StringsShaked Web Client

Authorized JavaScript origins:
✅ http://localhost:5173
✅ http://localhost:3000

Authorized redirect URIs:
✅ https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback
✅ http://localhost:5173
✅ http://localhost:3000
```

## Why Both Port 5173 and 3000?

- **Port 5173**: Your current Vite dev server
- **Port 3000**: Common React dev server port (backup/alternative)
- **Supabase Callback**: Where Supabase handles the OAuth response

## Common Errors Without Proper Origins

### Error: "origin_mismatch"
```
Error 400: redirect_uri_mismatch
The redirect URI in the request, http://localhost:5173, does not match the ones authorized for the OAuth client.
```

**Solution**: Add `http://localhost:5173` to both JavaScript Origins AND Redirect URIs.

### Error: "Not authorized"
```
Error 403: disallowed_useragent
```

**Solution**: Ensure JavaScript Origins includes your localhost domain.

## Testing Your Configuration

### 1. Save Changes in Google Cloud Console
Click **"Save"** after adding all origins and redirect URIs.

### 2. Test in Your App
1. Open: http://localhost:5173
2. Click: "התחברות מנהלים עם Google"
3. Should redirect to Google login (not show error)

### 3. Verify Flow
1. **Page loads** → JavaScript Origins working ✅
2. **Google login appears** → Redirect URIs working ✅
3. **Returns to app** → Full OAuth flow working ✅

## Security Notes

### Development vs Production

**Development (localhost):**
- Use HTTP (http://localhost:5173)
- Google allows HTTP for localhost only

**Production:**
- Must use HTTPS (https://your-domain.com)
- Google requires HTTPS for all non-localhost domains

### Domain Verification

For production domains, you may need to:
1. **Verify domain ownership** in Google Search Console
2. **Add domain** to Google Cloud Console
3. **Configure DNS** properly

## Quick Checklist

Before testing Google OAuth:

- [ ] ✅ Created Google Cloud Console project
- [ ] ✅ Enabled Google+ API
- [ ] ✅ Created OAuth 2.0 Client ID
- [ ] ✅ Added JavaScript Origins: `http://localhost:5173`
- [ ] ✅ Added Redirect URIs: Supabase callback + localhost
- [ ] ✅ Configured Google provider in Supabase
- [ ] ✅ Added Client ID/Secret to Supabase

## Troubleshooting

### If OAuth still doesn't work:

1. **Check Browser Console** for error messages
2. **Verify URLs match exactly** (no typos, trailing slashes)
3. **Wait 5-10 minutes** for Google changes to propagate
4. **Clear browser cache** and try again
5. **Check Supabase Auth logs** for additional errors

---

💡 **Pro Tip**: Always add both your current port AND port 3000 as backups, in case you need to change your dev server port later!
