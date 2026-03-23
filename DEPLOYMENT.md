# Easy First-Time Deployment Guide

This guide is written in simple language for your first deployment.

## What you are making live

You will connect 2 services:

1. Supabase
   This stores your data and handles login.
2. Vercel
   This puts your website live on the internet.

## Step 1: Create a Supabase account

1. Open [https://supabase.com](https://supabase.com)
2. Sign up or log in.
3. Click `New Project`.
4. Fill in the project name and password.
5. Wait for the project to finish creating.

## Step 2: Create the database table

1. Inside Supabase, open your project.
2. In the left menu, click `SQL Editor`.
3. Click `New Query`.
4. Open this file from your project:
   [supabase/schema.sql](/Users/ayush/Documents/New project/supabase/schema.sql)
5. Copy all of its contents.
6. Paste it into the Supabase SQL Editor.
7. Click `Run`.

This creates the `deals` table for the app.

## Step 3: Turn on login

1. In Supabase, open `Authentication`.
2. Open `Providers`.
3. Make sure `Email` is enabled.
4. For the easiest first setup, turn off email confirmation.

Why:
If email confirmation is off, you can create your account and log in immediately.

## Step 4: Copy your 4 keys

In Supabase, go to `Project Settings` and then `API`.

You need these 4 values:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_URL`
4. `SUPABASE_SERVICE_ROLE_KEY`

Important:

- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL` will usually be the same URL
- copy carefully
- do not share the service role key with anyone

## Step 5: Put the project on GitHub

1. Create a GitHub account if needed.
2. Create a new repository.
3. Upload this whole project to that repository.

## Step 6: Create a Vercel account

1. Open [https://vercel.com](https://vercel.com)
2. Sign up or log in.
3. Connect your GitHub account.

## Step 7: Import your project into Vercel

1. In Vercel, click `Add New...`
2. Click `Project`
3. Choose your GitHub repository
4. Click `Import`

## Step 8: Add the 4 environment variables in Vercel

Before clicking deploy, Vercel will show environment variable fields.

Add these 4:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_URL`
4. `SUPABASE_SERVICE_ROLE_KEY`

Paste the exact values you copied from Supabase.

## Step 9: Deploy

1. Click `Deploy`
2. Wait for Vercel to build the app
3. When it finishes, Vercel will give you a live URL

Example:

`https://your-app-name.vercel.app`

## Step 10: Open the live site

1. Open the Vercel URL
2. On the login screen, click `Create account`
3. Enter your email and password
4. Create your first account
5. Sign in

Now the app is live and protected by login.

## If something does not work

Check these first:

1. Did you run the SQL file in Supabase?
2. Did you enable Email login in Supabase?
3. Did you add all 4 environment variables in Vercel?
4. Did you paste the correct values?

## Files you may need while setting up

- [.env.example](/Users/ayush/Documents/New project/.env.example)
- [supabase/schema.sql](/Users/ayush/Documents/New project/supabase/schema.sql)
- [package.json](/Users/ayush/Documents/New project/package.json)
