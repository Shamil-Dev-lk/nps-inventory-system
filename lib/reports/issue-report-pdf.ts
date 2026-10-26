import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NotoSansSinhala } from '@/lib/sinhala-font';
import { logoBase64 } from '@/lib/assets/logo-base64';

export interface IssueRecordForPdf {
  id: number;
  issue_number?: string | null;
  issue_date?: string | null;
  issue_to_type?: string | null;
  department?: { id: number; name_en: string } | null;
  project?: { id: number; name_en: string } | null;
  customer?: { id: number; name: string } | null;
  officer?: { id: number; name: string } | null;
  warehouse?: { id: number; name_en: string } | null;
  purpose?: string | null;
  remarks?: string | null;
  status?: string | null;
  issued_by?: { name?: string } | string | null;
  created_by?: string | null;
  items?: Array<{
    quantity: number;
    remarks?: string | null;
    item?: {
      id?: number;
      code?: string | null;
      item_code?: string | null;
      name_en?: string | null;
      unit?: { symbol?: string; name_en?: string } | null;
    } | null;
  }>;
}

export interface IssueReportPdfOptions {
  issues: IssueRecordForPdf[];
  filters: {
    departmentName?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  };
  generatedBy?: string;
  orientation?: 'landscape' | 'portrait';
}

export const getRecipientDetails = (issue: IssueRecordForPdf) => {
  let name = '';
  let position = '';
  let nic = '';

  if (issue.remarks && issue.remarks.includes('[Person Details]')) {
    const nameMatch = issue.remarks.match(/Name:\s*([^|\n]+)/);
    if (nameMatch && nameMatch[1]) name = nameMatch[1].trim();
    const posMatch = issue.remarks.match(/Position:\s*([^|\n]+)/);
    if (posMatch && posMatch[1]) position = posMatch[1].trim();
    const idMatch = issue.remarks.match(/ID:\s*([^|\n]+)/);
    if (idMatch && idMatch[1]) nic = idMatch[1].trim();
  }

  if (!name) {
    if (issue.customer?.name) name = issue.customer.name;
    else if (issue.officer?.name) name = issue.officer.name;
    else if (issue.department?.name_en) name = issue.department.name_en;
    else if (issue.project?.name_en) name = issue.project.name_en;
    else name = '—';
  }

  let fullText = name;
  if (position) fullText += `\n(${position})`;
  if (nic) fullText += ` [NIC: ${nic}]`;
  return fullText;
};

export const getDepartmentOrPurpose = (issue: IssueRecordForPdf) => {
  if (issue.department?.name_en && issue.purpose) {
    return `${issue.department.name_en}\nPurpose: ${issue.purpose}`;
  }
  if (issue.department?.name_en) return issue.department.name_en;
  if (issue.project?.name_en) return issue.project.name_en;
  if (issue.purpose) return `Purpose: ${issue.purpose}`;
  return '—';
};

export const getIssuedBy = (issue: IssueRecordForPdf) => {
  if (typeof issue.issued_by === 'object' && issue.issued_by?.name) return issue.issued_by.name;
  if (typeof issue.issued_by === 'string' && issue.issued_by) return issue.issued_by;
  if (issue.created_by) return issue.created_by;
  return 'Store Admin';
};

export const formatIssuedItemsList = (items?: IssueRecordForPdf['items']) => {
  if (!items || items.length === 0) return '—';
  return items.map((i, idx) => {
    const itemName = i.item?.name_en || 'Unknown Item';
    const itemCode = i.item?.code || i.item?.item_code || '';
    const qty = Number(i.quantity || 0);
    const unitSymbol = i.item?.unit?.symbol || i.item?.unit?.name_en || '';
    const unitSuffix = unitSymbol ? ` ${unitSymbol}` : '';
    const codePrefix = itemCode ? `[${itemCode}] ` : '';
    return `${idx + 1}. ${codePrefix}${itemName} — Qty: ${qty}${unitSuffix}`;
  }).join('\n');
};

export const calculateTotalQty = (items?: IssueRecordForPdf['items']) => {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
};

