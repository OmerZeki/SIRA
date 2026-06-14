# SIRA Production Infrastructure Guide

## Production Stack

SIRA is configured for:

| Layer | Production Choice | Notes |
| --- | --- | --- |
| App | Next.js 14 App Router | Deploy on Vercel or another Node-compatible host |
| Database | Neon PostgreSQL | Use pooled `DATABASE_URL` and direct `DIRECT_URL` |
| ORM | Prisma 7 | Uses `@prisma/adapter-pg` |
| Files | Cloudinary | Candidate documents, photos, screenshots, generated assets |
| OCR | OCR.space default | Google Vision optional via `OCR_PROVIDER=google` |
| Auth | Auth.js / NextAuth v5 | Credentials provider with Prisma adapter |
| Queue | Upstash QStash | Worker dispatch for portal jobs |
| Workers | Playwright Node workers | LMIS and Wafid full background; guided portals by operator session |
| Email | SMTP via Nodemailer | Brevo, Zoho, Gmail, Mailgun, SES, or equivalent |

## Required Environment Variables

Copy `.env.example` to `.env` and fill in real values. Never commit production secrets.

```env
DATABASE_URL=""
DIRECT_URL=""
AUTH_SECRET=""
NEXTAUTH_URL="https://your-domain.com"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
OCR_PROVIDER="ocrspace"
OCR_SPACE_API_KEY=""
GOOGLE_VISION_API_KEY=""
GROQ_API_KEY=""
REMOVE_BG_API_KEY=""
QSTASH_TOKEN=""
QSTASH_URL=""
WORKER_URL=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""
CREDENTIALS_ENCRYPTION_KEY=""
WORKER_WEBHOOK_SECRET=""
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

Generate secrets locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the generated 64-character hex value for `CREDENTIALS_ENCRYPTION_KEY`. Generate a separate random value for `WORKER_WEBHOOK_SECRET`.

## Neon Setup

1. Create a Neon project.
2. Set `DATABASE_URL` to the pooled connection string.
3. Set `DIRECT_URL` to the direct connection string.
4. Run:

```powershell
npx prisma validate
npx prisma db push
npm run build
```

## Cloudinary Setup

1. Create a Cloudinary account.
2. Copy Cloud name, API key, and API secret into environment variables.
3. Keep Cloudinary upload credentials server-only.
4. Candidate files are stored under `sira/{agencyId}/...` paths through `src/lib/storage.ts`.

## OCR Setup

Default:

```env
OCR_PROVIDER="ocrspace"
OCR_SPACE_API_KEY=""
```

Premium fallback:

```env
OCR_PROVIDER="google"
GOOGLE_VISION_API_KEY=""
```

Google Vision is configured as an optional adapter. OCR.space remains the default because it matches the free-tier production plan.

## Portal Automation Policy

| Portal | URL | Tier | Production Policy |
| --- | --- | --- | --- |
| Ethiopian LMIS | `https://lmis.gov.et` | Full background | Playwright worker can submit and capture references |
| Wafid | `https://wafid.com/en/medical-status-search/` | Full background | Read-only medical status polling |
| Tawtheeq Musaned | `https://tawtheeq.musaned.com.sa/` | Guided semi-automation | Prefill, agent reviews, solves challenges, submits |
| EasyEnjaz | `https://www.easyenjaz.net/` | Guided semi-automation | Prefill and reference capture; agent handles sensitive steps |
| Tasheer | `https://vc.tasheer.com/home` | Guided semi-automation | Appointment/application helper; agent confirms |
| Saudi MOFA | `https://visa.mofa.gov.sa/` | Copy-paste helper | No full automation; generates ordered field packet |

This policy protects agency accounts from portal lockouts while still reducing manual work.

## Worker Webhook Security

Worker callbacks to `/api/workers/webhook` must include:

```text
x-sira-worker-signature: sha256=<hex_hmac>
```

The HMAC is computed over the raw JSON body using `WORKER_WEBHOOK_SECRET`.

## Deployment Checklist

- `npm run build` passes.
- `npx prisma validate` passes.
- Neon schema is applied.
- Cloudinary credentials are set in the hosting platform.
- OCR provider credentials are set.
- `AUTH_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, and `WORKER_WEBHOOK_SECRET` are unique and rotated if ever exposed.
- Portal automation remains aligned with the safe tier policy above.
