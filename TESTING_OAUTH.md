# Testing Google OAuth Authentication

## Setup Complete! ✅

Your Bingoal app now has Google OAuth authentication fully configured.

## What Was Built:

### 1. **Middleware** (`src/src/middleware.ts`)
   - Manages user sessions across all pages
   - Protects `/dashboard` route (requires login)
   - Redirects logged-in users away from `/login`

### 2. **Login Page** (`src/src/pages/login.astro`)
   - Beautiful login UI with Google OAuth button
   - Handles OAuth flow initiation
   - Error handling for failed logins

### 3. **OAuth Callback** (`src/src/pages/auth/callback.astro`)
   - Handles the OAuth redirect from Google
   - Exchanges authorization code for session
   - Redirects to dashboard on success

### 4. **Dashboard** (`src/src/pages/dashboard.astro`)
   - Protected page (requires authentication)
   - Displays user info (name, avatar)
   - Logout functionality
   - Placeholder for bingo boards

## How to Test:

### 1. Start the Development Server

```bash
cd src
npm run dev
```

The server should start at `http://localhost:4321`

### 2. Test the OAuth Flow

1. **Visit** `http://localhost:4321`
   - Should redirect to `/login`

2. **Click "Continue with Google"**
   - Opens Google OAuth consent screen
   - Select your Google account
   - Grant permissions

3. **After Authorization**
   - Redirects to `/auth/callback`
   - Then redirects to `/dashboard`
   - You should see your name and avatar

4. **Test Protected Routes**
   - Try visiting `/dashboard` directly (should work when logged in)
   - Click "Logout" button
   - Try visiting `/dashboard` again (should redirect to `/login`)

## Troubleshooting:

### If OAuth fails:

1. **Check Google Cloud Console:**
   - Verify redirect URI is set to: `https://wiekhzjypbqkwgljvzzu.supabase.co/auth/v1/callback`
   - Verify local redirect URI: `http://localhost:4321/auth/callback`

2. **Check Supabase Dashboard:**
   - Go to Authentication > Providers
   - Verify Google is enabled
   - Verify Client ID and Secret are correct

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for any error messages
   - Check Network tab for failed requests

### Common Issues:

- **"Redirect URI mismatch"**: Add the correct URI to Google Cloud Console
- **"Invalid client"**: Double-check Client ID and Secret in Supabase
- **Session not persisting**: Clear cookies and try again

## Next Steps:

Once OAuth is working, we can:
1. Create database tables for bingo boards and goals
2. Build the bingo board UI
3. Implement goal tracking functionality
4. Add more OAuth providers (Instagram, GitHub, etc.)

## Environment Variables:

Make sure your `src/.env` file contains:
```
PUBLIC_SUPABASE_URL=https://wiekhzjypbqkwgljvzzu.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** The `.env` file is gitignored and should never be committed to version control.

