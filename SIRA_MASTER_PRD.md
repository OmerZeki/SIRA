# SIRA Master PRD v3.0

## Product Summary

SIRA is a production web platform for Ethiopian recruitment agencies sending domestic workers to Saudi Arabia. It turns passport scans, candidate photos, notes, documents, medical checks, LMIS registration, Saudi portal preparation, and export packets into one controlled workflow.

**Core promise:** from passport to placement with fewer errors, less duplicate typing, and safer portal operations.

## Strategic Requirements

- Serve Ethiopian agencies that process workers for Saudi Arabia.
- Support English, Arabic, and Amharic across the first production release.
- Use Neon PostgreSQL for the database and Cloudinary for files.
- Use OCR.space as the default OCR provider with optional Google Vision OCR fallback.
- Keep portal automation safe: full automation only where reliable, guided sessions for risky portals, and copy-paste helper for MOFA.
- Provide an editable PRD source plus a regenerated PDF so future corrections are simple.

## Production Architecture

| Layer | Requirement |
| --- | --- |
| Framework | Next.js 14 App Router |
| Database | Neon PostgreSQL through Prisma |
| File storage | Cloudinary secure URLs |
| Auth | Auth.js / NextAuth v5 credentials auth with agency tenancy |
| OCR | OCR.space default; Google Vision optional |
| AI parsing | Groq for multilingual notes parsing |
| Queue | Upstash QStash |
| Workers | Node Playwright workers |
| Documents | Editable DOCX/HTML source and regenerated PDF |
| Languages | English `en`, Arabic `ar` with RTL, Amharic `am` |

## Core Users

- **Agency owner:** manages subscription, users, credentials, and exports.
- **Manager:** reviews pipeline, fixes exceptions, approves submissions.
- **Agent:** creates candidates, uploads documents, runs guided portal tasks.
- **Viewer:** reads candidate status and export history.

## Candidate Workflow

1. Agent creates a candidate.
2. Agent uploads passport scan, passport photo, full-body photo, medical report, certificates, and CV.
3. SIRA compresses images and uploads files to Cloudinary.
4. OCR extracts passport fields.
5. Notes parser converts English, Arabic, or Amharic notes into structured form data.
6. Agent validates candidate data and saves.
7. Pipeline moves through:
   - `REGISTERED`
   - `MEDICAL_APPROVED`
   - `LMIS_CLEAR`
   - `MUSANED_CONTRACTED`
   - `ENJAZ_COMPLETED`
   - `FLIGHT_READY`
   - `ON_HOLD`
   - `REJECTED`
8. Portal jobs are queued according to the automation tier.
9. Candidate exports and document packets are generated for agency/Saudi partner use.

## OCR Requirements

### Default Provider: OCR.space

- Environment: `OCR_PROVIDER=ocrspace`.
- Uses `OCR_SPACE_API_KEY`.
- Extracts MRZ and fallback text fields.
- Returns provider metadata and confidence score.

### Optional Provider: Google Vision

- Environment: `OCR_PROVIDER=google`.
- Uses `GOOGLE_VISION_API_KEY` or Google credentials.
- Supports English, Arabic, and Amharic language hints.
- Returns the same normalized passport response shape.

### Response Contract

`POST /api/ocr/passport` returns:

```ts
{
  provider: "ocrspace" | "google";
  passportNumber: string;
  surname: string;
  givenNames: string[];
  nationality: string;
  dateOfBirth: string;
  dateOfIssue: string;
  dateOfExpiry: string;
  gender: "M" | "F";
  placeOfBirth: string;
  issuingCountry: string;
  confidenceScore: number;
  warnings?: string[];
}
```

If confidence is below `0.70`, the UI must require manual review.

## File Storage Requirements

- All candidate files are uploaded to Cloudinary.
- Upload API remains `POST /api/upload/document`.
- Response shape remains `{ url: string }`.
- Cloudinary URLs are stored in the applicant record.
- Files are grouped by agency and document slot.
- No Supabase storage dependency is required.

## Multilingual Requirements

SIRA supports:

- English: default interface and fallback.
- Arabic: RTL interface, Saudi portal terminology, Arabic-facing document labels.
- Amharic: Ethiopian agency workflow labels and candidate identity fields.

Implementation requirements:

- Locale URLs: `/`, `/ar/...`, `/am/...`.
- `NEXT_LOCALE` cookie persists language choice.
- `html lang` and `dir` must match locale.
- Shared navigation, status badges, document labels, forms, validation messages, exports, portal actions, settings, auth pages, and dashboard cards must use dictionaries.

