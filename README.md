# Synapse AI - RAG-Powered Chat Application

A full-stack SvelteKit application with Retrieval-Augmented Generation (RAG) using pgvector, a Python embedding microservice, and a polished dark-themed UI. Built for Assignment 3.

## Features

- **RAG Backend** - pgvector-backed document ingestion, chunking, embedding, and retrieval
- **Python Embedding Service** - Containerized FastAPI microservice using `sentence-transformers/all-MiniLM-L6-v2`
- **Synapse AI Chat** - Streaming AI chat powered by Google Gemini via Vercel AI SDK
- **Citations** - AI responses cite source documents with `[Source N]` badges
- **Tree-Structured Chat History** - Edit/regenerate creates branches (GPT-style forking), persisted to DB
- **Syntax Highlighting** - Code blocks highlighted with highlight.js, with copy buttons
- **Knowledge Base** - Upload `.txt`, `.md`, `.csv` files; documents are chunked, embedded, and indexed
- **Auth.js** - Email/password + Google & GitHub OAuth with database sessions
- **RBAC** - Admin dashboard with user management
- **Email Flows** - Verification and password reset via SMTP
- **Accessibility** - Keyboard navigable, aria-labels, focus outlines
- **Search/Filter** - Search through chat history

## Tech Stack

- **Framework**: SvelteKit 2 + Svelte 5 (runes syntax)
- **AI**: Vercel AI SDK + Google Gemini (`gemini-2.5-flash`)
- **Database**: PostgreSQL with pgvector extension (via Docker)
- **ORM**: Drizzle ORM
- **Embeddings**: Python FastAPI + sentence-transformers (384-dim vectors)
- **Auth**: Auth.js (`@auth/sveltekit`) with database sessions
- **Styling**: TailwindCSS v4 + `@tailwindcss/typography`
- **Markdown**: marked + highlight.js

## Prerequisites

- Node.js 18+ and pnpm
- Docker & Docker Compose

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/hassanshahid-crypto/assignment-3.git
cd assignment-3
cp .env.example .env
```

Edit `.env` and set your secrets:
- `AUTH_SECRET` - generate with `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - from [Google Cloud Console](https://console.cloud.google.com)
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` - from [GitHub Developer Settings](https://github.com/settings/developers)
- `GOOGLE_GENERATIVE_AI_API_KEY` - from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `SMTP_USER` / `SMTP_PASS` - Gmail app password for email flows

### 2. Start Docker services

```bash
docker compose up -d
```

This starts:
- **pgvector** PostgreSQL on port `5433`
- **embed-api** Python embedding service on port `8000`

### 3. Install dependencies and set up database

```bash
pnpm install
pnpm db:push
pnpm db:seed    # Optional: creates admin@example.com / admin123
```

### 4. Run development server

```bash
pnpm dev
```

Visit `http://localhost:5173`

### 5. Verify

- `http://localhost:5173/healthz` - Health check
- `http://localhost:5173/version` - Version info

## Route Structure

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/auth/login` | Guest | Login (email/password + OAuth) |
| `/auth/register` | Guest | Registration |
| `/auth/forgot-password` | Guest | Password reset request |
| `/auth/verify-email` | Public | Email verification |
| `/dashboard` | Authenticated | User dashboard |
| `/dashboard/chat` | Authenticated | Synapse AI chat with RAG |
| `/dashboard/profile` | Authenticated | Profile management |
| `/admin` | Admin only | Admin dashboard |
| `/healthz` | Public | Health check endpoint |
| `/version` | Public | Version endpoint |

## Architecture

```
Browser (SvelteKit)
    |
    |-- /api/chat        --> Gemini API (streaming) + pgvector retrieval
    |-- /api/documents   --> Document ingestion pipeline
    |-- /api/chats       --> Chat CRUD + branch persistence
    |
    |-- embed-api:8000   --> Python FastAPI (sentence-transformers)
    |
    +-- pgvector:5433    --> PostgreSQL + vector similarity search
```

### RAG Pipeline

1. **Upload** - User uploads a text file via the Knowledge tab
2. **Chunk** - File is split into ~500 character chunks
3. **Embed** - Each chunk is sent to the Python embedding service (384-dim vectors)
4. **Store** - Chunks and embeddings are stored in pgvector with HNSW index
5. **Retrieve** - On each chat message, the query is embedded and top-5 similar chunks are fetched
6. **Generate** - Retrieved context is injected into the system prompt for Gemini

### Database Schema

- `users` - User accounts with roles
- `sessions` / `accounts` - Auth.js session and OAuth storage
- `chats` - Chat threads with branch data (`editVersions`)
- `chat_messages` - Individual messages with timestamps
- `documents` - Uploaded document metadata
- `chunks` - Text chunks from documents
- `embeddings` - 384-dim vectors with HNSW index for cosine similarity
- `email_verification_tokens` / `password_reset_tokens` - Auth token storage

## Environment Variables

See `.env.example` for the full list with descriptions.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:seed` | Seed admin user |
| `pnpm check` | Type-check with svelte-check |
