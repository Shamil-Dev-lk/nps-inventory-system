import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  initGovernmentReportPdf,
  finishGovernmentReportPdf,
  ReportKpiCard,
} from '@/lib/reports/report-pdf-base';

export interface IssueRecordForPdf {
  id: number;
  issue_number?: string | null;
  issue_date?: string | null;
  issue_to_type?: string | null;
  department?: { id: number; name_en: string; name_si?: string } | null;
  project?: { id: number; name_en: string; name_si?: string } | null;
  customer?: { id: number; name: string } | null;
  officer?: { id: number; name: string } | null;
  warehouse?: { id: number; name_en: string; name_si?: string } | null;
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
      name_si?: string | null;
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
    else if (issue.department?.name_si || issue.department?.name_en) {
      name = issue.department.name_si ? `${issue.department.name_si} (${issue.department.name_en})` : issue.department.name_en;
    } else if (issue.project?.name_en) name = issue.project.name_en;
    else name = '—';
  }

  let fullText = name;
  if (position) fullText += `\n(${position})`;
  if (nic) fullText += ` [NIC: ${nic}]`;
  return fullText;
};

export const getDepartmentOrPurpose = (issue: IssueRecordForPdf) => {
  const deptName = issue.department?.name_si
    ? `${issue.department.name_si} (${issue.department.name_en})`
    : (issue.department?.name_en || issue.project?.name_en || '');

  if (deptName && issue.purpose) {
    return `${deptName}\nඅරමුණ / Purpose: ${issue.purpose}`;
  }
  if (deptName) return deptName;
  if (issue.purpose) return `අරමුණ / Purpose: ${issue.purpose}`;
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
    const itemName = i.item?.name_si
      ? `${i.item.name_si} (${i.item?.name_en || ''})`
      : (i.item?.name_en || 'Unknown Item');
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

  // Metric calculations
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

  // Filter String
  let dateFilterText = 'සියලු දින / All Dates';
  if (filters.fromDate && filters.toDate) dateFilterText = `${filters.fromDate} to ${filters.toDate}`;
  else if (filters.fromDate) dateFilterText = `From ${filters.fromDate}`;
  else if (filters.toDate) dateFilterText = `Until ${filters.toDate}`;

  const deptFilterText = filters.departmentName || 'සියලු අංශ / All Departments';
  const statusFilterText = filters.status ? filters.status.toUpperCase() : 'සියලු තත්ත්ව / ALL';
  const searchFilterText = filters.search ? `"${filters.search}"` : 'None';

  const filterScopeStr = `[ Period: ${dateFilterText} ]   •   [ Dept: ${deptFilterText} ]   •   [ Status: ${statusFilterText} ]   •   [ Search: ${searchFilterText} ]`;

  const kpiCards: ReportKpiCard[] = [
    {
      label: 'නිකුත් කළ මුළු වාර / TOTAL ISSUES',
      val: `${totalIssues.toLocaleString()} Records`,
      sub: 'Matched Filter Criteria',
      color: [112, 26, 43]
    },
    {
      label: 'නිකුත් කළ මුළු ප්‍රමාණය / TOTAL UNITS',
      val: `${totalUnitsIssued.toLocaleString()} Units`,
      sub: 'All Dispatched Goods',
      color: [16, 120, 60]
    },
    {
      label: 'ලැබුම්කරුවන් / UNIQUE RECIPIENTS',
      val: `${uniqueRecipientsSet.size} Recipients`,
      sub: 'Officers & Departments',
      color: [37, 99, 235]
    },
    {
      label: 'තත්ත්ව සාරාංශය / STATUS SUMMARY',
      val: `${issuedCount} Issued • ${approvedCount} Appr`,
      sub: `${draftCount} Draft • ${rejectedCount} Rejected`,
      color: [124, 58, 237]
    }
  ];

  // Initialize Base Government Document
  const context = initGovernmentReportPdf({
    titleSi: 'බඩුතොග නිකුත් කිරීම් වාර්තාව',
    titleEn: 'Stock Issue & Dispatch Report',
    reportRef: `IS-RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    generatedBy,
    orientation,
    filterScopeStr,
    kpiCards,
  });

  const { doc, isLandscape, marginX, tableStartY } = context;

  // Table rows
  const tableRows = issues.map((iss, index) => {
    const issueNum = iss.issue_number || `IS-${String(iss.id || 0).padStart(4, '0')}`;
    const dateFormatted = iss.issue_date
      ? new Date(iss.issue_date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: '2-digit' })
      : '—';
    const recipient = getRecipientDetails(iss);
    const deptPurpose = getDepartmentOrPurpose(iss);
    const warehouse = iss.warehouse?.name_si
      ? `${iss.warehouse.name_si} (${iss.warehouse.name_en})`
      : (iss.warehouse?.name_en || '—');
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

  autoTable(doc, {
    head: [['#', 'නිකුත් අංකය\nIssue No.', 'දිනය\nDate', 'ලැබුම්කරු\nRecipient / Officer', 'අංශය / අරමුණ\nDepartment / Purpose', 'ගබඩාව\nWarehouse', 'නිකුත් කළ අයිතම\nDispatched Items', 'ප්‍රමාණය\nQty', 'නිකුත් කළේ\nIssued By', 'තත්ත්වය\nStatus']],
    body: tableRows.length > 0 ? tableRows : [['—', '—', '—', 'තොරතුරු හමු නොවීය / No stock issues match criteria.', '—', '—', '—', '0', '—', '—']],
    startY: tableStartY,
    margin: { top: 50, right: marginX, bottom: 42, left: marginX },
    showHead: 'everyPage',
    styles: {
      font: 'NotoSansSinhala',
      fontSize: isLandscape ? 7 : 6.4,
      cellPadding: 3.8,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
      overflow: 'linebreak',
    },
    headStyles: {
      font: 'NotoSansSinhala',
      fontStyle: 'bold',
      fillColor: [112, 26, 43],
      textColor: [255, 255, 255],
      fontSize: isLandscape ? 7.2 : 6.8,
      cellPadding: 4.5,
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253],
    },
    columnStyles: isLandscape ? landscapeColStyles : portraitColStyles,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 9) {
        data.cell.text = [''];
      }
    },
    didDrawCell: (data) => {
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
        doc.setFont('NotoSansSinhala', 'bold');
        doc.setTextColor(fg[0], fg[1], fg[2]);
        doc.text(rawText, badgeX + (badgeW / 2), badgeY + 9, { align: 'center' });
      }
    }
  });

  return finishGovernmentReportPdf(context, 'බඩුතොග නිකුත් කිරීම් වාර්තාව / Stock Issue Report', deptFilterText);
}
