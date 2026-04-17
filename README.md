# Sika Public Document Repository — POC (No Docker)

## Prerequisites — install these once

1. **Node.js LTS** → https://nodejs.org
2. **MongoDB Community** → https://www.mongodb.com/try/download/community
   - Install with "Run as Service" checked — starts automatically

## Setup & Run

### Terminal 1 — Backend
```
cd backend
copy .env.example .env        (Windows)
cp .env.example .env          (Mac/Linux)
npm install
npm run dev
```
API runs at: http://localhost:3001

### Terminal 2 — Frontend
```
cd frontend
copy .env.local.example .env.local        (Windows)
cp .env.local.example .env.local          (Mac/Linux)
npm install
npm run dev
```
UI runs at: http://localhost:3000

## How to use

1. Go to http://localhost:3000/admin
2. Upload a PDF → fill in slug, product code, name → set status to "published"
3. Go to http://localhost:3000 → search for your document
4. Click it → see the PDF viewer + version history + stable URLs

## API quick test
```
# Upload a document
curl -X POST http://localhost:3001/admin/documents \
  -H "x-api-key: sika-admin-secret-change-in-prod" \
  -F "slug=sikaflex-221--tds-en" \
  -F "productCode=SikaFlex-221" \
  -F "productName=SikaFlex-221 Polyurethane Sealant" \
  -F "versionNumber=1.0" \
  -F "documentType=TDS" \
  -F "language=EN" \
  -F "status=published" \
  -F "file=@C:\path\to\document.pdf"
```

## File storage
PDFs are saved to: `backend/uploads/:slug/:uuid.pdf`
No cloud storage needed for POC.

## Slug naming convention
Format: {product-code}--{doc-type}-{language}
Examples:
  sikaflex-221--tds-en
  sika-top-122--sds-de
  sikabond-t2--dopc-fr
