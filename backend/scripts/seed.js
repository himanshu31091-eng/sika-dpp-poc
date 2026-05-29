/**
 * Seed script — populates the DB with sample Sika product documents.
 * Generates real PDFs using pdf-lib, strips metadata, uploads to S3, saves to MongoDB.
 *
 * Usage: node scripts/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const Document = require('../src/models/Document');
const { uploadBufferToS3, sha256 } = require('../src/config/storage');

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLES = [
  {
    slug: 'sikaflex-221--tds-en',
    productCode: 'Sikaflex-221',
    productName: 'Sikaflex-221 Multi-Purpose Adhesive Sealant',
    productCategory: 'Sealing & Bonding',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'TDS', language: 'EN', title: 'Technical Data Sheet — Sikaflex-221' },
    ],
  },
  {
    slug: 'sikaflex-221--sds-en',
    productCode: 'Sikaflex-221',
    productName: 'Sikaflex-221 Multi-Purpose Adhesive Sealant',
    productCategory: 'Sealing & Bonding',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'SDS', language: 'EN', title: 'Safety Data Sheet — Sikaflex-221' },
    ],
  },
  {
    slug: 'sikaflex-221--dopc-en',
    productCode: 'Sikaflex-221',
    productName: 'Sikaflex-221 Multi-Purpose Adhesive Sealant',
    productCategory: 'Sealing & Bonding',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'DoPC', language: 'EN', title: 'Declaration of Performance & Conformity — Sikaflex-221' },
    ],
  },
  {
    slug: 'sikatop-107--tds-en',
    productCode: 'SikaTop-107',
    productName: 'SikaTop-107 Waterproofing Mortar',
    productCategory: 'Waterproofing',
    status: 'published',
    // Two versions — v1 superseded by v2
    versions: [
      { versionNumber: '1.0', documentType: 'TDS', language: 'EN', title: 'Technical Data Sheet — SikaTop-107' },
      { versionNumber: '2.0', documentType: 'TDS', language: 'EN', title: 'Technical Data Sheet — SikaTop-107 (Revised)' },
    ],
  },
  {
    slug: 'sikatop-107--sds-de',
    productCode: 'SikaTop-107',
    productName: 'SikaTop-107 Waterproofing Mortar',
    productCategory: 'Waterproofing',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'SDS', language: 'DE', title: 'Sicherheitsdatenblatt — SikaTop-107' },
    ],
  },
  {
    slug: 'sikabond-t8--technical-en',
    productCode: 'SikaBond-T8',
    productName: 'SikaBond-T8 Elastic Bonding Adhesive',
    productCategory: 'Flooring',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'Technical', language: 'EN', title: 'Technical Guide — SikaBond-T8' },
    ],
  },
  {
    slug: 'sikabond-t8--label-en',
    productCode: 'SikaBond-T8',
    productName: 'SikaBond-T8 Elastic Bonding Adhesive',
    productCategory: 'Flooring',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'Label', language: 'EN', title: 'Product Label — SikaBond-T8' },
    ],
  },
  {
    slug: 'sikafloor-264--tds-fr',
    productCode: 'SikaFloor-264',
    productName: 'SikaFloor-264 Epoxy Floor Coating',
    productCategory: 'Flooring',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'TDS', language: 'FR', title: 'Fiche Technique — SikaFloor-264' },
    ],
  },
  {
    slug: 'sikafloor-264--sds-en',
    productCode: 'SikaFloor-264',
    productName: 'SikaFloor-264 Epoxy Floor Coating',
    productCategory: 'Flooring',
    status: 'draft',   // intentionally left as draft — shows in "pending publish"
    versions: [
      { versionNumber: '1.0', documentType: 'SDS', language: 'EN', title: 'Safety Data Sheet — SikaFloor-264' },
    ],
  },
  {
    slug: 'sika-anchorfix-1--dopc-en',
    productCode: 'Sika-AnchorFix-1',
    productName: 'Sika-AnchorFix-1 Styrene-Free Anchor Adhesive',
    productCategory: 'Concrete',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'DoPC', language: 'EN', title: 'Declaration of Performance — Sika-AnchorFix-1' },
    ],
  },
  {
    slug: 'sika-anchorfix-1--tds-de',
    productCode: 'Sika-AnchorFix-1',
    productName: 'Sika-AnchorFix-1 Styrene-Free Anchor Adhesive',
    productCategory: 'Concrete',
    status: 'published',
    versions: [
      { versionNumber: '1.0', documentType: 'TDS', language: 'DE', title: 'Technisches Merkblatt — Sika-AnchorFix-1' },
    ],
  },
];

// ─── PDF generator ────────────────────────────────────────────────────────────

// Replace characters outside WinAnsi (CP1252) range so pdf-lib doesn't throw
function san(str) {
  return String(str)
    .replace(/≥/g, '>=')   // ≥
    .replace(/≤/g, '<=')   // ≤
    .replace(/—/g, '--')   // em dash
    .replace(/–/g, '-')    // en dash
    .replace(/[^\x00-\xFF]/g, '?');
}

async function createSamplePdf(productCode, productName, docType, language, version, title) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const sikaYellow = rgb(0.988, 0.753, 0.027);
  const black = rgb(0, 0, 0);
  const grey = rgb(0.5, 0.5, 0.5);
  const darkGrey = rgb(0.2, 0.2, 0.2);

  // Yellow header bar
  page.drawRectangle({ x: 0, y: 792, width: 595, height: 50, color: sikaYellow });
  page.drawText(san('SIKA'), { x: 24, y: 808, size: 22, font: bold, color: black });
  page.drawText(san('BUILDING TRUST'), { x: 460, y: 812, size: 8, font, color: black });

  // Divider
  page.drawRectangle({ x: 0, y: 789, width: 595, height: 3, color: rgb(0.85, 0.65, 0) });

  // Doc type chip
  page.drawText(san(docType), { x: 24, y: 762, size: 9, font: bold, color: grey });
  page.drawText(san(`  |  ${language}  |  v${version}`), { x: 24 + bold.widthOfTextAtSize(san(docType), 9), y: 762, size: 9, font, color: grey });

  // Title
  page.drawText(san(title), { x: 24, y: 735, size: 15, font: bold, color: black });
  page.drawText(san(productName), { x: 24, y: 715, size: 11, font, color: darkGrey });
  page.drawText(san(`Product Code: ${productCode}`), { x: 24, y: 698, size: 10, font, color: grey });

  // Separator
  page.drawLine({ start: { x: 24, y: 685 }, end: { x: 571, y: 685 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });

  const sections = buildContent(docType, productCode, productName, version);
  let y = 668;
  for (const { heading, lines } of sections) {
    if (y < 60) break;
    page.drawText(san(heading), { x: 24, y, size: 10, font: bold, color: black });
    y -= 15;
    for (const line of lines) {
      if (y < 60) break;
      page.drawText(san(line), { x: 24, y, size: 9, font, color: darkGrey });
      y -= 13;
    }
    y -= 6;
  }

  // Footer
  page.drawLine({ start: { x: 24, y: 35 }, end: { x: 571, y: 35 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  page.drawText(
    san(`(c) Sika AG -- ${productCode} -- ${docType} -- ${language} -- v${version} -- Sample document for POC purposes only`),
    { x: 24, y: 22, size: 7, font, color: grey }
  );

  return Buffer.from(await pdfDoc.save());
}

function buildContent(docType, productCode, productName, version) {
  if (docType === 'SDS') {
    return [
      { heading: '1. IDENTIFICATION OF THE SUBSTANCE/MIXTURE AND OF THE COMPANY', lines: [`Product name: ${productCode}`, 'Intended use: Construction adhesive/sealant', 'Supplier: Sika AG, Tüffenwies 16-22, 8048 Zürich, Switzerland'] },
      { heading: '2. HAZARDS IDENTIFICATION', lines: ['Classification: Not classified as hazardous', 'Signal word: None', 'Hazard statements: None applicable'] },
      { heading: '3. COMPOSITION/INFORMATION ON INGREDIENTS', lines: ['This product does not contain substances classified as hazardous', 'in concentrations above the regulatory thresholds (EU CLP).'] },
      { heading: '4. FIRST AID MEASURES', lines: ['Eye contact: Rinse with plenty of water. Seek medical attention if irritation persists.', 'Skin contact: Wash with soap and water.', 'Ingestion: Do not induce vomiting. Seek medical attention.'] },
      { heading: '8. EXPOSURE CONTROLS / PERSONAL PROTECTION', lines: ['Respiratory protection: Not required under normal conditions', 'Hand protection: Chemical-resistant gloves recommended', 'Eye protection: Safety glasses recommended'] },
      { heading: '15. REGULATORY INFORMATION', lines: ['This SDS complies with Regulation (EC) No 1907/2006 (REACH)', 'and Regulation (EC) No 1272/2008 (CLP/GHS).'] },
    ];
  }
  if (docType === 'DoPC') {
    return [
      { heading: 'DECLARATION OF PERFORMANCE / DECLARATION OF CONFORMITY', lines: [`No.: ${productCode}-DoPC-${version}`, `Product: ${productName}`] },
      { heading: 'INTENDED USE', lines: ['Sealant for use in construction works — joints, facades, and glazing applications.', 'EU Construction Products Regulation (CPR) No. 305/2011.'] },
      { heading: 'ESSENTIAL CHARACTERISTICS', lines: ['Reaction to fire: Class E', 'Dangerous substances: Complies with EN 15651-1', 'Air permeability: Class 600 at ±12.5%', 'Water tightness: Passed', 'Release of dangerous substances: REACH compliant'] },
      { heading: 'NOTIFIED BODY', lines: ['MPA Dresden, NB No. 1289', 'Initial type testing performed under constant production supervision.'] },
      { heading: 'DECLARATION', lines: ['The performance of the product identified above is in conformity with the declared performance.', 'This declaration of performance is issued under the sole responsibility of the manufacturer.', '', 'Sika AG, Zürich, Switzerland'] },
    ];
  }
  if (docType === 'Label') {
    return [
      { heading: 'PRODUCT LABEL', lines: [`${productName}`, `Article: ${productCode}`] },
      { heading: 'DESCRIPTION', lines: ['One-component elastic adhesive based on MS-Polymer technology.', 'For permanent and elastic bonding of floor coverings.'] },
      { heading: 'DIRECTIONS FOR USE', lines: ['1. Substrate must be clean, dry and free of contaminants.', '2. Apply product with notched trowel.', '3. Install floor covering within 20 minutes of application.', '4. Allow full cure before exposure to foot traffic (24 h).'] },
      { heading: 'STORAGE', lines: ['Store in original sealed containers between 5°C and 30°C.', 'Shelf life: 12 months from production date.'] },
      { heading: 'HAZARD INFORMATION', lines: ['Not classified as hazardous per CLP/GHS.', 'Keep out of reach of children.'] },
    ];
  }
  if (docType === 'Technical') {
    return [
      { heading: 'PRODUCT OVERVIEW', lines: [`${productName}`, 'One-component, elastic, moisture-curing adhesive based on MS-Polymer.', 'Suitable for bonding most floor coverings to concrete and screed substrates.'] },
      { heading: 'SUBSTRATE PREPARATION', lines: ['All substrates must be structurally sound, clean, and free from contamination.', 'Residual moisture content must not exceed 2.0 CM%.', 'Prime porous substrates with Sika® Primer MB before application.'] },
      { heading: 'APPLICATION', lines: ['Apply with a Sika® notched trowel (A2 or B11).', 'Spread adhesive evenly across the substrate.', 'Lay floor covering within the open time (15–25 min at +23°C / 50% RH).', 'Press flooring firmly and evenly into the adhesive bed.'] },
      { heading: 'PERFORMANCE DATA', lines: ['Shear strength (EN 14293): ≥ 1.0 N/mm² after 28d', 'Tensile adhesion strength: ≥ 0.5 N/mm²', 'Temperature resistance: -40°C to +80°C'] },
      { heading: 'TECHNICAL SUPPORT', lines: ['Sika provides technical advice through its Technical Service Department.', 'Contact your local Sika company for assistance.'] },
    ];
  }
  // TDS (default)
  return [
    { heading: '1. PRODUCT DESCRIPTION', lines: [`${productName}`, `${productCode} is a high-performance product for construction applications.`, 'It combines ease of use with excellent long-term performance.'] },
    { heading: '2. USES', lines: ['• Bonding, sealing and protecting construction joints', '• Suitable for interior and exterior applications', '• Compatible with most common substrates'] },
    { heading: '3. PRODUCT DATA', lines: ['Appearance: Paste', 'Colour: Various (refer to product colour chart)', `Shelf life: 12 months from date of production (version ${version})`, 'Storage: Store between +5°C and +25°C in original sealed containers'] },
    { heading: '4. TECHNICAL DATA (TYPICAL VALUES AT +23 deg C AND 50% R.H.)', lines: ['Density: approx. 1.30 kg/l', 'Modulus of elasticity: low modulus', 'Shore A hardness (EN ISO 868): approx. 25', 'Tensile strength (EN ISO 527): >= 0.6 N/mm2', 'Elongation at break (EN ISO 527): >= 400%', 'Service temperature: -40 deg C to +90 deg C'] },
    { heading: '5. SYSTEM INFORMATION', lines: ['System structure: Single-component, no mixing required.', 'Application temperature: +5°C to +40°C', 'Skin formation time at +23°C: approx. 60 min', 'Full cure: approx. 7 days (depends on joint dimensions)'] },
    { heading: '6. IMPORTANT NOTES', lines: ['Read the SDS before using this product.', 'Observe safe handling instructions on the SDS and product label.', 'This TDS supersedes all previous versions.'] },
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sika_dpp');
  console.log('[Seed] Connected to MongoDB\n');

  let created = 0;
  let skipped = 0;

  for (const sample of SAMPLES) {
    const exists = await Document.findOne({ slug: sample.slug });
    if (exists) {
      console.log(`  SKIP  ${sample.slug}  (already exists)`);
      skipped++;
      continue;
    }

    const versionDocs = [];
    let latestIdx = 0;

    for (let i = 0; i < sample.versions.length; i++) {
      const v = sample.versions[i];
      process.stdout.write(`  PDF   ${sample.slug} v${v.versionNumber} (${v.documentType}/${v.language}) … `);

      const pdfBuffer = await createSamplePdf(
        sample.productCode, sample.productName,
        v.documentType, v.language, v.versionNumber, v.title
      );
      const fileHash = sha256(pdfBuffer);
      const fileName = `${sample.slug}-v${v.versionNumber}.pdf`;
      const fileKey = await uploadBufferToS3(pdfBuffer, sample.slug, fileName);

      versionDocs.push({
        versionNumber: v.versionNumber,
        versionTag: `v${v.versionNumber.split('.')[0]}`,
        fileKey,
        fileName,
        fileSize: pdfBuffer.length,
        fileHash,
        publicMetadata: {
          title: v.title,
          language: v.language,
          productCategory: sample.productCategory,
          documentType: v.documentType,
          issueDate: new Date(),
        },
        internalMetadata: {
          uploadedBy: 'seed-script',
          sourceSystem: 'manual',
        },
        supersededAt: i < sample.versions.length - 1 ? new Date() : null,
      });

      latestIdx = i;
      console.log('done');
    }

    await Document.create({
      slug: sample.slug,
      productCode: sample.productCode,
      productName: sample.productName,
      status: sample.status,
      versions: versionDocs,
      latestVersionIndex: latestIdx,
    });

    console.log(`  SAVE  ${sample.slug}  [${sample.status}]\n`);
    created++;
  }

  console.log(`\n[Seed] Done — ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('[Seed] Error:', err.message);
  process.exit(1);
});
