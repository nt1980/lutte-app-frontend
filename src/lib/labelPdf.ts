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

// ── A4 portrait layout ───────────────────────────────────────────────────────
const PAGE_W  = 210;
const PAGE_H  = 297;
const COLS    = 3;
const ROWS    = 5;
const SIDE_M  = 5;   // left/right page margin
const TOP_M   = 22;  // below page header (category + club + date)
const BOT_M   = 10;  // above page footer

const LABEL_W = (PAGE_W - 2 * SIDE_M) / COLS;   // ≈ 66.67 mm
const LABEL_H = (PAGE_H - TOP_M - BOT_M) / ROWS; // ≈ 53.0 mm
const PAD     = 3.5; // inner label padding
const QR_SIZE = 19;  // QR code side length (mm) – fits bottom-right with PAD

// ── Page header ──────────────────────────────────────────────────────────────

function drawPageHeader(
  doc: jsPDF,
  category: string,
  clubName: string,
  dateStr: string,
) {
  // Category (bold, centred)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(`Catégorie : ${category}`, PAGE_W / 2, 8, { align: 'center' });

  // Club name (slightly smaller, centred)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(clubName.toUpperCase(), PAGE_W / 2, 14, { align: 'center' });

  // Date (small, centred)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(`Date : ${dateStr}`, PAGE_W / 2, 19, { align: 'center' });
}

// ── Page footer ──────────────────────────────────────────────────────────────

function drawPageFooter(doc: jsPDF, totalClubs: number, totalRegs: number) {
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Document généré automatiquement – Ne pas modifier manuellement',
    PAGE_W / 2, PAGE_H - 5, { align: 'center' },
  );
  doc.text(
    `${totalClubs} club${totalClubs > 1 ? 's' : ''} · Total : ${totalRegs} étiquette${totalRegs !== 1 ? 's' : ''}`,
    PAGE_W / 2, PAGE_H - 2, { align: 'center' },
  );
}

// ── Individual label ─────────────────────────────────────────────────────────
//
// ┌────────────────────────────────────────────────────────┐
// │ Licence : XXXXXXX                    [CATEG - gros]   │
// │                                                        │
// │ NOM DU CLUB                                            │
// │ NOM DE FAMILLE                                         │
// │ Prénom                                                 │
// │                                                        │
// │ Tournoi XYZ 2025                          [QR CODE]   │
// └────────────────────────────────────────────────────────┘

async function drawLabel(
  doc: jsPDF,
  reg: LabelReg,
  x: number,
  y: number,
  tournamentName: string,
  year: string,
) {
  // Border
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.25);
  doc.rect(x, y, LABEL_W, LABEL_H);

  const tx = x + PAD; // text left start

  // ── TOP ROW: Licence (left) + Category (right, large) ───────────────────

  // Licence – top-left
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(`Licence : ${reg.license_number || '—'}`, tx, y + PAD + 3.5);

  // Category – top-right (large bold)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(25, 25, 25);
  doc.text(
    reg.final_age_category || '',
    x + LABEL_W - PAD,
    y + PAD + 5,
    { align: 'right' },
  );

  // ── MIDDLE: Club → Last name → First name ────────────────────────────────

  const textMaxW = LABEL_W - PAD * 2; // full-width text (QR is at bottom)

  let cy = y + PAD + 13;

  // Club name (bold, small caps style)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text((reg.club_name || '').toUpperCase(), tx, cy, { maxWidth: textMaxW });
  cy += 8.5;

  // Last name (bold, large)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(10, 10, 10);
  doc.text((reg.last_name || '').toUpperCase(), tx, cy, { maxWidth: textMaxW });
  cy += 8;

  // First name (normal, medium)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(45, 45, 45);
  doc.text(reg.first_name || '', tx, cy, { maxWidth: LABEL_W - QR_SIZE - PAD * 3 });

  // ── BOTTOM: QR code (right) + Tournament name (left) ────────────────────

  // QR code – bottom-right, with PAD from border
  const qrX = x + LABEL_W - QR_SIZE - PAD;
  const qrY = y + LABEL_H - QR_SIZE - PAD;
  const qrDataUrl = await QRCode.toDataURL(reg.id, {
    width: 200, margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, QR_SIZE, QR_SIZE);

  // Tournament + year – bottom-left, baseline aligned with QR bottom edge
  const tournText = [tournamentName, year].filter(Boolean).join(' ');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.text(
    tournText,
    tx,
    y + LABEL_H - PAD - 1,
    { maxWidth: LABEL_W - QR_SIZE - PAD * 3 },
  );
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate and auto-download one PDF per selected age category.
 * Within each PDF: one page (or more) per club, sorted club → name → firstname.
 *
 * @param allRegs        Full registration list for the tournament
 * @param categories     Age categories to include (empty array = all)
 * @param tournamentName Name shown in the bottom-left of each label
 */
export async function generateLabelsPdf(
  allRegs: LabelReg[],
  categories: string[],
  tournamentName = '',
): Promise<void> {
  const dateStr = new Date().toLocaleDateString('fr-FR');
  const year    = new Date().getFullYear().toString();
  const perPage = COLS * ROWS;

  // Resolve which categories to process
  const allCats = [
    ...new Set(allRegs.map(r => r.final_age_category).filter(Boolean)),
  ].sort();
  const catsToProcess = categories.length > 0 ? categories : allCats;

  for (const cat of catsToProcess) {
    const catRegs = allRegs.filter(r => r.final_age_category === cat);
    if (catRegs.length === 0) continue;

    // Sort: club → last name → first name
    const sorted = [...catRegs].sort((a, b) => {
      const c = (a.club_name || '').localeCompare(b.club_name || '', 'fr');
      if (c !== 0) return c;
      const n = (a.last_name || '').localeCompare(b.last_name || '', 'fr');
      if (n !== 0) return n;
      return (a.first_name || '').localeCompare(b.first_name || '', 'fr');
    });

    // Group by club (order preserved from sort)
    const clubOrder: string[] = [];
    const byClub: Record<string, LabelReg[]> = {};
    for (const reg of sorted) {
      const club = reg.club_name || '—';
      if (!byClub[club]) { byClub[club] = []; clubOrder.push(club); }
      byClub[club].push(reg);
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let firstPage = true;

    // ── One page break per club ──────────────────────────────────────────
    for (const club of clubOrder) {
      const clubRegs = byClub[club];
      const clubPages = Math.ceil(clubRegs.length / perPage);

      for (let p = 0; p < clubPages; p++) {
        if (!firstPage) doc.addPage();
        firstPage = false;

        drawPageHeader(doc, cat, club, dateStr);

        const pageRegs = clubRegs.slice(p * perPage, (p + 1) * perPage);
        for (let i = 0; i < pageRegs.length; i++) {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const lx = SIDE_M + col * LABEL_W;
          const ly = TOP_M  + row * LABEL_H;
          await drawLabel(doc, pageRegs[i], lx, ly, tournamentName, year);
        }

        drawPageFooter(doc, clubOrder.length, sorted.length);
      }
    }

    const filename = `etiquettes_${cat.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);

    // Stagger downloads so the browser doesn't block them
    if (catsToProcess.length > 1) {
      await new Promise(r => setTimeout(r, 450));
    }
  }
}
