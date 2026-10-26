import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  initGovernmentReportPdf,
  finishGovernmentReportPdf,
  ReportKpiCard,
} from '@/lib/reports/report-pdf-base';

export interface GrnRecordForPdf {
  id: number;
  grn_number?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  received_date?: string | null;
  warehouse_id?: number | null;
  supplier_id?: number | null;
  status?: string | null;
  subtotal?: number | null;
  discount_amount?: number | null;
  tax_amount?: number | null;
  total_amount?: number | null;
  remarks?: string | null;
  received_by?: { name?: string } | string | null;
  supplier?: { id: number; company_name: string; contact_person?: string } | null;
  warehouse?: { id: number; name_en: string; name_si?: string } | null;
  items?: Array<{
    received_quantity: number;
    accepted_quantity: number;
    rejected_quantity?: number;
    unit_price?: number;
    total_price?: number;
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

export interface GrnReportPdfOptions {
  grns: GrnRecordForPdf[];
  filters: {
    supplierName?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  };
  generatedBy?: string;
  orientation?: 'landscape' | 'portrait';
}

export function generateGrnReportPdf(options: GrnReportPdfOptions): jsPDF {
  const {
    grns,
    filters,
    generatedBy = 'Store Administration',
    orientation = 'landscape',
  } = options;

  const totalGrns = grns.length;
  let totalAmount = 0;
  let totalUnitsReceived = 0;
  const suppliersSet = new Set<string>();
  let approvedCount = 0;
  let draftCount = 0;

  grns.forEach(g => {
    totalAmount += Number(g.total_amount || 0);
    if (g.supplier?.company_name) suppliersSet.add(g.supplier.company_name);

    const st = (g.status || 'draft').toLowerCase();
    if (st === 'approved') approvedCount++;
    else draftCount++;

    if (g.items) {
      g.items.forEach(i => {
        totalUnitsReceived += Number(i.accepted_quantity || i.received_quantity || 0);
      });
    }
  });

  let dateFilterText = 'සියලු දින / All Dates';
  if (filters.fromDate && filters.toDate) dateFilterText = `${filters.fromDate} to ${filters.toDate}`;
  else if (filters.fromDate) dateFilterText = `From ${filters.fromDate}`;
  else if (filters.toDate) dateFilterText = `Until ${filters.toDate}`;

  const supplierText = filters.supplierName || 'සියලු සැපයුම්කරුවන් / All Suppliers';
  const statusText = filters.status ? filters.status.toUpperCase() : 'සියලු තත්ත්ව / ALL';
  const searchText = filters.search ? `"${filters.search}"` : 'None';

  const filterScopeStr = `[ Period: ${dateFilterText} ]   •   [ Supplier: ${supplierText} ]   •   [ Status: ${statusText} ]   •   [ Search: ${searchText} ]`;

  const kpiCards: ReportKpiCard[] = [
    {
      label: 'මුළු ලැබීම් වාර / TOTAL GRN',
      val: `${totalGrns.toLocaleString()} Deliveries`,
      sub: 'Goods Received Notes',
      color: [112, 26, 43]
    },
    {
      label: 'භාණ්ඩ ලැබීමේ මුළු අගය / TOTAL VALUE',
      val: `Rs. ${totalAmount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${totalUnitsReceived.toLocaleString()} Total Units Accepted`,
      color: [16, 120, 60]
    },
    {
      label: 'සැපයුම්කරුවන් / SUPPLIERS',
      val: `${suppliersSet.size} Vendors`,
      sub: 'Contracted Companies',
      color: [37, 99, 235]
    },
    {
      label: 'තත්ත්ව සාරාංශය / STATUS',
      val: `${approvedCount} Approved • ${draftCount} Draft`,
      sub: 'Verification Audit',
      color: [124, 58, 237]
    }
  ];

  const context = initGovernmentReportPdf({
    titleSi: 'භාණ්ඩ ලැබීමේ සටහන් (GRN) වාර්තාව',
    titleEn: 'Goods Received Notes (GRN) & Procurement Audit Report',
    reportRef: `GRN-RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    generatedBy,
    orientation,
    filterScopeStr,
    kpiCards,
  });

  const { doc, isLandscape, marginX, tableStartY } = context;

  const tableRows = grns.map((g, index) => {
    const grnNo = g.grn_number || `GRN-${String(g.id).padStart(5, '0')}`;
    const dateStr = g.received_date
      ? new Date(g.received_date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: '2-digit' })
      : '—';
    const supplier = g.supplier?.company_name || '—';
    const invoice = g.invoice_number ? `Inv: ${g.invoice_number}` : '—';
    const warehouse = g.warehouse?.name_si
      ? `${g.warehouse.name_si} (${g.warehouse.name_en})`
      : (g.warehouse?.name_en || 'Main Store');

    const itemsSummary = (g.items || []).map((i, idx) => {
      const code = i.item?.code || i.item?.item_code || '';
      const name = i.item?.name_si || i.item?.name_en || 'Item';
      const qty = Number(i.accepted_quantity || i.received_quantity || 0);
      const unit = i.item?.unit?.symbol || '';
      return `${idx + 1}. [${code}] ${name} (${qty}${unit ? ' ' + unit : ''})`;
    }).join('\n') || '—';

    let totalUnits = 0;
    (g.items || []).forEach(i => {
      totalUnits += Number(i.accepted_quantity || i.received_quantity || 0);
    });

    const amount = Number(g.total_amount || 0);
    const statusText = (g.status || 'draft').toUpperCase();

    return [
      String(index + 1),
      grnNo,
      dateStr,
      supplier,
      invoice,
      warehouse,
      itemsSummary,
      totalUnits.toLocaleString(),
      amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      statusText
    ];
  });

  const landscapeColStyles = {
    0: { halign: 'center' as const, cellWidth: 24 },
    1: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 64 },
    2: { halign: 'center' as const, cellWidth: 55 },
    3: { cellWidth: 120 },
    4: { cellWidth: 85 },
    5: { cellWidth: 70 },
    6: { cellWidth: 215 },
    7: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 42 },
    8: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 60 },
    9: { halign: 'center' as const, cellWidth: 50 }
  };

  const portraitColStyles = {
    0: { halign: 'center' as const, cellWidth: 20 },
    1: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 52 },
    2: { halign: 'center' as const, cellWidth: 46 },
    3: { cellWidth: 80 },
    4: { cellWidth: 60 },
    5: { cellWidth: 50 },
    6: { cellWidth: 115 },
    7: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 32 },
    8: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 48 },
    9: { halign: 'center' as const, cellWidth: 36 }
  };

  autoTable(doc, {
    head: [['#', 'GRN අංකය\nGRN No.', 'ලැබුණු දිනය\nDate', 'සැපයුම්කරු\nSupplier', 'ඉන්වොයිසිය\nInvoice No.', 'ගබඩාව\nWarehouse', 'ලැබුණු අයිතම\nDelivered Items', 'ප්‍රමාණය\nQty', 'වටිනාකම (රු.)\nAmount (Rs)', 'තත්ත්වය\nStatus']],
    body: tableRows.length > 0 ? tableRows : [['—', '—', '—', 'තොරතුරු හමු නොවීය / No GRN records match criteria.', '—', '—', '—', '0', '0.00', '—']],
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
        const badgeH = 14;
        const badgeX = data.cell.x + 3;
        const badgeY = data.cell.y + (data.cell.height - badgeH) / 2;

        let bg = [240, 253, 244];
        let fg = [22, 101, 52];
        let border = [187, 247, 208];
        let label = 'APPROVED / අනුමතයි';

        if (rawText === 'DRAFT' || rawText === 'PENDING') {
          bg = [254, 252, 232];
          fg = [133, 77, 14];
          border = [254, 240, 138];
          label = 'DRAFT / කෙටුම්පත්';
        }

        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.setDrawColor(border[0], border[1], border[2]);
        doc.setLineWidth(0.5);
        doc.rect(badgeX, badgeY, badgeW, badgeH, 'FD');

        doc.setFontSize(isLandscape ? 5.8 : 5.2);
        doc.setFont('NotoSansSinhala', 'bold');
        doc.setTextColor(fg[0], fg[1], fg[2]);
        doc.text(label, badgeX + (badgeW / 2), badgeY + 9.5, { align: 'center' });
      }
    }
  });

  return finishGovernmentReportPdf(context, 'භාණ්ඩ ලැබීමේ සටහන් (GRN) වාර්තාව / GRN Report', supplierText);
}
