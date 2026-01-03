# Deployment Guide - Vercel

This guide will help you deploy your Bingoooal app to Vercel with automatic deployments from GitHub.

## Prerequisites

- GitHub account with your repository
- Vercel account (free tier works great)
- Supabase project with OAuth configured

## Step 1: Push Your Changes to GitHub

First, commit and push the Vercel adapter changes:

```bash
git add .
git commit -m "Configure Vercel deployment"
git push origin main
```

## Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click "Add New Project"
3. Import your `bingoooal` repository from GitHub
4. Vercel will automatically detect it's an Astro project

## Step 3: Configure Build Settings

Vercel should auto-detect these settings, but verify:

- **Framework Preset**: Astro
- **Root Directory**: (leave blank - use project root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Step 4: Add Environment Variables

In the Vercel project settings, add these environment variables:

1. Click on "Environment Variables" tab
2. Add the following variables:

| Name                       | Value                         | Environment                      |
| -------------------------- | ----------------------------- | -------------------------------- |
| `PUBLIC_SUPABASE_URL`      | Your Supabase project URL     | Production, Preview, Development |
| `PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Production, Preview, Development |

**Where to find these values:**

- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the Project URL and anon/public key

## Step 5: Update Supabase OAuth Redirect URLs

Add your Vercel deployment URL to Supabase OAuth settings:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add these URLs to "Redirect URLs":

   - `https://your-project.vercel.app/auth/callback`
   - `https://your-project-*.vercel.app/auth/callback` (for preview deployments)

3. Update "Site URL" to: `https://your-project.vercel.app`

## Step 6: Deploy

Click "Deploy" in Vercel!

Your app will be deployed and you'll get a URL like: `https://your-project.vercel.app`

## Automatic Deployments

From now on:

- **Push to `main`** → Automatic production deployment
- **Push to other branches** → Automatic preview deployment
- **Pull requests** → Automatic preview deployment with unique URL

## Monitoring

- View deployment logs in Vercel dashboard
- Check runtime logs in Vercel → Your Project → Logs
- Monitor performance in Vercel Analytics (optional)

## Troubleshooting

### Build Fails

- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Verify the root directory is set to project root (blank)

### OAuth Not Working

- Verify redirect URLs in Supabase match your Vercel domain
- Check that environment variables are set for all environments
- Clear browser cookies and try again

### 404 Errors

- Ensure the Vercel adapter is properly configured in `astro.config.mjs`
- Check that the build completed successfully
- Verify the output directory is set to `dist`

## Local Development

To test locally with the Vercel adapter:

```bash
npm run build
npm run preview
```

## Removing AWS Amplify

Since you're now using Vercel, you can:

1. Delete the `amplify.yml` file (or keep it for reference)
2. Disconnect your GitHub repo from AWS Amplify in the AWS Console
3. Delete the Amplify app if you no longer need it

## Next Steps

- Set up custom domain in Vercel (optional)
- Enable Vercel Analytics (optional)
- Configure preview deployment settings
- Set up branch protection rules in GitHub
