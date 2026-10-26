import { jsPDF } from 'jspdf';
import { NotoSansSinhala } from '@/lib/sinhala-font';
import { logoBase64 } from '@/lib/assets/logo-base64';

export interface ReportKpiCard {
  label: string;
  val: string;
  sub: string;
  color?: number[]; // RGB array e.g. [112, 26, 43]
}

export interface BaseReportPdfOptions {
  titleEn: string;
  titleSi: string;
  subtitleEn?: string;
  subtitleSi?: string;
  reportRef?: string;
  generatedBy?: string;
  orientation?: 'landscape' | 'portrait';
  filterScopeStr?: string;
  kpiCards?: ReportKpiCard[];
}

export interface BasePdfContext {
  doc: jsPDF;
  isLandscape: boolean;
  pageWidth: number;
  pageHeight: number;
  marginX: number;
  usableWidth: number;
  tableStartY: number;
  deptFilterText?: string;
  statusFilterText?: string;
  genDateStr: string;
}

/**
 * Initializes a government-grade A4 PDF document with:
 * - Full NotoSansSinhala font support (both 'normal' and 'bold')
 * - Institutional Emblem / Logo
 * - Bilingual National & Council Headers
 * - Document Passport Metadata Card
 * - Dual Imperial Maroon & Champagne Gold Rules
 * - Active Filter Scope Banner
 * - Executive KPI Summary Cards
 */
