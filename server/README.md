# Golf App Backend Setup

## Overview
The backend is an Express server (`server/index.js`) that provides authentication and profile management endpoints using Supabase.

## Endpoints
- `GET /api/health`: Checks server status.
- `POST /api/auth/signup`: Creates a new user in Supabase `auth.users` and `users` table.
- `POST /api/auth/login`: Authenticates a user and returns an access token.
- `POST /api/auth/logout`: Logs out the user.
- `GET /api/profile`: Retrieves the authenticated user's profile from the `users` table.
- `PUT /api/profile`: Updates the authenticated user's profile in the `users` table.
- `GET /api/test-supabase`: Tests Supabase connectivity.

## Configuration
- **Environment Variables** (`server/.env`):
- SUPABASE_URL=https://your-project-id.supabase.co
- SUPABASE_KEY=your_anon_key
- PORT=5000

- `SUPABASE_KEY` must be the Anon Public Key from Supabase Settings > API.
- Ensure `.env` is ignored by `.gitignore`.

## Dependencies
- express
- cors
- @supabase/supabase-js
- dotenv
- nodemon (dev)

## Running the Server
```bash
cd c:\golf-app
npm run dev

## Notes
- The getUser calls in profile endpoints use the raw access token (without Bearer prefix).
- RLS policies are configured in Supabase for users table (INSERT: anon, SELECT/UPDATE: authenticated).