## Portal Integration Model

### Automation Tiers

| Tier | Meaning | Used For |
| --- | --- | --- |
| Full background | Worker can complete the task without human review | Ethiopian LMIS, Wafid status lookup |
| Guided semi-automation | SIRA prefills and opens/replays a guided session; agent submits | Tawtheeq Musaned, EasyEnjaz, Tasheer |
| Copy-paste helper | No browser automation; SIRA prepares ordered fields | Saudi MOFA |

### Portal Registry

| Portal | URL | Tier | SIRA Behavior |
| --- | --- | --- | --- |
| Ethiopian LMIS | `https://lmis.gov.et` | Full background | Register candidate, upload documents, capture reference |
| Wafid | `https://wafid.com/en/medical-status-search/` | Full background | Poll medical status by passport details |
| Tawtheeq Musaned | `https://tawtheeq.musaned.com.sa/` | Guided semi-automation | Prefill contract and open review session |
| EasyEnjaz | `https://www.easyenjaz.net/` | Guided semi-automation | Prefill application and capture reference |
| Tasheer | `https://vc.tasheer.com/home` | Guided semi-automation | Appointment/application helper |
| Saudi MOFA | `https://visa.mofa.gov.sa/` | Copy-paste helper | Generate exact field-order packet |

### Portal API

`POST /api/automation/trigger`

```ts
{
  applicantId: string;
  platform:
    | "ethiopian_lmis"
    | "wafid"
    | "tawtheeq_musaned"
    | "easyenjaz"
    | "tasheer"
    | "mofa";
}
```

The API validates the portal registry, creates an automation job, records the automation tier, and queues only safe worker jobs.

## Worker Security

- Worker callbacks use `POST /api/workers/webhook`.
- Workers must sign the raw JSON body with HMAC-SHA256.
- Header: `x-sira-worker-signature: sha256=<hex>`.
- Shared secret: `WORKER_WEBHOOK_SECRET`.
- The webhook rejects missing, malformed, or invalid signatures.

## Candidate Document Template Requirement

The provided `AMENECH AKALO MANGO ..pdf` is a one-page candidate profile/CV template. SIRA must support document packets with:

- Full name.
- Passport number, issue date, expiry date, issue place.
- Nationality, gender, religion, age/date of birth.
- Language, marital status, education.
- Height/weight, number of children.
- Contract period, monthly salary, position.
- Experience rows: country, position, period.
- Skills: washing, cleaning, cooking, babysitter, and other agency-defined skills.
- Arabic-facing labels and export formatting.
- Candidate photo and passport scan assets from Cloudinary.

## Data Model Requirements

- Agencies own users, applicants, custom fields, exports, automation jobs, and credentials.
- Portal credentials are encrypted at application level with AES-256-GCM.
- Applicant records include biographical, personal, professional, skills, compliance, OCR metadata, and custom JSON fields.
- `AutomationJob.jobType` uses portal registry job types.
- `AutomationJob.resultData` stores portal metadata, captured references, fallback notes, and operator instructions.

## Production Security Requirements

- Never commit credentials in `.env.example`, docs, PRD, or source.
- Rotate any secret that was ever committed or shared.
- Keep portal credentials encrypted and server-only.
- Validate every auth-protected API by agency ownership.
- Use HMAC for worker webhooks.
- Treat MOFA as copy-paste helper only to reduce lockout risk.
- Log automation failures without exposing passwords or private document URLs.

## Acceptance Criteria

- `npm run build` passes.
- `npx prisma validate` passes.
- No stale provider claims remain in production docs.
- Neon and Cloudinary are the only required database/file providers.
- OCR.space works as default; Google Vision can be selected by env.
- The portal registry includes all required portals.
- Arabic routes render with RTL direction.
- English, Arabic, and Amharic are selectable.
- Upload, OCR, applicant CRUD, export, automation trigger, and worker webhook paths are smoke-tested.
- PRD exists as Markdown, editable DOCX/HTML source, and regenerated PDF.

## Implementation Notes For IDE AI Agent

1. Do not add Supabase dependencies.
2. Do not fully automate MOFA.
3. Do not bypass human review for CAPTCHA/payment-sensitive portals.
4. Keep UI changes consistent with the Linear-inspired dark canvas design.
5. Preserve existing route contracts unless this PRD explicitly changes them.
6. Add tests around provider selection, portal registry validation, worker signatures, and locale helpers.

