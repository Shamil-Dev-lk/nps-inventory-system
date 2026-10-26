import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  initGovernmentReportPdf,
  finishGovernmentReportPdf,
  ReportKpiCard,
} from '@/lib/reports/report-pdf-base';

export interface StockItemForPdf {
  id: number;
  code?: string | null;
  item_code?: string | null;
  name_en: string;
  name_si?: string | null;
  description?: string | null;
  current_quantity?: number | null;
  stock_quantity?: number | null;
  purchase_price?: number | null;
  price?: number | null;
  average_cost?: number | null;
  minimum_stock?: number | null;
  reorder_level?: number | null;
  maximum_stock?: number | null;
  category?: { id: number; name_en: string; name_si?: string } | null;
  warehouse?: { id: number; name_en: string; name_si?: string } | null;
  unit?: { symbol?: string; name_en?: string; name_si?: string } | null;
}

export interface StockReportPdfOptions {
  items: StockItemForPdf[];
  filters: {
    categoryName?: string;
    warehouseName?: string;
    status?: string;
    search?: string;
  };
  generatedBy?: string;
  orientation?: 'landscape' | 'portrait';
}

export function generateCurrentStockPdf(options: StockReportPdfOptions): jsPDF {
  const {
    items,
    filters,
    generatedBy = 'Store Administration',
    orientation = 'landscape',
  } = options;

  const totalItems = items.length;
  let totalStockQty = 0;
  let totalValuation = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  items.forEach(item => {
    const qty = Number(item.current_quantity || item.stock_quantity || 0);
    const unitPrice = Number(item.purchase_price || item.price || item.average_cost || 0);
    const threshold = Number(item.reorder_level || item.minimum_stock || 5);

    totalStockQty += qty;
    totalValuation += qty * unitPrice;

    if (qty <= 0) outOfStockCount++;
    else if (qty <= threshold) lowStockCount++;
  });

  const categoryText = filters.categoryName || 'සියලු ප්‍රවර්ග / All Categories';
  const warehouseText = filters.warehouseName || 'සියලු ගබඩා / All Warehouses';
  const statusText = filters.status ? filters.status.toUpperCase() : 'සියලු තත්ත්ව / ALL';
  const searchText = filters.search ? `"${filters.search}"` : 'None';

  const filterScopeStr = `[ Category: ${categoryText} ]   •   [ Warehouse: ${warehouseText} ]   •   [ Status: ${statusText} ]   •   [ Search: ${searchText} ]`;

  const kpiCards: ReportKpiCard[] = [
    {
      label: 'මුළු අයිතම ගණන / TOTAL ITEMS',
      val: `${totalItems.toLocaleString()} Items`,
      sub: 'Catalogue Items',
      color: [112, 26, 43]
    },
    {
      label: 'මුළු තොග වටිනාකම / TOTAL VALUE',
      val: `Rs. ${totalValuation.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${totalStockQty.toLocaleString()} Total Units`,
      color: [16, 120, 60]
    },
    {
      label: 'අවම තොග අනතුරු ඇඟවීම් / LOW STOCK',
      val: `${lowStockCount} Items`,
      sub: 'At / Below Reorder Threshold',
      color: [217, 119, 6]
    },
    {
      label: 'ශුන්‍ය තොග / OUT OF STOCK',
      val: `${outOfStockCount} Items`,
      sub: 'Immediate Reorder Required',
      color: [225, 29, 72]
    }
  ];

  const context = initGovernmentReportPdf({
    titleSi: 'වත්මන් බඩුතොග වාර්තාව',
    titleEn: 'Current Inventory Levels & Valuation Report',
    reportRef: `STK-RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    generatedBy,
    orientation,
    filterScopeStr,
    kpiCards,
  });

  const { doc, isLandscape, marginX, tableStartY } = context;

  const tableRows = items.map((item, index) => {
    const code = item.code || item.item_code || `ITM-${String(item.id).padStart(4, '0')}`;
    const name = item.name_si
      ? `${item.name_si} (${item.name_en})`
      : item.name_en;
    const cat = item.category?.name_si
      ? `${item.category.name_si} (${item.category.name_en})`
      : (item.category?.name_en || '—');
    const wh = item.warehouse?.name_si
      ? `${item.warehouse.name_si} (${item.warehouse.name_en})`
      : (item.warehouse?.name_en || 'Main Store');
    const unit = item.unit?.symbol || item.unit?.name_en || 'ea';
    const qty = Number(item.current_quantity || item.stock_quantity || 0);
    const unitPrice = Number(item.purchase_price || item.price || item.average_cost || 0);
    const totalVal = qty * unitPrice;
    const threshold = Number(item.reorder_level || item.minimum_stock || 5);

    let healthStatus = 'IN STOCK';
    if (qty <= 0) healthStatus = 'OUT OF STOCK';
    else if (qty <= threshold) healthStatus = 'LOW STOCK';

    return [
      String(index + 1),
      code,
      name,
      cat,
      wh,
      unit,
      qty.toLocaleString(),
      unitPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalVal.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      healthStatus
    ];
  });

  const landscapeColStyles = {
    0: { halign: 'center' as const, cellWidth: 24 },
    1: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 62 },
    2: { cellWidth: 215 },
    3: { cellWidth: 95 },
    4: { cellWidth: 80 },
    5: { halign: 'center' as const, cellWidth: 40 },
    6: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 55 },
    7: { halign: 'right' as const, cellWidth: 70 },
    8: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 84 },
    9: { halign: 'center' as const, cellWidth: 60 }
  };

  const portraitColStyles = {
    0: { halign: 'center' as const, cellWidth: 20 },
    1: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 50 },
    2: { cellWidth: 120 },
    3: { cellWidth: 65 },
    4: { cellWidth: 55 },
    5: { halign: 'center' as const, cellWidth: 30 },
    6: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 40 },
    7: { halign: 'right' as const, cellWidth: 48 },
    8: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 61 },
    9: { halign: 'center' as const, cellWidth: 50 }
  };

  autoTable(doc, {
    head: [['#', 'කේතය\nCode', 'අයිතම විස්තරය\nItem Name & Details', 'ප්‍රවර්ගය\nCategory', 'ගබඩාව\nWarehouse', 'ඒකකය\nUnit', 'තොගය\nStock Qty', 'ඒකක අගය (රු.)\nUnit Cost (Rs)', 'මුළු අගය (රු.)\nTotal Value (Rs)', 'තත්ත්වය\nStatus']],
    body: tableRows.length > 0 ? tableRows : [['—', '—', 'තොරතුරු හමු නොවීය / No inventory items found.', '—', '—', '—', '0', '0.00', '0.00', '—']],
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
        let label = 'IN STOCK / ප්‍රමාණවත්';

        if (rawText === 'LOW STOCK') {
          bg = [254, 252, 232];
          fg = [133, 77, 14];
          border = [254, 240, 138];
          label = 'LOW / අවම තොග';
        } else if (rawText === 'OUT OF STOCK') {
          bg = [254, 242, 242];
          fg = [153, 27, 27];
          border = [254, 202, 202];
          label = 'OUT / ශුන්‍ය තොග';
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

  return finishGovernmentReportPdf(context, 'වත්මන් බඩුතොග වාර්තාව / Current Stock Report', categoryText);
}
