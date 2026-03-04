# SvelteKit Authentication App with RBAC

A full-stack authentication application built with SvelteKit 2, Auth.js, PostgreSQL, and Drizzle ORM. Features role-based access control (RBAC) with database-backed sessions.

## Features

- **User Authentication** — Register, login, logout with secure password hashing (bcryptjs)
- **Database Sessions** — Server-side sessions stored in PostgreSQL (not JWT)
- **Role-Based Access Control** — User and Admin roles with route-level protection
- **Admin Dashboard** — User management with stats, role changes, and user deletion
- **Profile Management** — Update profile info and change password
- **Responsive UI** — TailwindCSS v4 with mobile-friendly navigation

## Tech Stack

- **Framework**: SvelteKit 2 + Svelte 5 (runes syntax)
- **Authentication**: Auth.js (`@auth/sveltekit`) with Credentials provider
- **Database**: PostgreSQL + Drizzle ORM
- **Styling**: TailwindCSS v4
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js 18+
- PostgreSQL database

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://username:password@localhost:5432/sveltekit_auth
AUTH_SECRET=your-secret-key-here
AUTH_TRUST_HOST=true
```

Generate a secure `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Create database tables

```bash
npx drizzle-kit push
```

### 4. Seed admin user (optional)

```bash
npm run db:seed
```

This creates an admin account:
- **Email**: admin@example.com
- **Password**: admin123

### 5. Start development server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Route Structure

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/auth/login` | Guest only | Login form |
| `/auth/register` | Guest only | Registration form |
| `/dashboard` | Authenticated | User dashboard |
| `/dashboard/profile` | Authenticated | Profile & password management |
| `/admin` | Admin only | Admin dashboard with user management |

## Project Structure

```
src/
├── auth.ts                          # Auth.js configuration
├── hooks.server.ts                  # Request hooks (auth + route protection)
├── app.css                          # TailwindCSS entry
├── app.d.ts                         # Type augmentation
├── app.html                         # HTML template
├── lib/
│   ├── components/
│   │   └── Nav.svelte               # Navigation bar
│   └── server/
│       └── db/
│           ├── index.ts             # Drizzle client
│           └── schema.ts            # Database schema
└── routes/
    ├── +layout.svelte               # Root layout
    ├── +layout.server.ts            # Session loader
    ├── +page.svelte                 # Landing page
    ├── auth/
    │   ├── login/
    │   │   ├── +page.svelte         # Login form
    │   │   └── +page.server.ts      # Login action
    │   └── register/
    │       ├── +page.svelte         # Register form
    │       └── +page.server.ts      # Register action
    ├── dashboard/
    │   ├── +page.svelte             # Dashboard home
    │   └── profile/
    │       ├── +page.svelte         # Profile page
    │       └── +page.server.ts      # Profile actions
    └── admin/
        ├── +page.svelte             # Admin dashboard
        └── +page.server.ts          # Admin actions
```

## Database Schema

- **users** — id, name, email, emailVerified, image, password, role, createdAt, updatedAt
- **sessions** — sessionToken, userId, expires
- **accounts** — userId, type, provider, providerAccountId, tokens...
- **verification_tokens** — identifier, token, expires

## Authentication Architecture

This app uses Auth.js Credentials provider with **database sessions** instead of the default JWT strategy. This is achieved by:

1. Overriding `jwt.encode`/`jwt.decode` in Auth.js config
2. Manually creating DB sessions in the `signIn` callback
3. Using `DrizzleAdapter` for session storage and lookup

This gives us Auth.js's API surface while keeping sessions server-side in PostgreSQL.
