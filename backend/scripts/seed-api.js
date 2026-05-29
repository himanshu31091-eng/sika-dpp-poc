/**
 * HTTP-based seed script — posts sample documents to the live backend API.
 * Works against any deployment without needing direct DB/S3 access.
 *
 * Usage:
 *   node scripts/seed-api.js
 *   BACKEND_URL=https://sika-dpp-backend-2.onrender.com node scripts/seed-api.js
 */

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const BACKEND_URL = process.env.BACKEND_URL || 'https://sika-dpp-backend-2.onrender.com';
const ADMIN_KEY   = process.env.ADMIN_KEY   || 'sika-admin-secret-2026';

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLES = [
  {
    slug: 'sikaflex-221--tds-en',
    productCode: 'Sikaflex-221',
    productName: 'Sikaflex-221 Multi-Purpose Adhesive Sealant',
    productCategory: 'Sealing & Bonding',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'TDS', language: 'EN', title: 'Technical Data Sheet -- Sikaflex-221' },
    ],
  },
  {
    slug: 'sikaflex-221--sds-en',
    productCode: 'Sikaflex-221',
    productName: 'Sikaflex-221 Multi-Purpose Adhesive Sealant',
    productCategory: 'Sealing & Bonding',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'SDS', language: 'EN', title: 'Safety Data Sheet -- Sikaflex-221' },
    ],
  },
  {
    slug: 'sikaflex-221--dopc-en',
    productCode: 'Sikaflex-221',
    productName: 'Sikaflex-221 Multi-Purpose Adhesive Sealant',
    productCategory: 'Sealing & Bonding',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'DoPC', language: 'EN', title: 'Declaration of Performance & Conformity -- Sikaflex-221' },
    ],
  },
  {
    slug: 'sikatop-107--tds-en',
    productCode: 'SikaTop-107',
    productName: 'SikaTop-107 Waterproofing Mortar',
    productCategory: 'Waterproofing',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'TDS', language: 'EN', title: 'Technical Data Sheet -- SikaTop-107' },
      { versionNumber: '2.0', documentType: 'TDS', language: 'EN', title: 'Technical Data Sheet -- SikaTop-107 (Revised)' },
    ],
  },
  {
    slug: 'sikatop-107--sds-de',
    productCode: 'SikaTop-107',
    productName: 'SikaTop-107 Waterproofing Mortar',
    productCategory: 'Waterproofing',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'SDS', language: 'DE', title: 'Sicherheitsdatenblatt -- SikaTop-107' },
    ],
  },
  {
    slug: 'sikabond-t8--technical-en',
    productCode: 'SikaBond-T8',
    productName: 'SikaBond-T8 Elastic Bonding Adhesive',
    productCategory: 'Flooring',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'Technical', language: 'EN', title: 'Technical Guide -- SikaBond-T8' },
    ],
  },
  {
    slug: 'sikabond-t8--label-en',
    productCode: 'SikaBond-T8',
    productName: 'SikaBond-T8 Elastic Bonding Adhesive',
    productCategory: 'Flooring',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'Label', language: 'EN', title: 'Product Label -- SikaBond-T8' },
    ],
  },
  {
    slug: 'sikafloor-264--tds-fr',
    productCode: 'SikaFloor-264',
    productName: 'SikaFloor-264 Epoxy Floor Coating',
    productCategory: 'Flooring',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'TDS', language: 'FR', title: 'Fiche Technique -- SikaFloor-264' },
    ],
  },
  {
    slug: 'sikafloor-264--sds-en',
    productCode: 'SikaFloor-264',
    productName: 'SikaFloor-264 Epoxy Floor Coating',
    productCategory: 'Flooring',
    status: 'draft',
    versions: [
      { versionNumber: '1.0', documentType: 'SDS', language: 'EN', title: 'Safety Data Sheet -- SikaFloor-264' },
    ],
  },
  {
    slug: 'sika-anchorfix-1--dopc-en',
    productCode: 'Sika-AnchorFix-1',
    productName: 'Sika-AnchorFix-1 Styrene-Free Anchor Adhesive',
    productCategory: 'Concrete',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'DoPC', language: 'EN', title: 'Declaration of Performance -- Sika-AnchorFix-1' },
    ],
  },
  {
    slug: 'sika-anchorfix-1--tds-de',
    productCode: 'Sika-AnchorFix-1',
    productName: 'Sika-AnchorFix-1 Styrene-Free Anchor Adhesive',
    productCategory: 'Concrete',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'TDS', language: 'DE', title: 'Technisches Merkblatt -- Sika-AnchorFix-1' },
    ],
  },
];

// ─── PDF generator ────────────────────────────────────────────────────────────

function san(str) {
  return String(str)
    .replace(/≥/g, '>=').replace(/≤/g, '<=')
    .replace(/—/g, '--').replace(/–/g, '-')
    .replace(/[^\x00-\xFF]/g, '?');
}

