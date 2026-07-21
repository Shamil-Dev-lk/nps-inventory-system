import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NotoSansSinhala } from './sinhala-font';

// ============================================================================
// EXPORT TO CSV (WITH BOM FOR UTF-8 SINHALA/TAMIL)
// ============================================================================
export const exportToCsv = (filename: string, data: object[]) => {
  if (!data || data.length === 0) {
    toast.error('No data available to export');
    return;
  }

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Format rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      let cell = (row as any)[header];
      if (cell === null || cell === undefined) cell = '';
      if (typeof cell === 'object') cell = JSON.stringify(cell);
      
      // Escape quotes and wrap in quotes to handle commas
      const cellString = String(cell).replace(/"/g, '""');
      return `"${cellString}"`;
    }).join(',');
  });

  // Combine headers and rows
  const csvString = [headers.join(','), ...csvRows].join('\n');
  
  // Add BOM for UTF-8 (Forces Excel to read UTF-8 properly for Sinhala/Tamil)
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Exported Successfully');
  }
};

// ============================================================================
// EXPORT TO EXCEL (XLSX)
// ============================================================================
export const exportToExcel = (filename: string, data: object[]) => {
  if (!data || data.length === 0) {
    toast.error('No data available to export');
    return;
  }

  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-size columns based on header length and content
    const colWidths: { wch: number }[] = [];
    const headers = Object.keys(data[0]);
    
    headers.forEach((header) => {
      let maxWidth = header.length;
      data.forEach(row => {
        const cellVal = String((row as any)[header] || '');
        if (cellVal.length > maxWidth) maxWidth = cellVal.length;
      });
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) }); // Cap width at 50 chars
    });
    ws['!cols'] = colWidths;

    // Inject Official Government Header Rows
    XLSX.utils.sheet_add_aoa(ws, [
      ['නිකවැරටිය ප්‍රාදේශීය සභාව'],
      ['NIKAWERATIYA PRADESHIYA SABHA'],
      ['Government Store Management System'],
      [''],
      [`Report: ${filename.toUpperCase()}`],
      [`Generated: ${new Date().toLocaleString()}`],
      ['']
    ], { origin: 'A1' });

    // We must shift the data down since we inserted rows
    const dataStartingRow = 8;
    const newWs = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_json(newWs, data, { origin: `A${dataStartingRow}` });
    
    // Copy cols and merged cells
    newWs['!cols'] = ws['!cols'];
    
    // Inject the header back into newWs
    XLSX.utils.sheet_add_aoa(newWs, [
      ['නිකවැරටිය ප්‍රාදේශීය සභාව'],
      ['NIKAWERATIYA PRADESHIYA SABHA'],
      ['Government Store Management System'],
      [''],
      [`Report: ${filename.toUpperCase()}`],
      [`Generated: ${new Date().toLocaleString()}`],
      ['']
    ], { origin: 'A1' });

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, newWs, "ExportData");

    // Write file
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel Exported Successfully');
  } catch (error) {
    console.error("Excel Export Error:", error);
    toast.error('Failed to generate Excel file');
  }
};

// ============================================================================
// EXPORT TO PDF
// ============================================================================
export const exportToPdf = (
  title: string, 
  data: object[], 
  columns?: { header: string, dataKey: string }[],
  orientation: 'portrait' | 'landscape' = 'portrait',
  orgName: string = 'Democratic Socialist Republic of Sri Lanka'
) => {
  if (!data || data.length === 0) {
    toast.error('No data available to export');
    return;
  }

    try {
    const doc = new jsPDF(orientation, 'pt', 'a4');
    
    // Add Sinhala Font Support
    doc.addFileToVFS('NotoSansSinhala.ttf', NotoSansSinhala);
    doc.addFont('NotoSansSinhala.ttf', 'NotoSansSinhala', 'normal');
    doc.setFont('NotoSansSinhala');
    
    // Auto-generate columns if not provided
    const tableCols = columns || Object.keys(data[0]).map(k => ({ header: k.toUpperCase().replace(/_/g, ' '), dataKey: k }));
    
    // Prepare rows
    const tableRows = data.map(row => {
      const formattedRow: any = {};
      tableCols.forEach(col => {
        formattedRow[col.dataKey] = String((row as any)[col.dataKey] || '');
      });
      return formattedRow;
    });

    // 1. Draw Government Logo (from public/logo.png)
    const img = new Image();
    img.src = '/logo.png';
    
    const renderPdf = async (logoImg?: HTMLImageElement) => {
      const pageWidth = doc.internal.pageSize.width;
      let startY = 40;

      // Draw Official Header Background (#c21f4c)
      doc.setFillColor(204, 0, 0);
      doc.rect(0, 0, pageWidth, 120, 'F');

      // Draw Logo if loaded
      if (logoImg) {
        const logoWidth = 45;
        const logoHeight = 45;
        const xPos = (pageWidth / 2) - (logoWidth / 2);
        doc.addImage(logoImg, 'PNG', xPos, 10, logoWidth, logoHeight);
      }

      // Draw Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Nikaweratiya Pradeshiya Sabha', pageWidth / 2, 75, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Government Store Management System', pageWidth / 2, 90, { align: 'center' });
      
      doc.setFontSize(8);
      doc.text(`Generated on: ${new Date().toLocaleString()} | Doc ID: ${Math.random().toString(36).substring(2, 8).toUpperCase()}`, pageWidth / 2, 105, { align: 'center' });

      // Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), pageWidth / 2, 145, { align: 'center' });

      startY = 160;

      // Draw Table
      autoTable(doc, {
        columns: tableCols,
        body: tableRows,
        startY: startY,
        styles: { fontSize: 8, cellPadding: 5, font: 'NotoSansSinhala' },
        headStyles: { fillColor: [204, 0, 0], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 40, right: 30, bottom: 60, left: 30 },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.internal.pages.length - 1;
          const pageHeight = doc.internal.pageSize.height;
          
          doc.setDrawColor(204, 0, 0);
          doc.setLineWidth(1);
          doc.line(30, pageHeight - 45, pageWidth - 30, pageHeight - 45);

          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.setFont('helvetica', 'normal');
          doc.text(
            'Nikaweratiya Pradeshiya Sabha | ANTIGRAVITY System',
            30,
            pageHeight - 30
          );
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            30,
            pageHeight - 20
          );
        }
      });

      doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Exported Successfully');
    };

    // Handle Image Load
    img.onload = () => renderPdf(img);
    img.onerror = () => renderPdf(); // Render without logo if missing

  } catch (error) {
    console.error("PDF Export Error:", error);
    toast.error('Failed to generate PDF file');
  }
};

// ============================================================================
// EXPORT TO JSON
// ============================================================================
export const exportToJson = (filename: string, data: object[]) => {
  if (!data || data.length === 0) {
    toast.error('No data available to export');
    return;
  }
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('JSON Exported Successfully');
};

// ============================================================================
// COPY TO CLIPBOARD
// ============================================================================
export const copyToClipboard = async (data: object[]) => {
  if (!data || data.length === 0) {
    toast.error('No data available to copy');
    return;
  }
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(jsonString);
    toast.success('Data copied to clipboard');
  } catch (error) {
    toast.error('Failed to copy to clipboard');
  }
};

