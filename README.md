# گفتان - Goftaan

Smart Meeting Management - مدیریت هوشمند جلسات

Record meeting audio, transcribe to text, and generate AI-powered summaries, key points, and action items.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Next.js API Routes (Route Handlers)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password)
- **AI:** OpenRouter (GPT-4o-mini / Gemini)
- **Speech:** AssemblyAI (pre-recorded) + Browser Web Speech API (live)
- **Storage:** Supabase Storage (audio recordings)
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

1. Node.js 18+
2. pnpm
3. Supabase project ([supabase.com](https://supabase.com))
4. OpenRouter API key ([openrouter.ai](https://openrouter.ai))
5. AssemblyAI API key ([assemblyai.com](https://assemblyai.com))

### Setup

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd goftaan
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
    - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
    - `OPENROUTER_API_KEY` - Your OpenRouter API key
    - `OPENROUTER_MODEL` - AI model (default: `openai/gpt-4o-mini`)
    - `ASSEMBLYAI_API_KEY` - Your AssemblyAI API key

3. **Set up database:**
   - Go to Supabase Dashboard > SQL Editor
   - Run the migration script from `supabase/migrations/001_initial_schema.sql`

4. **Run development server:**
   ```bash
   pnpm dev
   ```

5. **Open:** [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push to GitHub/GitLab/Bitbucket
2. Import project in Vercel Dashboard
3. Add environment variables
4. Deploy

All API routes work as serverless functions. The database connection uses Supabase's HTTP client (no direct PostgreSQL connection needed).

## Project Structure

```
goftaan/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── (dashboard)/        # Dashboard pages
│   │   │   ├── meetings/       # Meeting list, detail, recording
│   │   │   ├── analytics/      # Analytics dashboard
│   │   │   └── settings/       # User settings
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── ui/                 # UI primitives (shadcn-style)
│   │   ├── meetings/           # Meeting components
│   │   └── shared/             # Shared components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities & services
│   │   ├── supabase/           # Supabase client setup
│   │   └── services/           # AI & speech services
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
└── public/
    └── fonts/                  # Vazir Persian fonts
```

## Features

- Email/password authentication (Supabase Auth)
- Manual meeting creation
- Audio recording (MediaRecorder API)
- Live speech recognition (Web Speech API)
- AI transcription and summarization
- Analytics dashboard with charts
- RTL Persian interface
- Responsive design (mobile, tablet, desktop)
- Vazir Persian font

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `OPENROUTER_MODEL` | No | AI model (default: openai/gpt-4o-mini) |
| `ASSEMBLYAI_API_KEY` | Yes | AssemblyAI API key for speech-to-text |
