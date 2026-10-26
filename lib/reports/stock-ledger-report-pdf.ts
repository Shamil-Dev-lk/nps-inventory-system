import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  initGovernmentReportPdf,
  finishGovernmentReportPdf,
  ReportKpiCard,
} from '@/lib/reports/report-pdf-base';

export interface LedgerEntryForPdf {
  id: number;
  transaction_date?: string | null;
  transaction_type?: string | null;
  reference_number?: string | null;
  reference_type?: string | null;
  quantity_in?: number | null;
  quantity_out?: number | null;
  balance?: number | null;
  unit_cost?: number | null;
  total_value?: number | null;
  remarks?: string | null;
  item?: {
    id?: number;
    code?: string | null;
    item_code?: string | null;
    name_en?: string | null;
    name_si?: string | null;
  } | null;
  warehouse?: {
    id?: number;
    name_en?: string | null;
    name_si?: string | null;
  } | null;
}

export interface StockLedgerPdfOptions {
  entries: LedgerEntryForPdf[];
  filters: {
    itemName?: string;
    warehouseName?: string;
    transactionType?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  };
  generatedBy?: string;
  orientation?: 'landscape' | 'portrait';
}

export function generateStockLedgerPdf(options: StockLedgerPdfOptions): jsPDF {
  const {
    entries,
    filters,
    generatedBy = 'Store Administration',
    orientation = 'landscape',
  } = options;

  const totalTransactions = entries.length;
  let totalIn = 0;
  let totalOut = 0;
  let totalValue = 0;

  entries.forEach(e => {
    totalIn += Number(e.quantity_in || 0);
    totalOut += Number(e.quantity_out || 0);
    totalValue += Number(e.total_value || 0);
  });

  const netChange = totalIn - totalOut;

  let dateFilterText = 'සියලු දින / All Dates';
  if (filters.fromDate && filters.toDate) dateFilterText = `${filters.fromDate} to ${filters.toDate}`;
  else if (filters.fromDate) dateFilterText = `From ${filters.fromDate}`;
  else if (filters.toDate) dateFilterText = `Until ${filters.toDate}`;

  const itemText = filters.itemName || 'සියලු අයිතම / All Items';
  const warehouseText = filters.warehouseName || 'සියලු ගබඩා / All Warehouses';
  const typeText = filters.transactionType ? filters.transactionType.toUpperCase() : 'සියලු වර්ග / ALL';

  const filterScopeStr = `[ Period: ${dateFilterText} ]   •   [ Item: ${itemText} ]   •   [ Warehouse: ${warehouseText} ]   •   [ Type: ${typeText} ]`;

  const kpiCards: ReportKpiCard[] = [
    {
      label: 'මුළු ගනුදෙනු වාර / TOTAL ENTRIES',
      val: `${totalTransactions.toLocaleString()} Movements`,
      sub: 'Ledger Audit History',
      color: [112, 26, 43]
    },
    {
      label: 'මුළු ලැබීම් / TOTAL RECEIVED (IN)',
      val: `+${totalIn.toLocaleString()} Units`,
      sub: 'Stock Replenishments',
      color: [16, 120, 60]
    },
    {
      label: 'මුළු නිකුත් කිරීම් / TOTAL ISSUED (OUT)',
      val: `-${totalOut.toLocaleString()} Units`,
      sub: 'Dispatches & Allocations',
      color: [225, 29, 72]
    },
    {
      label: 'ශුද්ධ තොග වෙනස / NET MOVEMENT',
      val: `${netChange >= 0 ? '+' : ''}${netChange.toLocaleString()} Units`,
      sub: `Movement Valuation: Rs. ${totalValue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: [37, 99, 235]
    }
  ];

  const context = initGovernmentReportPdf({
    titleSi: 'බඩුතොග ලෙජර වාර්තාව',
    titleEn: 'Stock Ledger Audit & Inventory Movements Report',
    reportRef: `LDG-RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    generatedBy,
    orientation,
    filterScopeStr,
    kpiCards,
  });

  const { doc, isLandscape, marginX, tableStartY } = context;

  const tableRows = entries.map((e, index) => {
    const dateStr = e.transaction_date
      ? new Date(e.transaction_date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: '2-digit' })
      : '—';
    const type = (e.transaction_type || 'adjustment').toUpperCase();
    const ref = e.reference_number || '—';
    const itemCode = e.item?.code || e.item?.item_code || '';
    const itemName = e.item?.name_si
      ? `${e.item.name_si} (${e.item.name_en || ''})`
      : (e.item?.name_en || 'Item');
    const itemFull = itemCode ? `[${itemCode}] ${itemName}` : itemName;
    const warehouse = e.warehouse?.name_si
      ? `${e.warehouse.name_si} (${e.warehouse.name_en})`
      : (e.warehouse?.name_en || 'Main Store');
    const inQty = Number(e.quantity_in || 0);
    const outQty = Number(e.quantity_out || 0);
    const balance = Number(e.balance || 0);
    const val = Number(e.total_value || 0);

    return [
      String(index + 1),
      dateStr,
      type,
      ref,
      itemFull,
      warehouse,
      inQty > 0 ? `+${inQty.toLocaleString()}` : '—',
      outQty > 0 ? `-${outQty.toLocaleString()}` : '—',
      balance.toLocaleString(),
      val.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    ];
  });

  const landscapeColStyles = {
    0: { halign: 'center' as const, cellWidth: 24 },
    1: { halign: 'center' as const, cellWidth: 55 },
    2: { halign: 'center' as const, cellWidth: 55 },
    3: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 70 },
    4: { cellWidth: 215 },
    5: { cellWidth: 80 },
    6: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 60 },
    7: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 60 },
    8: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 65 },
    9: { halign: 'right' as const, cellWidth: 80 }
  };

  const portraitColStyles = {
    0: { halign: 'center' as const, cellWidth: 20 },
    1: { halign: 'center' as const, cellWidth: 46 },
    2: { halign: 'center' as const, cellWidth: 46 },
    3: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 50 },
    4: { cellWidth: 120 },
    5: { cellWidth: 60 },
    6: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 40 },
    7: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 40 },
    8: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 45 },
    9: { halign: 'right' as const, cellWidth: 55 }
  };

  autoTable(doc, {
    head: [['#', 'දිනය\nDate', 'වර්ගය\nType', 'යොමු අංකය\nReference', 'අයිතමය\nItem Details', 'ගබඩාව\nWarehouse', 'ලැබීම් (+)\nIn Qty', 'නිකුත් (-)\nOut Qty', 'ශේෂය\nBalance', 'වටිනාකම (රු.)\nValue (Rs)']],
    body: tableRows.length > 0 ? tableRows : [['—', '—', '—', '—', 'ගනුදෙනු වාර්තා හමු නොවීය / No ledger entries match criteria.', '—', '—', '—', '0', '0.00']],
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
    didDrawCell: (data) => {
      // Color In Qty green and Out Qty red
      if (data.section === 'body') {
        if (data.column.index === 6 && data.cell.text[0]?.startsWith('+')) {
          doc.setTextColor(22, 101, 52);
        } else if (data.column.index === 7 && data.cell.text[0]?.startsWith('-')) {
          doc.setTextColor(185, 28, 28);
        }
      }
    }
  });

  return finishGovernmentReportPdf(context, 'බඩුතොග ලෙජර වාර්තාව / Stock Ledger Report', itemText);
}
