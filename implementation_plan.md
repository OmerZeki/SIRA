# Implementation Plan - Production Optimization, Full Localization, and OCR Upgrades

This plan details the steps required to optimize the SIRA Ethiopian overseas recruitment application for production, upgrade the OCR system to return 100% confidence for Google Vision annotations along with Amharic names, fix the dashboard charts and trends (removing hardcoded values), enable multi-language support (English, Arabic, Amharic) across all interface pages, and fix the portal integration triggers.

## User Review Required

> [!IMPORTANT]
> The database changes need to be applied via `npx prisma db push`.
> Environment variables for `GOOGLE_VISION_API_KEY`, `WORKER_WEBHOOK_SECRET`, and `CREDENTIALS_ENCRYPTION_KEY` must be set in production.

## Open Questions

No open questions. The requirements are fully detailed.

## Proposed Changes

---

### 1. Localization Dictionary & Page Routing

#### [MODIFY] [i18n.ts](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/lib/i18n.ts)
Expand the translations dictionary for `en`, `ar`, and `am` with the following keys:
- `landing`: Features, titles, descriptions, and taglines on the Home landing page.
- `dashboard`: All text headers, metrics labels, alert logs, and chart titles.
- `candidates`: Search parameters, status filters, and table headers.
- `settings`: Form titles and fields for agency profile, custom schema fields, and credentials vault.
- `form`: Inputs, section headers, validations, dropdown options, and skills list for candidate registration.

#### [MODIFY] [middleware.ts](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/middleware.ts)
- Modify the middleware so that requests with locale prefixes (e.g. `/ar/...`, `/am/...`) are rewritten to their normalized pathnames internally (e.g. `/...`) using `NextResponse.rewrite` while keeping the locale prefix in the browser's address bar. This will prevent 404 errors on localized routes since we do not use dynamic `[locale]` folders.

---

### 2. OCR Core Engine & Candidate Onboarding Form

#### [MODIFY] [ocr.ts](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/lib/ocr.ts)
- Override the calculated OCR confidence score to `1.0` (which is displayed as `100%`) when successfully parsed using Google Vision API (`google` provider) or when the MRZ checksum is valid.
- Extract the Amharic first and last name from the raw OCR text by scanning for lines with Amharic characters next to surname/given-name headers, or extracting non-header Amharic words as a fallback. Return `firstNameAmh` and `lastNameAmh` in the OCR result.

#### [MODIFY] [CandidateForm.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/components/sira/CandidateForm.tsx)
- Map `firstNameAmh` and `lastNameAmh` from the OCR complete event handler to populate the form fields.
- Localize all hardcoded labels, sections, dropdowns, and button text using the expanded dictionary.

---

### 3. Dashboard Analytics & Real-Time Data

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/(dashboard)/dashboard/page.tsx)
- Localize the dashboard overview, metrics cards, warning panels, stuck items, and automation log titles.
- Remove hardcoded `0` values for weekly onboarding counts and replace them with real database aggregation querying candidate registrations over the last 6 weeks.

#### [MODIFY] [DashboardCharts.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/components/sira/DashboardCharts.tsx)
- Ensure the chart titles, legend, and labels are fully compatible with English, Arabic RTL, and Amharic languages.

---

### 4. Candidates Page, Kanban Board & Detail Actions

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/(dashboard)/candidates/page.tsx)
- Localize the candidate search inputs, column headers, pagination controls, and button labels.

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/(dashboard)/candidates/kanban/page.tsx)
- Translate the pipeline kanban page header, sub-header, columns, empty states, and card attributes.

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/(dashboard)/candidates/[id]/page.tsx)
- Translate all headers, info fields, document labels, status history logs, and trigger buttons.
- Fix the LMIS automation trigger platform ID to `"ethiopian_lmis"`.
- Add tier-aware portal trigger buttons for Ethiopian LMIS, Wafid, Tawtheeq Musaned, EasyEnjaz, Tasheer, and Saudi MOFA.
- Send each portal's registry ID to `/api/automation/trigger`; MOFA creates a copy-paste packet only, with no browser automation.

#### [MODIFY] [trigger/route.ts](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/api/automation/trigger/route.ts)
- Attach a full field-ordered `candidatePacket` to every automation job so guided workers and operators can prefill external portals from saved profile data.
- Attach a dedicated `copyPastePacket` for Saudi MOFA in exact field order.
- Preserve the three automation tiers:
  - Full background: Ethiopian LMIS and Wafid.
  - Guided semi-automation: Tawtheeq Musaned, EasyEnjaz, and Tasheer.
  - Copy-paste helper: Saudi MOFA.

#### [ADD] [candidate-packet.ts](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/lib/candidate-packet.ts)
- Centralize the candidate profile packet used by portal jobs and exports.
- Include English names, Amharic names, passport details, biographical fields, personal details, job profile, medical fields, sponsor fields, and portal references.

---

### 5. Remaining Pages & Global Layouts

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/page.tsx)
- Translate all landing page elements including hero titles, buttons, feature cards, and footer links.

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/(dashboard)/settings/page.tsx)
- Localize the agency profile form inputs, saving status, and responses.

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/(dashboard)/settings/credentials/page.tsx)
- Localize the credentials vault fields, configured labels, visit portal links, and encryption details.

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/(dashboard)/settings/custom-fields/page.tsx)
- Localize the custom profile fields page and input elements.

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/(dashboard)/import/page.tsx)
- Localize the batch import dropzones, spreadsheet validation instructions, status states, and summaries.

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/(dashboard)/export/page.tsx)
- Localize the export center cards, stage filters, format selector, and downloading notifications.
- Add format selection for Excel, Word, and PDF downloads after candidate data is saved.

#### [ADD] [word/route.ts](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/api/export/word/route.ts)
- Generate a Word-compatible candidate profile packet using the same ordered candidate fields as portal jobs.

#### [ADD] [pdf/route.ts](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/api/export/pdf/route.ts)
- Generate a PDF candidate profile packet for agency/Saudi partner review.

#### [MODIFY] [excel/route.ts](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/api/export/excel/route.ts)
- Expand Excel exports with Amharic name fields and portal tracking fields.

#### [MODIFY] [page.tsx](file:///c:/Users/Sara/OneDrive/Documents/Sira/src/app/(dashboard)/automation/page.tsx)
- Localize the automation queue page tables, logs, statuses, and refreshing actions.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify that Next.js successfully compiles and packages all dynamic routes.

### Manual Verification
- Test language switching via the selector to ensure layout shifts direction for Arabic (`dir="rtl"`) and renders all translated texts for Arabic and Amharic.
- Upload a passport image to test OCR processing, verifying that the confidence score outputs as `100%` and automatically populates English and Amharic names in the registration form.
- Click the "Run LMIS Automation" and "Run Musaned Automation" buttons to confirm they queue correctly on the server side.
- Validate that the dark/light mode toggle adjusts all dashboard cards, text, and charts properly.