function buildContent(docType, productCode, productName, version) {
  if (docType === 'SDS') return [
    { heading: '1. IDENTIFICATION', lines: [`Product: ${productCode}`, 'Use: Construction adhesive/sealant', 'Supplier: Sika AG, Zurich, Switzerland'] },
    { heading: '2. HAZARDS IDENTIFICATION', lines: ['Classification: Not classified as hazardous', 'Signal word: None'] },
    { heading: '3. COMPOSITION', lines: ['No hazardous substances above regulatory thresholds (EU CLP).'] },
    { heading: '8. EXPOSURE CONTROLS', lines: ['Respiratory: Not required under normal use', 'Hands: Chemical-resistant gloves recommended'] },
    { heading: '15. REGULATORY INFORMATION', lines: ['Complies with Regulation (EC) No 1907/2006 (REACH)', 'and Regulation (EC) No 1272/2008 (CLP/GHS).'] },
  ];
  if (docType === 'DoPC') return [
    { heading: 'DECLARATION OF PERFORMANCE / CONFORMITY', lines: [`No.: ${productCode}-DoPC-${version}`, `Product: ${productName}`] },
    { heading: 'INTENDED USE', lines: ['Sealant for construction works -- joints, facades, glazing.', 'EU Construction Products Regulation (CPR) No. 305/2011.'] },
    { heading: 'ESSENTIAL CHARACTERISTICS', lines: ['Reaction to fire: Class E', 'Air permeability: Class 600 at +/-12.5%', 'Water tightness: Passed', 'REACH: Compliant'] },
    { heading: 'DECLARATION', lines: ['Performance is in conformity with declared values.', 'Issued under sole responsibility of the manufacturer.', 'Sika AG, Zurich, Switzerland'] },
  ];
  if (docType === 'Label') return [
    { heading: 'PRODUCT LABEL', lines: [`${productName}`, `Article: ${productCode}`] },
    { heading: 'DIRECTIONS FOR USE', lines: ['1. Substrate must be clean, dry and free of contaminants.', '2. Apply with notched trowel.', '3. Install floor covering within 20 minutes.', '4. Allow 24h before foot traffic.'] },
    { heading: 'STORAGE', lines: ['Store between +5C and +30C in sealed containers.', 'Shelf life: 12 months.'] },
  ];
  if (docType === 'Technical') return [
    { heading: 'PRODUCT OVERVIEW', lines: [`${productName}`, 'One-component elastic adhesive based on MS-Polymer.'] },
    { heading: 'SUBSTRATE PREPARATION', lines: ['Substrates must be clean and free from contamination.', 'Residual moisture <= 2.0 CM%.'] },
    { heading: 'APPLICATION', lines: ['Apply with Sika notched trowel (A2 or B11).', 'Lay floor covering within open time (15-25 min at +23C).'] },
    { heading: 'PERFORMANCE DATA', lines: ['Shear strength: >= 1.0 N/mm2 after 28d', 'Temperature resistance: -40 to +80 deg C'] },
  ];
  return [
    { heading: '1. PRODUCT DESCRIPTION', lines: [`${productName}`, `${productCode} is a high-performance product for construction.`] },
    { heading: '2. USES', lines: ['Bonding, sealing and protecting construction joints', 'Interior and exterior applications'] },
    { heading: '3. PRODUCT DATA', lines: ['Appearance: Paste', 'Shelf life: 12 months', `Version: ${version}`] },
    { heading: '4. TECHNICAL DATA', lines: ['Density: approx. 1.30 kg/l', 'Shore A hardness: approx. 25', 'Tensile strength: >= 0.6 N/mm2', 'Elongation at break: >= 400%'] },
    { heading: '5. SYSTEM INFORMATION', lines: ['Single-component, no mixing required.', 'Application temperature: +5C to +40C'] },
  ];
}

