# SIRA — ሥራ | Autonomous Ethiopian Overseas Recruitment

SIRA is a production web platform for Ethiopian recruitment agencies sending domestic workers to Saudi Arabia. It turns passport scans, candidate photos, notes, documents, medical checks, LMIS registration, Saudi portal preparation, and export packets into one controlled workflow.

## Project Phases

### Phase 1 (Now — Own the Core) 
- **LMIS automation**: Make it 99.9% reliable (retry logic, CAPTCHA handling, session recovery) 
- **Musaned automation**: Same as above — this is your golden feature 
- **Enjaz/EasyEnjaz prefill**: Reduce manual data entry from hours to seconds 
- **Wafid (GAMCA) integration**: Medical test scheduling automation 
- **MOFA packet assembly**: One-click document generation for the full Saudi visa packet 

### Phase 2 (Scale the Niche) 
- **Agency white-labeling**: Let agencies use their own domain and logo 
- **Recruitment code marketplace**: Sell codes via resellers 
- **Agent mobile app**: Scan passports directly from a phone camera 
- **Analytics for regulators**: Ethiopian government reporting dashboards 

### Phase 3 (Expand Horizontally) 
- **UAE corridor**: Add Tasheer (UAE WPS), AMER, and Tadbeer portal automation 
- **Qatar corridor**: Add Qatar Visa Center (QVC) automation 
- **Generic pipeline module**: Only now abstract the status pipeline for new countries 

### Phase 4 (Network Effects) 
- **Inter-agency talent pool**: Agencies share rejected candidates (with consent) 
- **Partner commission tracking**: Track who sourced which candidate 
- **Employer KSA portal**: Let Saudi employers directly browse verified candidates 

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Stack

- **Framework**: Next.js 14 App Router
- **Database**: Neon PostgreSQL through Prisma
- **File storage**: Cloudinary secure URLs
- **Auth**: Auth.js / NextAuth v5 credentials auth with agency tenancy
- **OCR**: OCR.space default; Google Vision optional
- **AI parsing**: Groq for multilingual notes parsing
- **Queue**: Upstash QStash
- **Workers**: Node Playwright workers

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
