'use client';
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  XCircle,
  Download,
  RefreshCw,
  Printer,
  Eye,
  X,
  Loader2,
  FileText,
  Building2,
  Package,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import {
  generateLowStockPdf,
  LowStockItemForPdf
} from '@/lib/reports/low-stock-report-pdf';

export default function LowStockPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'low' | 'zero'>('low');

  // PDF Preview & Print states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewOrientation, setPreviewOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isExporting, setIsExporting] = useState(false);
  const [exportAction, setExportAction] = useState<'download' | 'preview' | 'print' | 'csv' | null>(null);

  const { data: lowData, isLoading: lowLoading, refetch: refetchLow } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, category:categories(id, name_en, name_si), unit:units(id, symbol, name_en)');
      if (error) throw error;
      const filtered = (data || []).filter((item: any) => {
        const qty = Number(item.current_quantity || 0);
        const threshold = Number(item.reorder_level || item.minimum_stock || 5);
        return qty > 0 && qty <= threshold;
      });
      return {
        data: { data: filtered as unknown as LowStockItemForPdf[] },
        count: filtered.length,
      };
    },
  });

  const { data: zeroData, isLoading: zeroLoading, refetch: refetchZero } = useQuery({
    queryKey: ['zero-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, category:categories(id, name_en, name_si), unit:units(id, symbol, name_en)');
      if (error) throw error;
      const filtered = (data || []).filter((item: any) => Number(item.current_quantity || 0) <= 0);
      return {
        data: { data: filtered as unknown as LowStockItemForPdf[] },
        count: filtered.length,
      };
    },
  });

  const items = tab === 'low' ? (lowData?.data?.data || []) : (zeroData?.data?.data || []);
  const count = tab === 'low' ? (lowData?.count || 0) : (zeroData?.count || 0);
  const isLoading = tab === 'low' ? lowLoading : zeroLoading;

  const buildPdf = (targetItems: LowStockItemForPdf[], orientation: 'landscape' | 'portrait') => {
    const generatedBy = user?.name || user?.email || 'Store Administration';
    return generateLowStockPdf({
      items: targetItems,
      tab,
      generatedBy,
      orientation,
    });
  };

  const handleDownloadPdf = () => {
    if (isExporting || items.length === 0) return;
    setIsExporting(true);
    setExportAction('download');
    const toastId = toast.loading('Preparing Low Stock Alert PDF...');

    try {
      const doc = buildPdf(items, previewOrientation);
      const todayStr = new Date().toISOString().slice(0, 10);
      doc.save(`NPS_Stock_Alerts_${tab}_${todayStr}.pdf`);
      toast.success(`Official alert PDF downloaded (${items.length} items)`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to download PDF.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  const handlePreviewPdf = (targetOrientation?: 'landscape' | 'portrait') => {
    if (items.length === 0) {
      toast.error('No items to preview.');
      return;
    }
    const orientation = targetOrientation || previewOrientation;
    if (targetOrientation && targetOrientation !== previewOrientation) {
      setPreviewOrientation(targetOrientation);
    }

    setIsExporting(true);
    setExportAction('preview');
    const toastId = toast.loading('Rendering print-ready alert preview...');

    try {
      const doc = buildPdf(items, orientation);
      const blob = doc.output('blob');

      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }

      const newBlobUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(newBlobUrl);
      setPreviewModalOpen(true);
      toast.success('Alert document preview ready', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to open preview.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  const handlePrintReport = () => {
    if (isExporting || items.length === 0) return;
    setIsExporting(true);
    setExportAction('print');
    const toastId = toast.loading('Preparing print-ready alert document...');

    try {
      const doc = buildPdf(items, previewOrientation);
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;

      document.body.appendChild(iframe);
      iframe.onload = () => {
        toast.success('Opening print dialog...', { id: toastId });
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      };
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to print alert report.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  const handleExportCSV = () => {
    if (!items || items.length === 0) return;
    const headers = ['#', 'Code', 'Item Name (EN)', 'Item Name (SI)', 'Category', 'Current Stock', 'Min Stock', 'Reorder Level', 'Deficit Qty', 'Unit'];
    const rows = items.map((item: any, idx: number) => {
      const code = item.code || item.item_code || `ITM-${String(item.id).padStart(4, '0')}`;
      const qty = Number(item.current_quantity || 0);
      const min = Number(item.reorder_level || item.minimum_stock || 5);
      const max = Number(item.maximum_stock || min * 2);
      const deficit = Math.max(0, max - qty);

      return [
        idx + 1,
        `"${code}"`,
        `"${item.name_en.replace(/"/g, '""')}"`,
        `"${(item.name_si || '').replace(/"/g, '""')}"`,
        `"${(item.category?.name_en || '—').replace(/"/g, '""')}"`,
        qty,
        item.minimum_stock || 0,
        min,
        deficit,
        `"${item.unit?.symbol || item.unit?.name_en || '—'}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const todayStr = new Date().toISOString().slice(0, 10);

    link.setAttribute('href', url);
    link.setAttribute('download', `NPS_${tab}_stock_alert_${todayStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${items.length} items to CSV`);
  };

  return (
    <div className="space-y-6 max-w-[1600px] pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#701a2b]">
            <Building2 size={14} /> Nikaweratiya Pradeshiya Sabha
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-0.5">
            Stock Replenishment Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Critical low stock and out-of-stock items requiring urgent procurement intervention
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handlePreviewPdf()}
            disabled={isExporting || items.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#701a2b]/30 bg-card hover:bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            title="Inspect formatted A4 document before printing"
          >
            {isExporting && exportAction === 'preview' ? (
              <Loader2 size={16} className="animate-spin text-[#701a2b]" />
            ) : (
              <Eye size={16} className="text-[#701a2b] dark:text-rose-300" />
            )}
            <span>Preview Alert PDF</span>
            <span className="hidden sm:inline-block text-[10px] bg-[#701a2b]/15 text-[#701a2b] dark:text-rose-200 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
              A4
            </span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting || items.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#701a2b] to-[#8d2238] hover:from-[#5d1624] hover:to-[#701a2b] text-white text-sm font-semibold transition-all shadow-md disabled:opacity-50"
            title="Download official PDF report (A4)"
          >
            {isExporting && exportAction === 'download' ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <Download size={16} />
            )}
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrintReport}
            disabled={isExporting || items.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-all shadow-sm disabled:opacity-50"
            title="Print report directly with high-resolution vector layout"
          >
            {isExporting && exportAction === 'print' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Printer size={16} />
            )}
            <span>Print</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting || items.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground text-sm font-medium hover:bg-muted transition-all shadow-sm disabled:opacity-50"
            title="Export raw data as spreadsheet CSV"
          >
            <FileText size={16} />
            <span>CSV</span>
          </button>

          <button
            onClick={() => { refetchLow(); refetchZero(); }}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors flex-shrink-0"
            title="Refresh alerts"
          >
            <RefreshCw size={16} className={`text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
        <div
          onClick={() => setTab('low')}
          className={`cursor-pointer rounded-2xl p-4.5 border transition-all relative overflow-hidden flex items-center justify-between ${
            tab === 'low'
              ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20 shadow-md'
              : 'bg-card border-border hover:border-border/80 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Low Stock Threshold Alerts (අවම තොග)
              </div>
              <div className="text-3xl font-bold tracking-tight text-foreground mt-0.5">
                {lowData?.count || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Items at or below reorder limit
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
            {tab === 'low' ? 'Active Tab' : 'View Items'} <ArrowRight size={14} />
          </div>
        </div>

        <div
          onClick={() => setTab('zero')}
          className={`cursor-pointer rounded-2xl p-4.5 border transition-all relative overflow-hidden flex items-center justify-between ${
            tab === 'zero'
              ? 'bg-rose-500/10 border-rose-500/40 ring-2 ring-rose-500/20 shadow-md'
              : 'bg-card border-border hover:border-border/80 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
              <XCircle size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Out of Stock Critical Items (ශුන්‍ය තොග)
              </div>
              <div className="text-3xl font-bold tracking-tight text-foreground mt-0.5">
                {zeroData?.count || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Inventory depleted — zero balance in store
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold text-rose-600 flex items-center gap-1">
            {tab === 'zero' ? 'Active Tab' : 'View Items'} <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-[#701a2b]" />
            <span className="text-sm font-semibold">
              {tab === 'low' ? 'Items Requiring Reorder (අවම තොග)' : 'Critical Depleted Stock (ශුන්‍ය තොග)'}
            </span>
            <span className="text-xs bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 px-2.5 py-0.5 rounded-full font-bold">
              {count} Items
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm data-table">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground border-b border-border uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Item Name (විස්තරය)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-right">Reorder Level</th>
                <th className="py-3 px-4 text-right">Deficit</th>
                <th className="py-3 px-4 text-center">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-3.5 px-4">
                        <div className="h-4 bg-muted/60 animate-pulse rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-muted-foreground">
                    <p className="font-medium text-foreground">No items currently at alert status</p>
                    <p className="text-xs">All store inventory levels are currently above reorder thresholds.</p>
                  </td>
                </tr>
              ) : (
                items.map((item: any, idx: number) => {
                  const code = item.code || item.item_code || `ITM-${String(item.id).padStart(4, '0')}`;
                  const qty = Number(item.current_quantity || 0);
                  const min = Number(item.reorder_level || item.minimum_stock || 5);
                  const max = Number(item.maximum_stock || min * 2);
                  const deficit = Math.max(0, max - qty);

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-muted/80 text-foreground px-2 py-0.5 rounded font-mono font-medium border border-border">
                          {code}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        <div>{item.name_en}</div>
                        {item.name_si && <div className="text-xs text-muted-foreground font-normal">{item.name_si}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {item.category?.name_en || '—'}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground font-mono">
                        {item.unit?.symbol || item.unit?.name_en || 'ea'}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-right font-mono">
                        <span className={qty <= 0 ? 'text-rose-600' : 'text-amber-600'}>
                          {qty.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-right text-muted-foreground font-mono">
                        {min.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-right text-foreground font-mono">
                        +{deficit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                          qty <= 0
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {qty <= 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF PREVIEW MODAL */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 print:hidden">
          <div className="bg-card w-full max-w-6xl h-[92vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#701a2b] text-white flex items-center justify-center shadow-sm">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-foreground">
                      Document Preview — Stock Replenishment Alert Report
                    </h3>
                    <span className="text-[10px] bg-[#701a2b]/15 text-[#701a2b] dark:text-rose-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Official A4
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nikaweratiya Pradeshiya Sabha • Print-ready urgent procurement schedule
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted rounded-xl p-1 border border-border text-xs">
                  <button
                    onClick={() => handlePreviewPdf('landscape')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      previewOrientation === 'landscape'
                        ? 'bg-[#701a2b] text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => handlePreviewPdf('portrait')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      previewOrientation === 'portrait'
                        ? 'bg-[#701a2b] text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Portrait
                  </button>
                </div>

                <button
                  onClick={handlePrintReport}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-all shadow-sm"
                  title="Print this document directly"
                >
                  <Printer size={14} />
                  Print
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#701a2b] hover:bg-[#581522] text-white text-xs font-semibold transition-all shadow-sm"
                  title="Download PDF"
                >
                  <Download size={14} />
                  Download
                </button>

                <button
                  onClick={handleClosePreviewModal}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
                  title="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-zinc-950/20 p-3 sm:p-4 overflow-hidden relative">
              {previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  title="Low Stock Report PDF Preview"
                  className="w-full h-full rounded-xl border border-border shadow-md bg-white"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <Loader2 size={36} className="animate-spin text-[#701a2b]" />
                  <p className="text-sm font-semibold text-muted-foreground">Rendering print-ready PDF...</p>
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
              <span>Ready for official filing, institutional record keeping & external audits</span>
              <span className="font-mono text-[11px]">Format: A4 (297 x 210 mm) • 300 DPI Vector Output</span>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 9pt !important;
          }
          nav,
          aside,
          header,
          .print\\:hidden,
          button,
          input,
          select {
            display: none !important;
          }
          .data-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .data-table thead {
            display: table-header-group !important;
          }
          .data-table tr {
            page-break-inside: avoid !important;
          }
          .data-table th,
          .data-table td {
            border: 0.5pt solid #cbd5e1 !important;
            padding: 4pt 6pt !important;
          }
        }
      `}</style>
    </div>
  );
}
