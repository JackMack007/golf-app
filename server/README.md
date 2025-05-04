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
- `POST /api/courses`: Creates a new golf course record for the authenticated user.
- `GET /api/courses`: Retrieves all golf course records (publicly accessible).
- `PUT /api/courses/:id`: Updates a golf course record if the authenticated user is the creator.
- `DELETE /api/courses/:id`: Deletes a golf course record if the authenticated user is the creator.
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

## Database Schema

### `courses` Table
- Stores golf course data with the following schema:

- **course_id**: `uuid`, Primary Key, Default: `gen_random_uuid()`, Unique identifier for the course.
- **name**: `varchar`, Not Null, Name of the golf course (e.g., 'Sunny Hills Golf Course').
- **location**: `varchar`, Not Null, Location of the course (e.g., 'Orlando, FL').
- **par**: `int2`, Not Null, Total par for the course (e.g., 72).
- **created_by**: `uuid`, Not Null, Foreign Key to `users.user_id`, UUID of the user who created the course.
- **slope_value**: `integer`, Not Null, Slope rating of the course (e.g., 113).
- **course_value**: `numeric(4,1)`, Not Null, Course rating (e.g., 72.5).
- **created_at**: `timestamptz`, Not Null, Default: `now()`, Timestamp of record creation.

**RLS Policies**:
- **Insert Own Courses**:
  - Operation: `INSERT`
  - Role: `authenticated`
  - Expression: `auth.uid() = created_by`
  - Description: Allows authenticated users to insert courses where `created_by` matches their user ID.
- **View Own Courses**:
  - Operation: `SELECT`
  - Role: `authenticated`
  - Expression: `auth.uid() = created_by`
  - Description: Allows authenticated users to view courses they created.
- **Public Read Access**:
  - Operation: `SELECT`
  - Role: `public`
  - Expression: `true`
  - Description: Allows anyone (authenticated or not) to read all courses.