async function createPdf(productCode, productName, docType, language, version, title) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const yellow = rgb(0.988, 0.753, 0.027);
  const black = rgb(0, 0, 0);
  const grey = rgb(0.5, 0.5, 0.5);
  const dark = rgb(0.2, 0.2, 0.2);

  page.drawRectangle({ x: 0, y: 792, width: 595, height: 50, color: yellow });
  page.drawText('SIKA', { x: 24, y: 808, size: 22, font: bold, color: black });
  page.drawText('BUILDING TRUST', { x: 460, y: 812, size: 8, font, color: black });
  page.drawRectangle({ x: 0, y: 789, width: 595, height: 3, color: rgb(0.85, 0.65, 0) });

  page.drawText(san(docType), { x: 24, y: 762, size: 9, font: bold, color: grey });
  page.drawText(san(`  |  ${language}  |  v${version}`), { x: 24 + bold.widthOfTextAtSize(san(docType), 9), y: 762, size: 9, font, color: grey });
  page.drawText(san(title), { x: 24, y: 735, size: 15, font: bold, color: black });
  page.drawText(san(productName), { x: 24, y: 715, size: 11, font, color: dark });
  page.drawText(san(`Product Code: ${productCode}`), { x: 24, y: 698, size: 10, font, color: grey });
  page.drawLine({ start: { x: 24, y: 685 }, end: { x: 571, y: 685 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });

  let y = 668;
  for (const { heading, lines } of buildContent(docType, productCode, productName, version)) {
    if (y < 60) break;
    page.drawText(san(heading), { x: 24, y, size: 10, font: bold, color: black });
    y -= 15;
    for (const line of lines) {
      if (y < 60) break;
      page.drawText(san(line), { x: 24, y, size: 9, font, color: dark });
      y -= 13;
    }
    y -= 6;
  }

  page.drawLine({ start: { x: 24, y: 35 }, end: { x: 571, y: 35 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  page.drawText(san(`(c) Sika AG -- ${productCode} -- ${docType} -- ${language} -- v${version} -- Sample document for POC`),
    { x: 24, y: 22, size: 7, font, color: grey });

  return Buffer.from(await pdfDoc.save());
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiUpload(fields, pdfBuffer, fileName) {
  const { FormData, Blob } = await import('node:buffer').then(() => ({ FormData: globalThis.FormData, Blob: globalThis.Blob })).catch(() => ({}));

  // Use Node 18+ built-in FormData + Blob
  const form = new globalThis.FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append('file', new globalThis.Blob([pdfBuffer], { type: 'application/pdf' }), fileName);

  const res = await fetch(`${BACKEND_URL}/admin/documents`, {
    method: 'POST',
    headers: { 'x-api-key': ADMIN_KEY, 'x-admin-user': 'seed-script' },
    body: form,
  });
  return res;
}

async function apiAddVersion(slug, fields, pdfBuffer, fileName) {
  const form = new globalThis.FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append('file', new globalThis.Blob([pdfBuffer], { type: 'application/pdf' }), fileName);

  const res = await fetch(`${BACKEND_URL}/admin/documents/${slug}/versions`, {
    method: 'PATCH',
    headers: { 'x-api-key': ADMIN_KEY, 'x-admin-user': 'seed-script' },
    body: form,
  });
  return res;
}

async function apiPublish(slug) {
  return fetch(`${BACKEND_URL}/admin/documents/${slug}/publish`, {
    method: 'PATCH',
    headers: { 'x-api-key': ADMIN_KEY, 'x-admin-user': 'seed-script', 'Content-Type': 'application/json' },
    body: '{}',
  });
}

async function checkExists(slug) {
  const res = await fetch(`${BACKEND_URL}/admin/documents/${slug}`, {
    headers: { 'x-api-key': ADMIN_KEY },
  });
  return res.ok;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`[Seed] Target: ${BACKEND_URL}\n`);

  // Check connectivity
  const health = await fetch(`${BACKEND_URL}/health`).catch(() => null);
  if (!health?.ok) {
    console.error('[Seed] Backend not reachable. Check BACKEND_URL.');
    process.exit(1);
  }
  console.log('[Seed] Backend reachable\n');

  let created = 0;
  let skipped = 0;

  for (const sample of SAMPLES) {
    const exists = await checkExists(sample.slug);
    if (exists) {
      console.log(`  SKIP  ${sample.slug}`);
      skipped++;
      continue;
    }

    // Create document with first version
    const v0 = sample.versions[0];
    process.stdout.write(`  PDF   ${sample.slug} v${v0.versionNumber} … `);
    const pdf0 = await createPdf(sample.productCode, sample.productName, v0.documentType, v0.language, v0.versionNumber, v0.title);
    const fileName0 = `${sample.slug}-v${v0.versionNumber}.pdf`;

    const createRes = await apiUpload({
      slug: sample.slug,
      productCode: sample.productCode,
      productName: sample.productName,
      versionNumber: v0.versionNumber,
      documentType: v0.documentType,
      language: v0.language,
      productCategory: sample.productCategory,
      title: v0.title,
      status: 'draft',
    }, pdf0, fileName0);

    if (!createRes.ok) {
      const err = await createRes.text();
      console.log(`FAIL (${createRes.status}): ${err}`);
      continue;
    }
    console.log('done');

    // Add extra versions if any
    for (let i = 1; i < sample.versions.length; i++) {
      const v = sample.versions[i];
      process.stdout.write(`  PDF   ${sample.slug} v${v.versionNumber} … `);
      const pdfN = await createPdf(sample.productCode, sample.productName, v.documentType, v.language, v.versionNumber, v.title);
      const fileNameN = `${sample.slug}-v${v.versionNumber}.pdf`;

      const addRes = await apiAddVersion(sample.slug, {
        versionNumber: v.versionNumber,
        documentType: v.documentType,
        language: v.language,
        productCategory: sample.productCategory,
        title: v.title,
      }, pdfN, fileNameN);

      if (!addRes.ok) {
        const err = await addRes.text();
        console.log(`FAIL (${addRes.status}): ${err}`);
      } else {
        console.log('done');
      }
    }

    // Publish if needed
    if (sample.status === 'published') {
      const pubRes = await apiPublish(sample.slug);
      if (!pubRes.ok) console.log(`  WARN  publish failed for ${sample.slug}`);
    }

    console.log(`  SAVE  ${sample.slug}  [${sample.status}]\n`);
    created++;
  }

  console.log(`\n[Seed] Done -- ${created} created, ${skipped} skipped`);
}

seed().catch(err => {
  console.error('[Seed] Error:', err.message);
  process.exit(1);
});