export function initGovernmentReportPdf(options: BaseReportPdfOptions): BasePdfContext {
  const {
    titleEn,
    titleSi,
    subtitleEn = 'Inventory & Stores Management Division • Government Store System',
    subtitleSi = 'ගබඩා සහ බඩුතොග කළමනාකරණ අංශය',
    reportRef,
    generatedBy = 'Store Administration',
    orientation = 'landscape',
    filterScopeStr,
    kpiCards = [],
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  const isLandscape = orientation === 'landscape';
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginX = 28;
  const usableWidth = pageWidth - (marginX * 2);

  // Register NotoSansSinhala for BOTH 'normal' and 'bold' to prevent any font fallback warnings
  try {
    doc.addFileToVFS('NotoSansSinhala.ttf', NotoSansSinhala);
    doc.addFont('NotoSansSinhala.ttf', 'NotoSansSinhala', 'normal');
    doc.addFont('NotoSansSinhala.ttf', 'NotoSansSinhala', 'bold');
    doc.setFont('NotoSansSinhala', 'normal');
  } catch (e) {
    console.warn('Sinhala font registration notice:', e);
  }

  // Header positioning
  const logoWidth = 46;
  const logoHeight = 46;
  const headerTopY = 20;

  // 1. Official Emblem
  try {
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', marginX, headerTopY, logoWidth, logoHeight);
    }
  } catch (err) {
    console.warn('Logo render fallback:', err);
  }

  // Vertical separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(marginX + logoWidth + 8, headerTopY + 2, marginX + logoWidth + 8, headerTopY + 44);

  // 2. Bilingual National & Council Header
  const textLeftX = marginX + logoWidth + 16;

  // National Crest Line (Sinhala + English)
  doc.setTextColor(112, 26, 43); // Deep Maroon
  doc.setFontSize(7.5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.text('ශ්‍රී ලංකා ප්‍රජාතාන්ත්‍රික සමාජවාදී ජනරජය  •  DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA', textLeftX, headerTopY + 8);

  // Council Name (Sinhala + English)
  doc.setTextColor(17, 24, 39); // Charcoal
  doc.setFontSize(12.5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.text('නිකවැරටිය ප්‍රාදේශීය සභාව  •  NIKAWERATIYA PRADESHIYA SABHA', textLeftX, headerTopY + 21);

  // Division Subtitle
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(7.2);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.text(`${subtitleSi}  •  ${subtitleEn}`, textLeftX, headerTopY + 32);

  // Report Title (Bilingual)
  doc.setTextColor(112, 26, 43); // Deep Maroon
  doc.setFontSize(10.5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.text(`${titleSi}  •  ${titleEn.toUpperCase()}`, textLeftX, headerTopY + 44);

  // 3. Right-side Metadata Framed Passport Card
  const metaBoxW = isLandscape ? 190 : 160;
  const metaBoxH = 46;
  const metaBoxX = pageWidth - marginX - metaBoxW;
  const metaBoxY = headerTopY;

  // Background & Border
  doc.setFillColor(252, 253, 255);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, 3, 3, 'S');

  // Maroon left accent bar
  doc.setFillColor(112, 26, 43);
  doc.rect(metaBoxX, metaBoxY, 2.5, metaBoxH, 'F');

  const now = new Date();
  const genDateStr = now.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
  const genTimeStr = now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
  const defaultRef = `NPS-RPT-${now.toISOString().slice(0, 10).replace(/-/g, '')}`;

  doc.setFontSize(6.5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('REPORT REF:', metaBoxX + 8, metaBoxY + 11);
  doc.setTextColor(17, 24, 39);
  doc.text(reportRef || defaultRef, metaBoxX + 58, metaBoxY + 11);

  doc.setTextColor(107, 114, 128);
  doc.text('GENERATED:', metaBoxX + 8, metaBoxY + 21);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text(`${genDateStr}, ${genTimeStr}`, metaBoxX + 58, metaBoxY + 21);

  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('OFFICER:', metaBoxX + 8, metaBoxY + 31);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setTextColor(31, 41, 55);
  const officerTrimmed = generatedBy.length > 22 ? generatedBy.slice(0, 20) + '...' : generatedBy;
  doc.text(officerTrimmed, metaBoxX + 58, metaBoxY + 31);

  // Security Status Pill Badge
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(metaBoxX + 8, metaBoxY + 35, metaBoxW - 16, 8, 2, 2, 'F');
  doc.setFontSize(5.5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('තහවුරු කළ වාර්තාව  •  AUDIT VERIFIED OFFICIAL RECORD', metaBoxX + (metaBoxW / 2), metaBoxY + 41, { align: 'center' });

  // 4. Dual Rule: Maroon + Champagne Gold
  const dividerY = headerTopY + 52;
  doc.setDrawColor(112, 26, 43); // Maroon
  doc.setLineWidth(1.5);
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  doc.setDrawColor(212, 160, 23); // Gold
  doc.setLineWidth(0.75);
  doc.line(marginX, dividerY + 2.5, pageWidth - marginX, dividerY + 2.5);

  // 5. Active Filter Scope Banner Pill
  let currentY = dividerY + 10;
  if (filterScopeStr) {
    const bannerH = 16;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, currentY, usableWidth, bannerH, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginX, currentY, usableWidth, bannerH, 3, 3, 'S');

    doc.setFontSize(6.8);
    doc.setFont('NotoSansSinhala', 'bold');
    doc.setTextColor(112, 26, 43);
    doc.text('සක්‍රිය විෂය පථය / SCOPE:', marginX + 8, currentY + 11);

    doc.setFont('NotoSansSinhala', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(filterScopeStr, marginX + 110, currentY + 11);

    currentY += bannerH + 7;
  }

  // 6. Executive KPI Summary Cards
  if (kpiCards.length > 0) {
    const cardH = 36;
    const cardGap = 8;
    const cardW = (usableWidth - (cardGap * (kpiCards.length - 1))) / kpiCards.length;

    kpiCards.forEach((card, idx) => {
      const cardX = marginX + (idx * (cardW + cardGap));
      const accentColor = card.color || [112, 26, 43];

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cardX, currentY, cardW, cardH, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.roundedRect(cardX, currentY, cardW, cardH, 3, 3, 'S');

      // Left vertical accent stripe
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(cardX, currentY, 2.5, cardH, 'F');

      // Label
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(5.8);
      doc.setFont('NotoSansSinhala', 'bold');
      doc.text(card.label, cardX + 8, currentY + 10);

      // Value
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(9.5);
      doc.setFont('NotoSansSinhala', 'bold');
      doc.text(card.val, cardX + 8, currentY + 22);

      // Subtext
      doc.setTextColor(120, 130, 145);
      doc.setFontSize(5.8);
      doc.setFont('NotoSansSinhala', 'normal');
      doc.text(card.sub, cardX + 8, currentY + 31);
    });

    currentY += cardH + 11;
  }

  return {
    doc,
    isLandscape,
    pageWidth,
    pageHeight,
    marginX,
    usableWidth,
    tableStartY: currentY,
    genDateStr,
  };
}

/**
 * Appends:
 * 1. Official 3-Column Verification & Institutional Sign-off Block on Final Page
 * 2. Two-Pass Running Header (Pages > 1) and Footer (All Pages)
 */
export function finishGovernmentReportPdf(
  context: BasePdfContext,
  reportTitle: string,
  filterSubtext: string = ''
): jsPDF {
  const { doc, pageWidth, pageHeight, marginX, usableWidth, genDateStr } = context;

  // 1. Verification block on final page
  const finalY = (doc as any).lastAutoTable?.finalY || 400;
  const signatureHeight = 62;
  let signY = finalY + 14;

  if (signY + signatureHeight > pageHeight - 38) {
    doc.addPage();
    signY = 50;
  }

  doc.setFillColor(252, 253, 255);
  doc.roundedRect(marginX, signY, usableWidth, signatureHeight, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(marginX, signY, usableWidth, signatureHeight, 3, 3, 'S');

  doc.setFillColor(112, 26, 43);
  doc.rect(marginX, signY, usableWidth, 2, 'F');

  doc.setFontSize(6.2);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(112, 26, 43);
  doc.text('නිල සහතික කිරීම සහ අනුමැතිය  •  OFFICIAL VERIFICATION, AUDIT REVIEW & INSTITUTIONAL SANCTION', marginX + 10, signY + 10);

  const signColWidth = (usableWidth - 20) / 3;
  const lineY = signY + 34;

  // Col 1: Store Officer
  doc.setDrawColor(156, 163, 175);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(marginX + 10, lineY, marginX + 10 + signColWidth - 25, lineY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6.5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('සකස් කළේ / PREPARED BY', marginX + 10, lineY + 9);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(107, 114, 128);
  doc.text('ගබඩා භාරකරු / Store Keeper', marginX + 10, lineY + 17);
  doc.text('දිනය / Date: ...........................................', marginX + 10, lineY + 24);

  // Col 2: Internal Audit / Accountant
  const col2X = marginX + 10 + signColWidth;
  doc.setDrawColor(156, 163, 175);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(col2X, lineY, col2X + signColWidth - 25, lineY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6.5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('පරීක්ෂා කළේ / VERIFIED & AUDITED BY', col2X, lineY + 9);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(107, 114, 128);
  doc.text('ගණකාධිකාරී / Accountant', col2X, lineY + 17);
  doc.text('දිනය / Date: ...........................................', col2X, lineY + 24);

  // Col 3: Secretary / Chairman
  const col3X = marginX + 10 + (signColWidth * 2);
  doc.setDrawColor(156, 163, 175);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(col3X, lineY, col3X + signColWidth - 30, lineY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6.5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('අනුමත කළේ / APPROVED & SANCTIONED', col3X, lineY + 9);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(107, 114, 128);
  doc.text('ලේකම් / සභාපති (Secretary / Chairman)', col3X, lineY + 17);
  doc.text('දිනය / Date: ...........................................', col3X, lineY + 24);

  // 2. Two-Pass Running Headers & Footers
  const totalPages = typeof (doc as any).getNumberOfPages === 'function'
    ? (doc as any).getNumberOfPages()
    : Math.max(1, (doc.internal.pages.length || 2) - 1);

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Header on pages > 1
    if (i > 1) {
      doc.setFontSize(7.5);
      doc.setFont('NotoSansSinhala', 'bold');
      doc.setTextColor(112, 26, 43);
      doc.text(`නිකවැරටිය ප්‍රාදේශීය සභාව  •  ${reportTitle.toUpperCase()} (ඉදිරියට / CONTINUATION)`, marginX, 26);

      doc.setFont('NotoSansSinhala', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(107, 114, 128);
      const sub = filterSubtext ? `${filterSubtext}  |  ` : '';
      doc.text(`${sub}Generated: ${genDateStr}`, pageWidth - marginX, 26, { align: 'right' });

      doc.setDrawColor(112, 26, 43);
      doc.setLineWidth(1.2);
      doc.line(marginX, 33, pageWidth - marginX, 33);

      doc.setDrawColor(212, 160, 23);
      doc.setLineWidth(0.5);
      doc.line(marginX, 35, pageWidth - marginX, 35);
    }

    // Footer on all pages
    const footerY = pageHeight - 20;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(marginX, footerY - 8, pageWidth - marginX, footerY - 8);

    doc.setFontSize(6.5);
    doc.setFont('NotoSansSinhala', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('නිකවැරටිය ප්‍රාදේශීය සභාව  •  ANTIGRAVITY Government Store System', marginX, footerY);

    doc.setFontSize(6);
    doc.setFont('NotoSansSinhala', 'bold');
    doc.setTextColor(112, 26, 43);
    doc.text('නිල රාජ්‍ය ලේඛනයකි  •  OFFICIAL GOVERNMENT AUDIT RECORD', pageWidth / 2, footerY, { align: 'center' });

    doc.setFontSize(6.8);
    doc.setFont('NotoSansSinhala', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text(`පිටුව / Page ${i} of ${totalPages}`, pageWidth - marginX, footerY, { align: 'right' });
  }

  return doc;
}
