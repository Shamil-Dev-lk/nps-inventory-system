import { jsPDF } from 'jspdf';
import { NotoSansSinhala, NotoSansSinhalaBold } from '@/lib/sinhala-font';
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

  // Register Dual-Script Font (Sinhala + English Latin) for BOTH 'normal' and 'bold'
  try {
    doc.addFileToVFS('NotoSansSinhala.ttf', NotoSansSinhala);
    doc.addFileToVFS('NotoSansSinhala-Bold.ttf', NotoSansSinhalaBold);
    doc.addFont('NotoSansSinhala.ttf', 'NotoSansSinhala', 'normal');
    doc.addFont('NotoSansSinhala-Bold.ttf', 'NotoSansSinhala', 'bold');
    doc.setFont('NotoSansSinhala', 'normal');
  } catch (e) {
    console.warn('Sinhala/English font registration notice:', e);
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
  const textLeftX = marginX + logoWidth + 14;

  // National Crest Line (Sinhala + English)
  doc.setTextColor(112, 26, 43); // Deep Maroon
  doc.setFontSize(7.5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.text('ශ්‍රී ලංකා ප්‍රජාතාන්ත්‍රික සමාජවාදී ජනරජය  •  DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA', textLeftX, headerTopY + 8);

  // Council Name (Sinhala + English)
  doc.setTextColor(17, 24, 39); // Charcoal
  doc.setFontSize(12);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.text('නිකවැරටිය ප්‍රාදේශීය සභාව  •  NIKAWERATIYA PRADESHIYA SABHA', textLeftX, headerTopY + 20);

  // Provincial & Ministry Subtitle
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(7);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.text(`වයඹ පළාත් පාලන දෙපාර්තමේන්තුව  •  Department of Local Government (NWP)`, textLeftX, headerTopY + 30);
  doc.text(`${subtitleSi}  •  ${subtitleEn}`, textLeftX, headerTopY + 39);

  // Official Form & Report Title (Bilingual)
  doc.setTextColor(112, 26, 43); // Deep Maroon
  doc.setFontSize(10);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.text(`${titleSi}  •  ${titleEn.toUpperCase()}`, textLeftX, headerTopY + 50);

  // 3. Right-side Formal Government Document Passport Card
  const metaBoxW = isLandscape ? 196 : 166;
  const metaBoxH = 48;
  const metaBoxX = pageWidth - marginX - metaBoxW;
  const metaBoxY = headerTopY + 2;

  // Background & Border
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, 2, 2, 'S');

  // Maroon Top Border
  doc.setFillColor(112, 26, 43);
  doc.rect(metaBoxX, metaBoxY, metaBoxW, 2, 'F');

  const now = new Date();
  const genDateStr = now.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
  const genTimeStr = now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
  const defaultRef = `NPS-RPT-${now.toISOString().slice(0, 10).replace(/-/g, '')}`;

  doc.setFontSize(6.2);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('FORM / ආකෘතිය:', metaBoxX + 6, metaBoxY + 11);
  doc.setTextColor(15, 23, 42);
  doc.text('GEN-136 (STORES)', metaBoxX + 66, metaBoxY + 11);

  doc.setTextColor(100, 116, 139);
  doc.text('REF NO / අංකය:', metaBoxX + 6, metaBoxY + 20);
  doc.setTextColor(15, 23, 42);
  doc.text(reportRef || defaultRef, metaBoxX + 66, metaBoxY + 20);

  doc.setTextColor(100, 116, 139);
  doc.text('DATE / දිනය:', metaBoxX + 6, metaBoxY + 29);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`${genDateStr}, ${genTimeStr}`, metaBoxX + 66, metaBoxY + 29);

  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('OFFICER / නිලධාරී:', metaBoxX + 6, metaBoxY + 38);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setTextColor(30, 41, 59);
  const officerTrimmed = generatedBy.length > 20 ? generatedBy.slice(0, 18) + '...' : generatedBy;
  doc.text(officerTrimmed, metaBoxX + 66, metaBoxY + 38);

  // Bottom Notice Bar
  doc.setFillColor(241, 245, 249);
  doc.rect(metaBoxX, metaBoxY + 41, metaBoxW, 7, 'F');
  doc.setFontSize(5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(112, 26, 43);
  doc.text('රාජ්‍ය විගණනය සඳහා පමණි • FOR OFFICIAL AUDIT ONLY', metaBoxX + (metaBoxW / 2), metaBoxY + 46.5, { align: 'center' });

  // 4. Dual Rule: Maroon + Champagne Gold
  const dividerY = headerTopY + 57;
  doc.setDrawColor(112, 26, 43); // Maroon
  doc.setLineWidth(1.5);
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  doc.setDrawColor(212, 160, 23); // Gold
  doc.setLineWidth(0.75);
  doc.line(marginX, dividerY + 2.5, pageWidth - marginX, dividerY + 2.5);

  // 5. Active Filter Scope Banner
  let currentY = dividerY + 8;
  if (filterScopeStr) {
    const bannerH = 15;
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, currentY, usableWidth, bannerH, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(marginX, currentY, usableWidth, bannerH, 'S');

    doc.setFontSize(6.5);
    doc.setFont('NotoSansSinhala', 'bold');
    doc.setTextColor(112, 26, 43);
    doc.text('විෂය පථය සහ පෙරහන් / SCOPE:', marginX + 6, currentY + 10.5);

    doc.setFont('NotoSansSinhala', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(filterScopeStr, marginX + 116, currentY + 10.5);

    currentY += bannerH + 6;
  }

  // 6. Formal Government Summary Ledger Block (Clean Boxed Ledger)
  if (kpiCards.length > 0) {
    const blockH = 32;
    const colW = usableWidth / kpiCards.length;

    // Outer border
    doc.setFillColor(255, 255, 255);
    doc.rect(marginX, currentY, usableWidth, blockH, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.6);
    doc.rect(marginX, currentY, usableWidth, blockH, 'S');

    // Subtle header background
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, currentY, usableWidth, 11, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, currentY + 11, marginX + usableWidth, currentY + 11);

    kpiCards.forEach((card, idx) => {
      const colX = marginX + (idx * colW);

      // Vertical separator between columns
      if (idx > 0) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(colX, currentY, colX, currentY + blockH);
      }

      // Column Header Label
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(5.8);
      doc.setFont('NotoSansSinhala', 'bold');
      doc.text(card.label, colX + (colW / 2), currentY + 8, { align: 'center' });

      // Metric Value
      doc.setTextColor(112, 26, 43);
      doc.setFontSize(9);
      doc.setFont('NotoSansSinhala', 'bold');
      doc.text(card.val, colX + (colW / 2), currentY + 21, { align: 'center' });

      // Subtext
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5.5);
      doc.setFont('NotoSansSinhala', 'normal');
      doc.text(card.sub, colX + (colW / 2), currentY + 28.5, { align: 'center' });
    });

    currentY += blockH + 8;
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

  // 1. Formal Statutory Verification Block on final page
  const finalY = (doc as any).lastAutoTable?.finalY || 400;
  const signatureHeight = 72;
  let signY = finalY + 12;

  if (signY + signatureHeight > pageHeight - 36) {
    doc.addPage();
    signY = 46;
  }

  // Container Box
  doc.setFillColor(255, 255, 255);
  doc.rect(marginX, signY, usableWidth, signatureHeight, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.rect(marginX, signY, usableWidth, signatureHeight, 'S');

  // Top Maroon Border Strip
  doc.setFillColor(112, 26, 43);
  doc.rect(marginX, signY, usableWidth, 2.5, 'F');

  // Title
  doc.setFontSize(6.8);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(112, 26, 43);
  doc.text('නිල ප්‍රකාශනය සහ ව්‍යවස්ථාපිත සහතික කිරීම  •  STATUTORY DECLARATION & AUDIT SIGN-OFF', marginX + 8, signY + 11);

  // Declaration Notice
  doc.setFontSize(5.8);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('ඉහත විස්තර කරන ලද සියලු තොරතුරු නියමිත පරිදි බලයලත් ලේඛන හා ගබඩා ප්‍රධාන ලේඛනය (Store Ledger / Bin Cards) හා සසඳා බලා නිවැරදි බවට මෙයින් සහතික කරමි.', marginX + 8, signY + 20);
  doc.text('I hereby certify that the particulars of inventory enumerated above have been duly verified with official Store Ledgers and requisitions.', marginX + 8, signY + 27);

  // 3 Signature Columns + Seal Box
  const sealWidth = 72;
  const signAreaWidth = usableWidth - sealWidth - 20;
  const signColWidth = signAreaWidth / 3;
  const lineY = signY + 50;

  // Col 1: Store Keeper
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(marginX + 8, lineY, marginX + 8 + signColWidth - 18, lineY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6.2);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('සකස් කළේ / PREPARED BY', marginX + 8, lineY + 8);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ගබඩා භාරකරු / Store Keeper', marginX + 8, lineY + 14.5);
  doc.text('දිනය / Date: ...................................', marginX + 8, lineY + 20.5);

  // Col 2: Internal Audit / Accountant
  const col2X = marginX + 8 + signColWidth;
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(col2X, lineY, col2X + signColWidth - 18, lineY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6.2);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('පරීක්ෂා කළේ / AUDITED & VERIFIED', col2X, lineY + 8);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('අභ්‍යන්තර විගණක / Accountant', col2X, lineY + 14.5);
  doc.text('දිනය / Date: ...................................', col2X, lineY + 20.5);

  // Col 3: Secretary / Chairman
  const col3X = marginX + 8 + (signColWidth * 2);
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(col3X, lineY, col3X + signColWidth - 18, lineY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6.2);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('අනුමත කළේ / APPROVED & SANCTIONED', col3X, lineY + 8);
  doc.setFont('NotoSansSinhala', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ලේකම් / සභාපති (Secretary / Chairman)', col3X, lineY + 14.5);
  doc.text('දිනය / Date: ...................................', col3X, lineY + 20.5);

  // Rubber Stamp Box
  const sealBoxX = marginX + usableWidth - sealWidth - 6;
  const sealBoxY = signY + 34;
  const sealBoxH = 34;

  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([2, 2], 0);
  doc.rect(sealBoxX, sealBoxY, sealWidth, sealBoxH, 'S');
  doc.setLineDashPattern([], 0);

  doc.setFontSize(5.5);
  doc.setFont('NotoSansSinhala', 'bold');
  doc.setTextColor(148, 163, 184);
  doc.text('නිල මුද්‍රාව සඳහා', sealBoxX + (sealWidth / 2), sealBoxY + 15, { align: 'center' });
  doc.text('OFFICIAL SEAL', sealBoxX + (sealWidth / 2), sealBoxY + 23, { align: 'center' });

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