export function generateIssueReportPdf(options: IssueReportPdfOptions): jsPDF {
  const {
    issues,
    filters,
    generatedBy = 'Store Administration',
    orientation = 'landscape'
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

  // Sinhala Font Registration
  try {
    doc.addFileToVFS('NotoSansSinhala.ttf', NotoSansSinhala);
    doc.addFont('NotoSansSinhala.ttf', 'NotoSansSinhala', 'normal');
    doc.setFont('NotoSansSinhala');
  } catch (e) {
    console.warn('Sinhala font registration notice:', e);
  }

  // Summary Metrics Calculation
  const totalIssues = issues.length;
  let totalUnitsIssued = 0;
  const uniqueRecipientsSet = new Set<string>();
  let issuedCount = 0;
  let approvedCount = 0;
  let draftCount = 0;
  let rejectedCount = 0;

  issues.forEach(issue => {
    const recip = getRecipientDetails(issue).split('\n')[0].trim();
    if (recip && recip !== '—') uniqueRecipientsSet.add(recip);

    const st = (issue.status || 'draft').toLowerCase();
    if (st === 'issued') issuedCount++;
    else if (st === 'approved') approvedCount++;
    else if (st === 'draft') draftCount++;
    else if (st === 'rejected') rejectedCount++;

    totalUnitsIssued += calculateTotalQty(issue.items);
  });

  // ==========================================
  // PAGE 1: OFFICIAL GOVERNMENT HEADER
  // ==========================================
  const logoWidth = 46;
  const logoHeight = 46;
  const headerTopY = 20;

  // 1. Official Institutional Emblem
  try {
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', marginX, headerTopY, logoWidth, logoHeight);
    }
  } catch (err) {
    console.warn('Logo render fallback:', err);
  }

  // Vertical separator next to logo
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(marginX + logoWidth + 8, headerTopY + 2, marginX + logoWidth + 8, headerTopY + 44);

  // 2. Official Bilingual & National Typography
  const textLeftX = marginX + logoWidth + 16;

  // National Crest Line
  doc.setTextColor(112, 26, 43); // Deep Maroon
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA', textLeftX, headerTopY + 8);

  // Institution Primary Name
  doc.setTextColor(17, 24, 39); // Deep Charcoal
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('NIKAWERATIYA PRADESHIYA SABHA', textLeftX, headerTopY + 21);

  // Subtitle / Council Division
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Inventory & Stores Management Division • Government Store System', textLeftX, headerTopY + 32);

  // Document Title
  doc.setTextColor(112, 26, 43); // Deep Maroon
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL INVENTORY ISSUE & DISPATCH REPORT', textLeftX, headerTopY + 44);

  // 3. Right-aligned Metadata Framed Passport Card
  const metaBoxW = isLandscape ? 190 : 160;
  const metaBoxH = 46;
  const metaBoxX = pageWidth - marginX - metaBoxW;
  const metaBoxY = headerTopY;

  // Card Background & Border
  doc.setFillColor(252, 253, 255);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, 3, 3, 'S');

  // Maroon left border accent on metadata box
  doc.setFillColor(112, 26, 43);
  doc.rect(metaBoxX, metaBoxY, 2.5, metaBoxH, 'F');

  const genDateStr = new Date().toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
  const genTimeStr = new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('REPORT REF:', metaBoxX + 8, metaBoxY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`IS-RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`, metaBoxX + 58, metaBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('GENERATED:', metaBoxX + 8, metaBoxY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text(`${genDateStr}, ${genTimeStr}`, metaBoxX + 58, metaBoxY + 21);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('OFFICER:', metaBoxX + 8, metaBoxY + 31);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text(`${generatedBy.length > 22 ? generatedBy.slice(0, 20) + '...' : generatedBy}`, metaBoxX + 58, metaBoxY + 31);

  // Security Status Pill Badge inside metadata box
  doc.setFillColor(220, 252, 231); // Soft Green
  doc.roundedRect(metaBoxX + 8, metaBoxY + 35, metaBoxW - 16, 8, 2, 2, 'F');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('AUDIT VERIFIED • OFFICIAL GOVERNMENT RECORD', metaBoxX + (metaBoxW / 2), metaBoxY + 41, { align: 'center' });

  // 4. Primary Maroon & Champagne Dual Divider Line
  const dividerY = headerTopY + 52;
  doc.setDrawColor(112, 26, 43); // Deep Maroon
  doc.setLineWidth(1.5);
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  // Champagne Gold Accent Line beneath
  doc.setDrawColor(212, 160, 23); // Gold
  doc.setLineWidth(0.75);
  doc.line(marginX, dividerY + 2.5, pageWidth - marginX, dividerY + 2.5);

  // 5. Active Filter Scope Banner Pill
  const filterY = dividerY + 10;
  const filterBannerH = 16;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, filterY, usableWidth, filterBannerH, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(marginX, filterY, usableWidth, filterBannerH, 3, 3, 'S');

  let dateFilterText = 'All Dates';
  if (filters.fromDate && filters.toDate) dateFilterText = `${filters.fromDate} to ${filters.toDate}`;
  else if (filters.fromDate) dateFilterText = `From ${filters.fromDate}`;
  else if (filters.toDate) dateFilterText = `Until ${filters.toDate}`;

  const deptFilterText = filters.departmentName || 'All Departments';
  const statusFilterText = filters.status ? filters.status.toUpperCase() : 'All Statuses';
  const searchFilterText = filters.search ? `"${filters.search}"` : 'None';

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(112, 26, 43);
  doc.text('ACTIVE FILTER SCOPE:', marginX + 8, filterY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  const filterStr = `[ Period: ${dateFilterText} ]   •   [ Department: ${deptFilterText} ]   •   [ Status: ${statusFilterText} ]   •   [ Search: ${searchFilterText} ]`;
  doc.text(filterStr, marginX + 94, filterY + 11);

  // 6. Executive Summary KPI Cards
  const summaryY = filterY + filterBannerH + 7;
  const summaryCardHeight = 36;
  const cardGap = 8;
  const numCards = 4;
  const cardWidth = (usableWidth - (cardGap * (numCards - 1))) / numCards;

  const summaryCardsData = [
    {
      label: 'TOTAL ISSUE RECORDS',
      val: `${totalIssues.toLocaleString()} Records`,
      sub: 'Matched Filter Criteria',
      color: [112, 26, 43] // Maroon
    },
    {
      label: 'TOTAL UNITS ISSUED',
      val: `${totalUnitsIssued.toLocaleString()} Units`,
      sub: 'All Dispatched Goods',
      color: [16, 120, 60] // Emerald Green
    },
    {
      label: 'UNIQUE RECIPIENTS',
      val: `${uniqueRecipientsSet.size} Recipients`,
      sub: 'Officers & Departments',
      color: [37, 99, 235] // Slate Blue
    },
    {
      label: 'STATUS BREAKDOWN',
      val: `${issuedCount} Issued • ${approvedCount} Appr`,
      sub: `${draftCount} Draft • ${rejectedCount} Rejected`,
      color: [124, 58, 237] // Purple
    }
  ];

  summaryCardsData.forEach((card, idx) => {
    const cardX = marginX + (idx * (cardWidth + cardGap));

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, summaryY, cardWidth, summaryCardHeight, 3, 3, 'F');

    // Card border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(cardX, summaryY, cardWidth, summaryCardHeight, 3, 3, 'S');

    // Left vertical accent stripe
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(cardX, summaryY, 2.5, summaryCardHeight, 'F');

    // Card Title
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'bold');
    doc.text(card.label, cardX + 8, summaryY + 10);

    // Card Value
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(card.val, cardX + 8, summaryY + 22);

    // Card Subtext
    doc.setTextColor(120, 130, 145);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.text(card.sub, cardX + 8, summaryY + 31);
  });

  // ==========================================
  // TABLE DATA PREPARATION
  // ==========================================
  const tableRows = issues.map((iss, index) => {
    const issueNum = iss.issue_number || `IS-${String(iss.id || 0).padStart(4, '0')}`;
    const dateFormatted = iss.issue_date
      ? new Date(iss.issue_date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: '2-digit' })
      : '—';
    const recipient = getRecipientDetails(iss);
    const deptPurpose = getDepartmentOrPurpose(iss);
    const warehouse = iss.warehouse?.name_en || '—';
    const itemsFormatted = formatIssuedItemsList(iss.items);
    const totalQty = calculateTotalQty(iss.items);
    const issuedBy = getIssuedBy(iss);
    const statusText = (iss.status || 'draft').toUpperCase();

    return [
      String(index + 1),
      issueNum,
      dateFormatted,
      recipient,
      deptPurpose,
      warehouse,
      itemsFormatted,
      totalQty.toLocaleString(),
      issuedBy,
      statusText
    ];
  });

  // Table Column Styles & Widths (Total: 785 pt for landscape, 539 pt for portrait)
  const landscapeColStyles = {
    0: { halign: 'center' as const, cellWidth: 24 },
    1: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 54 },
    2: { halign: 'center' as const, cellWidth: 52 },
    3: { cellWidth: 114 },
    4: { cellWidth: 90 },
    5: { cellWidth: 64 },
    6: { cellWidth: 236 },
    7: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 38 },
    8: { halign: 'center' as const, cellWidth: 61 },
    9: { halign: 'center' as const, cellWidth: 52 }
  };

  const portraitColStyles = {
    0: { halign: 'center' as const, cellWidth: 20 },
    1: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 46 },
    2: { halign: 'center' as const, cellWidth: 46 },
    3: { cellWidth: 80 },
    4: { cellWidth: 65 },
    5: { cellWidth: 50 },
    6: { cellWidth: 125 },
    7: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 30 },
    8: { halign: 'center' as const, cellWidth: 40 },
    9: { halign: 'center' as const, cellWidth: 37 }
  };

  // Render Table
  autoTable(doc, {
    head: [['#', 'Issue No.', 'Issue Date', 'Recipient / Officer', 'Department / Purpose', 'Warehouse', 'Items Issued & Line Quantities', 'Qty', 'Issued By', 'Status']],
    body: tableRows.length > 0 ? tableRows : [['—', '—', '—', 'No stock issues match the selected filter criteria.', '—', '—', '—', '0', '—', '—']],
    startY: summaryY + summaryCardHeight + 11,
    margin: { top: 50, right: marginX, bottom: 42, left: marginX },
    showHead: 'everyPage',
    styles: {
      fontSize: isLandscape ? 7 : 6.4,
      cellPadding: 3.8,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [112, 26, 43], // Deep Maroon
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: isLandscape ? 7.2 : 6.8,
      cellPadding: 4.5,
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253],
    },
    columnStyles: isLandscape ? landscapeColStyles : portraitColStyles,
    didParseCell: (data) => {
      // Empty default text for status column so custom pill is drawn cleanly
      if (data.section === 'body' && data.column.index === 9) {
        data.cell.text = [''];
      }
    },
    didDrawCell: (data) => {
      // Draw status pill badge
      if (data.section === 'body' && data.column.index === 9) {
        const rawText = String(data.cell.raw || '');
        if (!rawText || rawText === '—') return;

        const badgeW = data.cell.width - 6;
        const badgeH = 13;
        const badgeX = data.cell.x + 3;
        const badgeY = data.cell.y + (data.cell.height - badgeH) / 2;

        let bg = [243, 244, 246];
        let fg = [55, 65, 81];
        let border = [209, 213, 219];

        if (rawText === 'ISSUED') {
          bg = [220, 252, 231];
          fg = [22, 101, 52];
          border = [187, 247, 208];
        } else if (rawText === 'APPROVED') {
          bg = [224, 242, 254];
          fg = [3, 105, 161];
          border = [186, 230, 253];
        } else if (rawText === 'DRAFT') {
          bg = [254, 243, 199];
          fg = [146, 64, 14];
          border = [253, 230, 138];
        } else if (rawText === 'REJECTED') {
          bg = [254, 226, 226];
          fg = [153, 27, 27];
          border = [254, 202, 202];
        }

        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.setDrawColor(border[0], border[1], border[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2.5, 2.5, 'FD');

        doc.setFontSize(isLandscape ? 6.2 : 5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(fg[0], fg[1], fg[2]);
        doc.text(rawText, badgeX + (badgeW / 2), badgeY + 9, { align: 'center' });
      }
    },
    didDrawPage: (data) => {
      // Top Running Header on Subsequent Pages (> 1)
      if (data.pageNumber > 1) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(112, 26, 43);
        doc.text('NIKAWERATIYA PRADESHIYA SABHA • INVENTORY ISSUE REPORT (CONTINUATION)', marginX, 26);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(107, 114, 128);
        doc.text(`Scope: ${deptFilterText} | Status: ${statusFilterText} | Generated: ${genDateStr}`, pageWidth - marginX, 26, { align: 'right' });

        doc.setDrawColor(112, 26, 43);
        doc.setLineWidth(1.2);
        doc.line(marginX, 33, pageWidth - marginX, 33);

        doc.setDrawColor(212, 160, 23);
        doc.setLineWidth(0.5);
        doc.line(marginX, 35, pageWidth - marginX, 35);
      }
    }
  });

  // ==========================================
  // OFFICIAL INSTITUTIONAL VERIFICATION BLOCK
  // ==========================================
  const finalY = (doc as any).lastAutoTable?.finalY || 400;
  const signatureHeight = 62;
  let signY = finalY + 14;

  if (signY + signatureHeight > pageHeight - 38) {
    doc.addPage();
    signY = 50;
  }

  // Container
  doc.setFillColor(252, 253, 255);
  doc.roundedRect(marginX, signY, usableWidth, signatureHeight, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(marginX, signY, usableWidth, signatureHeight, 3, 3, 'S');

  // Top Maroon Header Accent
  doc.setFillColor(112, 26, 43);
  doc.rect(marginX, signY, usableWidth, 2, 'F');

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(112, 26, 43);
  doc.text('OFFICIAL VERIFICATION, AUDIT REVIEW & INSTITUTIONAL SANCTION', marginX + 10, signY + 10);

  // 3 Signature Columns + Stamp Box
  const signColWidth = (usableWidth - 20) / 3;
  const lineY = signY + 34;

  // 1. Prepared By
  doc.setDrawColor(156, 163, 175);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(marginX + 10, lineY, marginX + 10 + signColWidth - 25, lineY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('PREPARED & DISPATCHED BY', marginX + 10, lineY + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(107, 114, 128);
  doc.text('Store Keeper / Inventory Officer', marginX + 10, lineY + 17);
  doc.text('Date: ...........................................', marginX + 10, lineY + 24);

  // 2. Verified By
  const col2X = marginX + 10 + signColWidth;
  doc.setDrawColor(156, 163, 175);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(col2X, lineY, col2X + signColWidth - 25, lineY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('VERIFIED & AUDITED BY', col2X, lineY + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(107, 114, 128);
  doc.text('Accountant / Internal Auditor', col2X, lineY + 17);
  doc.text('Date: ...........................................', col2X, lineY + 24);

  // 3. Approved By & Seal
  const col3X = marginX + 10 + (signColWidth * 2);
  doc.setDrawColor(156, 163, 175);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(col3X, lineY, col3X + signColWidth - 30, lineY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('APPROVED & SANCTIONED BY', col3X, lineY + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(107, 114, 128);
  doc.text('Secretary / Executive Chairman', col3X, lineY + 17);
  doc.text('Date: ...........................................', col3X, lineY + 24);

  // ==========================================
  // FOOTER ON ALL PAGES (TWO-PASS)
  // ==========================================
  const totalPagesCount = typeof (doc as any).getNumberOfPages === 'function'
    ? (doc as any).getNumberOfPages()
    : Math.max(1, (doc.internal.pages.length || 2) - 1);

  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);

    const footerY = pageHeight - 20;

    // Thin separator line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(marginX, footerY - 8, pageWidth - marginX, footerY - 8);

    // Left Footer: Institutional identifier
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Nikaweratiya Pradeshiya Sabha • ANTIGRAVITY Inventory Management System', marginX, footerY);

    // Center Footer: Official Government Audit Notice
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(112, 26, 43);
    doc.text('OFFICIAL GOVERNMENT RECORD — FOR INTERNAL & AUDIT USE ONLY', pageWidth / 2, footerY, { align: 'center' });

    // Right Footer: Page Numbers
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text(`Page ${i} of ${totalPagesCount}`, pageWidth - marginX, footerY, { align: 'right' });
  }

  return doc;
}
