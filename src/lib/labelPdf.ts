import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export interface LabelReg {
  id: string;
  last_name: string;
  first_name: string;
  license_number: string;
  club_name: string;
  final_age_category: string;
}

// ── Layout A4 portrait ──────────────────────────────────────────────────────
const PAGE_W    = 210;   // mm
const PAGE_H    = 297;   // mm
const COLS      = 3;
const ROWS      = 5;
const SIDE_M    = 5;     // left/right margin
const TOP_M     = 22;    // top margin (below page header)
const BOT_M     = 12;    // bottom margin (above footer)
const GAP       = 0;     // gap between labels (border overlaps)

const LABEL_W   = (PAGE_W - 2 * SIDE_M) / COLS;                      // ≈ 66.67 mm
const LABEL_H   = (PAGE_H - TOP_M - BOT_M - GAP * (ROWS - 1)) / ROWS; // ≈ 52.6 mm

// ── Helpers ─────────────────────────────────────────────────────────────────

function drawPageHeader(doc: jsPDF, categoryLabel: string, dateStr: string) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(`Catégorie : ${categoryLabel}`, PAGE_W / 2, 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date : ${dateStr}`, PAGE_W / 2, 16, { align: 'center' });
}

function drawPageFooter(doc: jsPDF, total: number) {
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Document généré automatiquement – Ne pas modifier manuellement',
    PAGE_W / 2, PAGE_H - 6, { align: 'center' }
  );
  doc.text(`Total : ${total} étiquette${total !== 1 ? 's' : ''}`, PAGE_W / 2, PAGE_H - 3, { align: 'center' });
}

async function drawLabel(
  doc: jsPDF,
  reg: LabelReg,
  x: number,
  y: number,
) {
  const PAD = 3;
  const QR_SIZE = 22; // mm

  // Border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.25);
  doc.rect(x, y, LABEL_W, LABEL_H);

  // QR code (right side, vertically centred)
  const qrDataUrl = await QRCode.toDataURL(reg.id, {
    width: 200,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const qrX = x + LABEL_W - QR_SIZE - PAD;
  const qrY = y + (LABEL_H - QR_SIZE) / 2;
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, QR_SIZE, QR_SIZE);

  // Text area width (left of QR code)
  const textMaxW = LABEL_W - QR_SIZE - PAD * 2 - 2;
  const tx = x + PAD;

  // Licence
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Licence : ${reg.license_number || '—'}`, tx, y + PAD + 4);

  // LAST NAME (bold, large)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 10);
  const lastName = (reg.last_name || '').toUpperCase();
  doc.text(lastName, tx, y + PAD + 13, { maxWidth: textMaxW });

  // First name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(reg.first_name || '', tx, y + PAD + 21, { maxWidth: textMaxW });

  // Club
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text((reg.club_name || '').toUpperCase(), tx, y + LABEL_H - PAD - 3, { maxWidth: textMaxW });
}

// ── Public function ──────────────────────────────────────────────────────────

/**
 * Generate and download one PDF per age category (or a single PDF if
 * ageCategory is provided).
 *
 * @param allRegs       All registrations for the tournament
 * @param ageCategory   Specific category to generate ('all' = one file per category)
 */
export async function generateLabelsPdf(
  allRegs: LabelReg[],
  ageCategory: string,
): Promise<void> {
  const dateStr = new Date().toLocaleDateString('fr-FR');

  // Determine which (category → regs) buckets to generate
  const buckets: Array<{ cat: string; regs: LabelReg[] }> = [];

  if (ageCategory !== 'all') {
    const filtered = allRegs.filter(r => r.final_age_category === ageCategory);
    buckets.push({ cat: ageCategory, regs: filtered });
  } else {
    // One bucket per category, in age order
    const cats = [...new Set(allRegs.map(r => r.final_age_category).filter(Boolean))].sort();
    for (const cat of cats) {
      buckets.push({ cat, regs: allRegs.filter(r => r.final_age_category === cat) });
    }
  }

  for (const bucket of buckets) {
    if (bucket.regs.length === 0) continue;

    // Sort: club → last name → first name
    const sorted = [...bucket.regs].sort((a, b) => {
      const c = (a.club_name || '').localeCompare(b.club_name || '', 'fr');
      if (c !== 0) return c;
      const n = (a.last_name || '').localeCompare(b.last_name || '', 'fr');
      if (n !== 0) return n;
      return (a.first_name || '').localeCompare(b.first_name || '', 'fr');
    });

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const perPage = COLS * ROWS;
    const totalPages = Math.ceil(sorted.length / perPage);

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) doc.addPage();

      drawPageHeader(doc, bucket.cat, dateStr);

      const pageRegs = sorted.slice(p * perPage, (p + 1) * perPage);
      for (let i = 0; i < pageRegs.length; i++) {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = SIDE_M + col * LABEL_W;
        const y = TOP_M + row * (LABEL_H + GAP);
        await drawLabel(doc, pageRegs[i], x, y);
      }

      drawPageFooter(doc, sorted.length);
    }

    const filename = `etiquettes_${bucket.cat.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);

    // Small delay between files so browser doesn't block multiple downloads
    if (buckets.length > 1) {
      await new Promise(r => setTimeout(r, 400));
    }
  }
}
