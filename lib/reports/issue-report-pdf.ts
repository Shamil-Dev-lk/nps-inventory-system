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
  if (nic) fullText += ` [${nic}]`;
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
    return `${idx + 1}. ${codePrefix}${itemName} (${qty}${unitSuffix})`;
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
    generatedBy = 'System User',
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
  const marginX = 32;
  const usableWidth = pageWidth - (marginX * 2);

  // Add Sinhala Font
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
  const logoWidth = 44;
  const logoHeight = 44;
  const headerTopY = 22;

  // 1. Logo
  try {
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', marginX, headerTopY, logoWidth, logoHeight);
    }
  } catch (err) {
    console.warn('Logo render fallback:', err);
  }

  // 2. Official Titles
  const textLeftX = marginX + logoWidth + 12;
  
  doc.setTextColor(112, 26, 43); // Deep Maroon
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA', textLeftX, headerTopY + 9);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('NIKAWERATIYA PRADESHIYA SABHA', textLeftX, headerTopY + 22);

  doc.setTextColor(55, 65, 81); // Dark Charcoal
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Inventory & Store Management Division • Government Store System', textLeftX, headerTopY + 33);

  doc.setTextColor(112, 26, 43); // Deep Maroon
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL INVENTORY ISSUE REPORT', textLeftX, headerTopY + 45);

  // 3. Metadata Card (Right-aligned)
  const metaRightX = pageWidth - marginX;
  const genDateStr = new Date().toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
  const genTimeStr = new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Report ID: IS-RPT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`, metaRightX, headerTopY + 9, { align: 'right' });
  doc.text(`Generated: ${genDateStr} at ${genTimeStr}`, metaRightX, headerTopY + 20, { align: 'right' });
  doc.text(`Authorized Officer: ${generatedBy}`, metaRightX, headerTopY + 31, { align: 'right' });
  
  doc.setTextColor(112, 26, 43);
  doc.setFont('helvetica', 'bold');
  doc.text('CLASSIFICATION: OFFICIAL RECORD', metaRightX, headerTopY + 42, { align: 'right' });

  // 4. Primary Maroon Divider Line
  const dividerY = headerTopY + 52;
  doc.setDrawColor(112, 26, 43); // Deep Maroon
  doc.setLineWidth(1.5);
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  // Subtle accent line beneath
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(marginX, dividerY + 2, pageWidth - marginX, dividerY + 2);

  // 5. Active Filter Description Bar
  const filterY = dividerY + 12;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  let dateFilterText = 'All Dates';
  if (filters.fromDate && filters.toDate) dateFilterText = `${filters.fromDate} to ${filters.toDate}`;
  else if (filters.fromDate) dateFilterText = `From ${filters.fromDate}`;
  else if (filters.toDate) dateFilterText = `Until ${filters.toDate}`;

  const deptFilterText = filters.departmentName || 'All Departments';
  const statusFilterText = filters.status ? filters.status.toUpperCase() : 'All Statuses';
  const searchFilterText = filters.search ? `"${filters.search}"` : 'None';

  const filterSummary = `Active Filter Scope:  [Period: ${dateFilterText}]   |   [Department: ${deptFilterText}]   |   [Status: ${statusFilterText}]   |   [Keyword Search: ${searchFilterText}]`;
  doc.text(filterSummary, marginX, filterY);

  // 6. Executive Summary Metrics Cards
  const summaryY = filterY + 8;
  const summaryCardHeight = 36;
  const cardGap = 8;
  const numCards = 4;
  const cardWidth = (usableWidth - (cardGap * (numCards - 1))) / numCards;

  const summaryCardsData = [
    { label: 'TOTAL ISSUE RECORDS', val: `${totalIssues} Orders`, sub: 'Matched Filter Criteria' },
    { label: 'TOTAL UNITS ISSUED', val: `${totalUnitsIssued.toLocaleString()} Units`, sub: 'All Dispatched Items' },
    { label: 'UNIQUE RECIPIENTS', val: `${uniqueRecipientsSet.size} Recipients`, sub: 'Officers & Departments' },
    { label: 'STATUS BREAKDOWN', val: `${issuedCount} Issued • ${approvedCount} Appr`, sub: `${draftCount} Draft • ${rejectedCount} Rejected` }
  ];

  summaryCardsData.forEach((card, idx) => {
    const cardX = marginX + (idx * (cardWidth + cardGap));

    // Card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, summaryY, cardWidth, summaryCardHeight, 3, 3, 'F');

    // Card outline
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(cardX, summaryY, cardWidth, summaryCardHeight, 3, 3, 'S');

    // Top maroon accent bar on card
    doc.setFillColor(112, 26, 43);
    doc.rect(cardX, summaryY, cardWidth, 2, 'F');

    // Card Title
    doc.setTextColor(112, 26, 43);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(card.label, cardX + 8, summaryY + 11);

    // Card Value
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(card.val, cardX + 8, summaryY + 23);

    // Card Subtext
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(card.sub, cardX + 8, summaryY + 31);
  });

  // ==========================================
  // TABLE DATA PREPARATION
  // ==========================================
  const tableRows = issues.map((iss, index) => {
    const issueNum = iss.issue_number || `IS-${String(iss.id || 0).padStart(4, '0')}`;
    const dateFormatted = iss.issue_date
      ? new Date(iss.issue_date).toLocaleDateString('en-LK', { year: 'numeric', month: '2-digit', day: '2-digit' })
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

  // Table Column Styles & Widths (Total: 777 pt for landscape)
  const landscapeColStyles = {
    0: { halign: 'center' as const, cellWidth: 24 },
    1: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 52 },
    2: { halign: 'center' as const, cellWidth: 50 },
    3: { cellWidth: 115 },
    4: { cellWidth: 90 },
    5: { cellWidth: 65 },
    6: { cellWidth: 230 },
    7: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 38 },
    8: { halign: 'center' as const, cellWidth: 61 },
    9: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 52 }
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
    9: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 40 }
  };

  // Render Table
  autoTable(doc, {
    head: [['#', 'Issue No.', 'Issue Date', 'Recipient / Officer', 'Department / Purpose', 'Warehouse', 'Items Issued & Line Quantities', 'Qty', 'Issued By', 'Status']],
    body: tableRows.length > 0 ? tableRows : [['—', '—', '—', 'No stock issues match the selected filter criteria.', '—', '—', '—', '0', '—', '—']],
    startY: summaryY + summaryCardHeight + 12,
    margin: { top: 54, right: marginX, bottom: 42, left: marginX },
    showHead: 'everyPage',
    styles: {
      fontSize: isLandscape ? 7.2 : 6.5,
      cellPadding: 3.5,
      textColor: [31, 41, 55],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [112, 26, 43], // Deep Maroon
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: isLandscape ? 7.5 : 7,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
    columnStyles: isLandscape ? landscapeColStyles : portraitColStyles,
    didParseCell: (data) => {
      // Format Status Column text colors
      if (data.section === 'body' && data.column.index === 9) {
        const text = String(data.cell.raw || '');
        if (text === 'ISSUED') {
          data.cell.styles.textColor = [16, 120, 60]; // Green
        } else if (text === 'REJECTED') {
          data.cell.styles.textColor = [185, 28, 28]; // Red
        } else if (text === 'APPROVED') {
          data.cell.styles.textColor = [2, 132, 199]; // Blue
        } else if (text === 'DRAFT') {
          data.cell.styles.textColor = [180, 83, 9]; // Amber
        }
      }
    },
    didDrawPage: (data) => {
      // Top Running Header on Subsequent Pages (> 1)
      if (data.pageNumber > 1) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(112, 26, 43);
        doc.text('NIKAWERATIYA PRADESHIYA SABHA • INVENTORY ISSUE REPORT (CONTINUED)', marginX, 28);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.text(`Filter Scope: ${deptFilterText} | Status: ${statusFilterText} | Generated: ${genDateStr}`, pageWidth - marginX, 28, { align: 'right' });

        doc.setDrawColor(112, 26, 43);
        doc.setLineWidth(1);
        doc.line(marginX, 36, pageWidth - marginX, 36);
      }
    }
  });

  // ==========================================
  // FOOTER ON ALL PAGES (TWO-PASS)
  // ==========================================
  const totalPagesCount = typeof (doc as any).getNumberOfPages === 'function'
    ? (doc as any).getNumberOfPages()
    : Math.max(1, (doc.internal.pages.length || 2) - 1);

  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);

    const footerY = pageHeight - 24;

    // Thin separator line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(marginX, footerY - 10, pageWidth - marginX, footerY - 10);

    // Left Footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Nikaweratiya Pradeshiya Sabha • ANTIGRAVITY Inventory Management System', marginX, footerY);

    // Center Footer: Confidentiality / Record Notice
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(112, 26, 43);
    doc.text('OFFICIAL GOVERNMENT RECORD — FOR INTERNAL & AUDIT USE ONLY', pageWidth / 2, footerY, { align: 'center' });

    // Right Footer: Page Numbers
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Page ${i} of ${totalPagesCount}`, pageWidth - marginX, footerY, { align: 'right' });
  }

  return doc;
}
