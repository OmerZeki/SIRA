# Architecture & Core Patterns

## Tech Stack

- **Framework**: Next.js 14 App Router
- **Styling**: Tailwind CSS + Linear-inspired dark canvas variables
- **Database**: Neon PostgreSQL through Prisma 7 and `@prisma/adapter-pg`
- **Auth**: Auth.js / NextAuth v5 with Prisma adapter
- **File Storage**: Cloudinary secure URLs
- **OCR Engine**: OCR.space default, optional Google Vision via `OCR_PROVIDER=google`
- **LLM Enrichment**: Groq API with local fallback parsing
- **Excel Engine**: ExcelJS
- **Background Workers**: Playwright workers and guided portal sessions
- **Portal Registry**: `src/lib/portals.ts`
- **i18n**: English, Arabic RTL, Amharic dictionaries in `src/lib/i18n.ts`

## Core UI Rules

- Dark canvas: `#010102`
- Accent color: lavender `#5e6ad2`
- Cards: `#0f1011` with 1px `#23252a` border
- Typography: Inter with Amharic/Arabic fallback through system fonts
- Arabic routes must render with `dir="rtl"`

## Production Safety Rules

- Do not reintroduce Supabase as a required service.
- Do not commit real credentials to docs or env examples.
- Do not fully automate Saudi MOFA; generate copy-paste packets only.
- Use HMAC-signed worker webhooks.
- Portal workers must use per-agency encrypted portal vault credentials from the database, never shared global portal usernames/passwords.
- QStash worker dispatch forwards an internal `x-sira-worker-secret` header that must match `WORKER_WEBHOOK_SECRET`.
- `CREDENTIALS_ENCRYPTION_KEY` is mandatory in production; only local development may use a fallback key.
