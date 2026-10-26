import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  initGovernmentReportPdf,
  finishGovernmentReportPdf,
  ReportKpiCard,
} from '@/lib/reports/report-pdf-base';

export interface LowStockItemForPdf {
  id: number;
  code?: string | null;
  item_code?: string | null;
  name_en: string;
  name_si?: string | null;
  current_quantity?: number | null;
  minimum_stock?: number | null;
  reorder_level?: number | null;
  maximum_stock?: number | null;
  purchase_price?: number | null;
  price?: number | null;
  category?: { id?: number; name_en?: string; name_si?: string } | null;
  unit?: { symbol?: string; name_en?: string } | null;
}

export interface LowStockReportPdfOptions {
  items: LowStockItemForPdf[];
  tab: 'low' | 'zero';
  generatedBy?: string;
  orientation?: 'landscape' | 'portrait';
}

export function generateLowStockPdf(options: LowStockReportPdfOptions): jsPDF {
  const {
    items,
    tab,
    generatedBy = 'Store Administration',
    orientation = 'landscape',
  } = options;

  const totalItems = items.length;
  let totalDeficit = 0;
  let zeroStockCount = 0;
  let lowStockCount = 0;

  items.forEach(item => {
    const qty = Number(item.current_quantity || 0);
    const threshold = Number(item.reorder_level || item.minimum_stock || 5);
    const max = Number(item.maximum_stock || threshold * 2);
    const deficit = Math.max(0, max - qty);
    totalDeficit += deficit;

    if (qty <= 0) zeroStockCount++;
    else lowStockCount++;
  });

  const scopeStr = tab === 'zero'
    ? 'වර්ගීකරණය / Category: ශුන්‍ය තොග අයිතම (Out of Stock Items Only)'
    : 'වර්ගීකරණය / Category: අවම තොග අනතුරු ඇඟවීම් (Low Stock / Reorder Threshold Items)';

  const kpiCards: ReportKpiCard[] = [
    {
      label: 'හදිසි ඇණවුම් අයිතම / ALERT ITEMS',
      val: `${totalItems.toLocaleString()} Items`,
      sub: tab === 'zero' ? 'Completely Out of Stock' : 'Below Reorder Threshold',
      color: [225, 29, 72]
    },
    {
      label: 'ශුන්‍ය තොග අයිතම / ZERO STOCK',
      val: `${zeroStockCount} Items`,
      sub: 'Zero Inventory in Store',
      color: [185, 28, 28]
    },
    {
      label: 'ඇස්තමේන්තු තොග හිඟය / REORDER DEFICIT',
      val: `${totalDeficit.toLocaleString()} Units`,
      sub: 'Required to Reach Optimal Stock',
      color: [217, 119, 6]
    },
    {
      label: 'ක්‍රියාමාර්ගය / AUDIT ACTION',
      val: 'Immediate Reorder Required',
      sub: 'Send to Procurement Division',
      color: [112, 26, 43]
    }
  ];

  const context = initGovernmentReportPdf({
    titleSi: 'අවම සහ ශුන්‍ය තොග අනතුරු ඇඟවීමේ වාර්තාව',
    titleEn: 'Low Stock & Critical Inventory Replenishment Alert Report',
    reportRef: `LOW-RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    generatedBy,
    orientation,
    filterScopeStr: scopeStr,
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
    const unit = item.unit?.symbol || item.unit?.name_en || 'ea';
    const qty = Number(item.current_quantity || 0);
    const min = Number(item.reorder_level || item.minimum_stock || 5);
    const max = Number(item.maximum_stock || min * 2);
    const deficit = Math.max(0, max - qty);
    const price = Number(item.purchase_price || item.price || 0);

    const urgency = qty <= 0 ? 'CRITICAL ZERO' : 'LOW STOCK';

    return [
      String(index + 1),
      code,
      name,
      cat,
      unit,
      qty.toLocaleString(),
      min.toLocaleString(),
      deficit.toLocaleString(),
      price.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      urgency
    ];
  });

  const landscapeColStyles = {
    0: { halign: 'center' as const, cellWidth: 24 },
    1: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 64 },
    2: { cellWidth: 225 },
    3: { cellWidth: 95 },
    4: { halign: 'center' as const, cellWidth: 40 },
    5: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 60 },
    6: { halign: 'right' as const, cellWidth: 60 },
    7: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 64 },
    8: { halign: 'right' as const, cellWidth: 75 },
    9: { halign: 'center' as const, cellWidth: 72 }
  };

  const portraitColStyles = {
    0: { halign: 'center' as const, cellWidth: 20 },
    1: { halign: 'center' as const, fontStyle: 'bold' as const, cellWidth: 50 },
    2: { cellWidth: 125 },
    3: { cellWidth: 65 },
    4: { halign: 'center' as const, cellWidth: 30 },
    5: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 40 },
    6: { halign: 'right' as const, cellWidth: 40 },
    7: { halign: 'right' as const, fontStyle: 'bold' as const, cellWidth: 45 },
    8: { halign: 'right' as const, cellWidth: 55 },
    9: { halign: 'center' as const, cellWidth: 50 }
  };

  autoTable(doc, {
    head: [['#', 'කේතය\nCode', 'අයිතම විස්තරය\nItem Description', 'ප්‍රවර්ගය\nCategory', 'ඒකකය\nUnit', 'වත්මන් තොගය\nCurrent Qty', 'නැවත ඇණවුම් මට්ටම\nReorder Level', 'හිඟ ප්‍රමාණය\nDeficit Qty', 'ඒකක මිල (රු.)\nUnit Price (Rs)', 'හදිසි තත්ත්වය\nUrgency']],
    body: tableRows.length > 0 ? tableRows : [['—', '—', 'අනතුරු ඇඟවීමේ තොග අයිතම නොමැත / No low stock items.', '—', '—', '0', '0', '0', '0.00', '—']],
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

        let bg = [254, 243, 199];
        let fg = [146, 64, 14];
        let border = [253, 230, 138];

        if (rawText === 'CRITICAL ZERO') {
          bg = [254, 226, 226];
          fg = [185, 28, 28];
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

  return finishGovernmentReportPdf(context, 'අවම තොග වාර්තාව / Low Stock Alert Report', tab === 'zero' ? 'ශුන්‍ය තොග / Zero Stock' : 'අවම තොග / Low Stock');
}
