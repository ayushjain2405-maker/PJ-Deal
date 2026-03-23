# Metal Deal Tracker

Multi-device gold and silver deal tracker built with Next.js, Supabase, and Vercel.

## What this app does

- lets you log in with your own account
- saves customer and vendor deals in the cloud
- syncs the same data across phone, laptop, and desktop
- shows only the signed-in user's own deals

## Features

- Customer and vendor deal entry
- Customer mobile number
- Separate customer and vendor message generation
- Separate delivery tracking for customer side and vendor side
- Vendor weight tracking
- Mobile-friendly layout
- Cloud sync through Supabase
- Login and sign-out through Supabase Auth

## Main setup files

- [app/page.js](/Users/ayush/Documents/New project/app/page.js)
- [app/api/deals/route.js](/Users/ayush/Documents/New project/app/api/deals/route.js)
- [app/api/deals/[id]/route.js](/Users/ayush/Documents/New project/app/api/deals/[id]/route.js)
- [lib/auth.js](/Users/ayush/Documents/New project/lib/auth.js)
- [lib/supabaseBrowser.js](/Users/ayush/Documents/New project/lib/supabaseBrowser.js)
- [supabase/schema.sql](/Users/ayush/Documents/New project/supabase/schema.sql)

## Local development

1. Run:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

3. Put your Supabase values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

4. Start the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Database setup

Create a Supabase project and run the SQL in [supabase/schema.sql](/Users/ayush/Documents/New project/supabase/schema.sql).

## Deployment

Very simple deployment steps are in [DEPLOYMENT.md](/Users/ayush/Documents/New project/DEPLOYMENT.md).
