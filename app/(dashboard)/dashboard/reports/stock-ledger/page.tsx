'use client';
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RefreshCw,
  Filter,
  FileText,
  Download,
  Printer,
  Eye,
  X,
  Loader2,
  Building2,
  Coins,
  History,
  ArrowDownRight,
  ArrowUpRight,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import {
  generateStockLedgerPdf,
  LedgerEntryForPdf
} from '@/lib/reports/stock-ledger-report-pdf';
import { GovernmentReportView } from '@/lib/reports/government-report-view';

export default function StockLedgerPage() {
  const { user } = useAuthStore();
  const [itemId, setItemId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // PDF Preview & Print states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewOrientation, setPreviewOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [previewMode, setPreviewMode] = useState<'form' | 'pdf'>('form');
  const [isExporting, setIsExporting] = useState(false);
  const [exportAction, setExportAction] = useState<'download' | 'preview' | 'print' | 'csv' | null>(null);
  const [cachedExportEntries, setCachedExportEntries] = useState<LedgerEntryForPdf[] | null>(null);
  const [activeExportEntries, setActiveExportEntries] = useState<LedgerEntryForPdf[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-stock-ledger', page, itemId, warehouseId, fromDate, toDate, transactionType],
    queryFn: async () => {
      let query = supabase
        .from('stock_ledger')
        .select('*, item:items(id, name_en, name_si, code), warehouse:warehouses(id, name_en, name_si)', { count: 'exact' });

      if (itemId) query = query.eq('item_id', itemId);
      if (warehouseId) query = query.eq('warehouse_id', warehouseId);
      if (transactionType) query = query.eq('transaction_type', transactionType);
      if (fromDate) query = query.gte('transaction_date', fromDate);
      if (toDate) query = query.lte('transaction_date', toDate);

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: rawEntries, error, count } = await query;
      if (error) throw error;

      return {
        data: {
          data: (rawEntries || []) as unknown as LedgerEntryForPdf[],
          total: count || 0,
          from: from + 1,
          to: Math.min(from + perPage, count || 0),
          last_page: Math.ceil((count || 0) / perPage),
        }
      };
    },
    placeholderData: (prev) => prev,
  });

  const { data: itemsList } = useQuery({
    queryKey: ['items-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select('id, code, name_en, name_si').order('name_en');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*').order('name_en');
      if (error) throw error;
      return data || [];
    },
  });

  const entries = data?.data?.data || [];
  const meta = data?.data;

  const selectedItem = itemsList?.find((i: any) => String(i.id) === String(itemId));
  const itemName = selectedItem ? (selectedItem.name_si ? `${selectedItem.name_si} (${selectedItem.name_en})` : selectedItem.name_en) : undefined;

  const selectedWarehouse = warehouses?.find((w: any) => String(w.id) === String(warehouseId));
  const warehouseName = selectedWarehouse ? (selectedWarehouse.name_si ? `${selectedWarehouse.name_si} (${selectedWarehouse.name_en})` : selectedWarehouse.name_en) : undefined;

  // On-screen summary metrics
  let totalIn = 0;
  let totalOut = 0;
  entries.forEach(e => {
    totalIn += Number(e.quantity_in || 0);
    totalOut += Number(e.quantity_out || 0);
  });

  const fetchAllMatchingEntries = async (): Promise<LedgerEntryForPdf[]> => {
    let query = supabase
      .from('stock_ledger')
      .select('*, item:items(id, name_en, name_si, code), warehouse:warehouses(id, name_en, name_si)')
      .order('created_at', { ascending: false });

    if (itemId) query = query.eq('item_id', itemId);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);
    if (transactionType) query = query.eq('transaction_type', transactionType);
    if (fromDate) query = query.gte('transaction_date', fromDate);
    if (toDate) query = query.lte('transaction_date', toDate);

    const { data: allRecords, error } = await query;
    if (error) throw error;
    return (allRecords || []) as unknown as LedgerEntryForPdf[];
  };

  const buildPdf = (records: LedgerEntryForPdf[], orientation: 'landscape' | 'portrait') => {
    const generatedBy = user?.name || user?.email || 'Store Administration';
    return generateStockLedgerPdf({
      entries: records,
      filters: {
        itemName,
        warehouseName,
        transactionType: transactionType || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      },
      generatedBy,
      orientation,
    });
  };

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportAction('download');
    const toastId = toast.loading('Preparing high-resolution Stock Ledger PDF...');

    try {
      const records = cachedExportEntries || (await fetchAllMatchingEntries());
      setCachedExportEntries(records);

      if (records.length === 0) {
        toast.error('No stock movements match the selected filters.', { id: toastId });
        return;
      }

      const doc = buildPdf(records, previewOrientation);
      const todayStr = new Date().toISOString().slice(0, 10);
      doc.save(`NPS_Stock_Ledger_${todayStr}.pdf`);
      toast.success(`Stock Ledger downloaded successfully (${records.length} records)`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to download PDF.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  const handlePreviewPdf = async (targetOrientation?: 'landscape' | 'portrait') => {
    const orientation = targetOrientation || previewOrientation;
    if (targetOrientation && targetOrientation !== previewOrientation) {
      setPreviewOrientation(targetOrientation);
    }

    setIsExporting(true);
    setExportAction('preview');
    const toastId = toast.loading('Rendering print-ready Ledger preview...');

    try {
      const records = cachedExportEntries || (await fetchAllMatchingEntries());
      setCachedExportEntries(records);
      setActiveExportEntries(records);

      const doc = buildPdf(records, orientation);
      const blob = doc.output('blob');

      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }

      const newBlobUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(newBlobUrl);
      setPreviewModalOpen(true);
      toast.success('Document preview ready', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to open preview.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  const handlePrintReport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportAction('print');
    const toastId = toast.loading('Preparing print-ready document...');

    try {
      const records = cachedExportEntries || (await fetchAllMatchingEntries());
      setCachedExportEntries(records);
      setActiveExportEntries(records);

      if (records.length === 0) {
        toast.error('No ledger entries found to print.', { id: toastId });
        return;
      }

      toast.success('Opening print dialog...', { id: toastId });
      setTimeout(() => {
        window.print();
      }, 300);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to print ledger.', { id: toastId });
      window.print();
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
    setCachedExportEntries(null);
  }, [itemId, warehouseId, fromDate, toDate, transactionType]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  const handleExportCsv = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportAction('csv');
    const toastId = toast.loading('Exporting CSV data...');

    try {
      const records = cachedExportEntries || (await fetchAllMatchingEntries());
      setCachedExportEntries(records);

      if (!records || records.length === 0) {
        toast.error('No ledger records to export.', { id: toastId });
        return;
      }

      const headers = ['#', 'Date', 'Type', 'Reference', 'Item Code', 'Item Name', 'Warehouse', 'In Qty', 'Out Qty', 'Balance', 'Value (Rs)'];
      const rows = records.map((r: any, idx: number) => {
        const dateStr = r.transaction_date || '';
        const type = r.transaction_type || '';
        const ref = r.reference_number || '';
        const code = r.item?.code || '';
        const name = r.item?.name_si ? `${r.item.name_si} (${r.item.name_en})` : (r.item?.name_en || '');
        const wh = r.warehouse?.name_en || 'Main Store';
        const inQ = r.quantity_in || 0;
        const outQ = r.quantity_out || 0;
        const bal = r.balance || 0;
        const val = Number(r.total_value || 0).toFixed(2);

        return [
          idx + 1,
          `"${dateStr}"`,
          `"${type}"`,
          `"${ref.replace(/"/g, '""')}"`,
          `"${code}"`,
          `"${name.replace(/"/g, '""')}"`,
          `"${wh.replace(/"/g, '""')}"`,
          inQ,
          outQ,
          bal,
          val
        ];
      });

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const todayStr = new Date().toISOString().slice(0, 10);

      link.setAttribute('href', url);
      link.setAttribute('download', `NPS_Stock_Ledger_${todayStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${records.length} ledger entries to CSV`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to export CSV.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  const hasActiveFilters = Boolean(itemId || warehouseId || fromDate || toDate || transactionType);

  return (
    <div className="space-y-6 max-w-[1600px] pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#701a2b]">
            <Building2 size={14} /> Nikaweratiya Pradeshiya Sabha
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-0.5">
            Stock Ledger & Movement History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete bin-card tracking, chronological transaction audit logs, and stock movement reports
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handlePreviewPdf()}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#701a2b]/30 bg-card hover:bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            title="Inspect formatted A4 document before printing"
          >
            {isExporting && exportAction === 'preview' ? (
              <Loader2 size={16} className="animate-spin text-[#701a2b]" />
            ) : (
              <Eye size={16} className="text-[#701a2b] dark:text-rose-300" />
            )}
            <span>Preview PDF</span>
            <span className="hidden sm:inline-block text-[10px] bg-[#701a2b]/15 text-[#701a2b] dark:text-rose-200 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
              A4
            </span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#701a2b] to-[#8d2238] hover:from-[#5d1624] hover:to-[#701a2b] text-white text-sm font-semibold transition-all shadow-md disabled:opacity-50"
            title="Download official Stock Ledger PDF (A4)"
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
            disabled={isExporting}
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
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground text-sm font-medium hover:bg-muted transition-all shadow-sm disabled:opacity-50"
            title="Export raw data as spreadsheet CSV"
          >
            {isExporting && exportAction === 'csv' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 print:hidden">
        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Movements</span>
            <History size={16} className="text-[#701a2b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {meta?.total || entries.length}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">entries</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Recorded stock ledger rows</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#701a2b]" />
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Replenished (In)</span>
            <ArrowDownRight size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground text-emerald-600">
              +{totalIn.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">units</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Current view incoming stock</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Dispatched (Out)</span>
            <ArrowUpRight size={16} className="text-rose-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground text-rose-600">
              -{totalOut.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">units</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Current view outgoing stock</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600" />
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Movement</span>
            <Coins size={16} className="text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalIn - totalOut >= 0 ? '+' : ''}{(totalIn - totalOut).toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">net units</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Net store movement</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <select
              value={itemId}
              onChange={e => { setItemId(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            >
              <option value="">All Items (සියලු අයිතම)</option>
              {itemsList?.map((i: any) => (
                <option key={i.id} value={i.id}>
                  {i.code ? `[${i.code}] ` : ''}{i.name_si ? `${i.name_si} (${i.name_en})` : i.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={warehouseId}
              onChange={e => { setWarehouseId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            >
              <option value="">All Warehouses (සියලු ගබඩා)</option>
              {warehouses?.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name_en}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={transactionType}
              onChange={e => { setTransactionType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            >
              <option value="">All Types (සියලු වර්ග)</option>
              <option value="grn">GRN (ලැබීම්)</option>
              <option value="issue">Issue (නිකුත් කිරීම්)</option>
              <option value="return">Return (ආපසු ලැබීම්)</option>
              <option value="adjustment">Adjustment (ගැලපුම්)</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
              title="Transaction Date From"
            />
          </div>

          <div className="relative flex gap-2">
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
              title="Transaction Date To"
            />
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors flex-shrink-0"
              title="Refresh Report Data"
            >
              <RefreshCw size={15} className={`text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
              <span className="font-semibold text-foreground">Filtered Scope:</span>
              {itemName && (
                <span className="bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 px-2 py-0.5 rounded-full font-medium">
                  {itemName}
                </span>
              )}
              {warehouseName && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {warehouseName}
                </span>
              )}
              {transactionType && (
                <span className="bg-muted px-2 py-0.5 rounded-full uppercase font-medium">
                  Type: {transactionType}
                </span>
              )}
              {fromDate && <span className="bg-muted px-2 py-0.5 rounded-full">From: {fromDate}</span>}
              {toDate && <span className="bg-muted px-2 py-0.5 rounded-full">To: {toDate}</span>}
            </div>
            <button
              onClick={() => { setItemId(''); setWarehouseId(''); setTransactionType(''); setFromDate(''); setToDate(''); setPage(1); }}
              className="text-[#701a2b] dark:text-rose-400 hover:underline font-medium text-xs ml-auto"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[#701a2b]" />
            <span className="text-sm font-semibold">Stock Ledger Entries</span>
            <span className="text-xs bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 px-2.5 py-0.5 rounded-full font-bold">
              {meta?.total || 0} Total
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            {meta?.total ? (
              <span>Showing <strong>{meta.from}–{meta.to}</strong> of <strong>{meta.total}</strong> records</span>
            ) : (
              <span>No ledger records</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm data-table">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground border-b border-border uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Item Details (අයිතමය)</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4 text-right">In Qty</th>
                <th className="py-3 px-4 text-right">Out Qty</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-right">Value (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="py-3.5 px-4">
                        <div className="h-4 bg-muted/60 animate-pulse rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={32} className="text-muted-foreground/60" />
                      <p className="font-medium text-foreground">No stock ledger history found</p>
                      <p className="text-xs max-w-sm">Adjust your item, transaction type, or date range.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((e: any, idx: number) => {
                  const serial = (meta?.from || 1) + idx;
                  const inQ = Number(e.quantity_in || 0);
                  const outQ = Number(e.quantity_out || 0);
                  const bal = Number(e.balance || 0);
                  const val = Number(e.total_value || 0);

                  return (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground font-mono">
                        {serial}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {e.transaction_date ? new Date(e.transaction_date).toLocaleDateString('en-LK') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded uppercase font-mono bg-muted text-foreground border border-border">
                          {e.transaction_type || 'adj'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono font-medium text-foreground">
                        {e.reference_number || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        <div>{e.item?.name_en || '—'}</div>
                        {e.item?.name_si && <div className="text-xs text-muted-foreground font-normal">{e.item.name_si}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {e.warehouse?.name_en || 'Main Store'}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-right text-emerald-600 font-mono">
                        {inQ > 0 ? `+${inQ.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-right text-rose-600 font-mono">
                        {outQ > 0 ? `-${outQ.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-right text-foreground font-mono">
                        {bal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-xs text-right text-muted-foreground font-mono">
                        Rs. {val.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && Boolean(meta && meta.last_page > 1) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-border bg-muted/10 print:hidden">
            <p className="text-xs text-muted-foreground">
              Showing <strong className="text-foreground">{meta?.from || 0}</strong> to <strong className="text-foreground">{meta?.to || 0}</strong> of <strong className="text-foreground">{meta?.total || 0}</strong> records
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 transition-colors font-medium"
              >
                Previous
              </button>
              <div className="px-3 py-1 text-xs font-semibold bg-[#701a2b] text-white rounded-lg">
                Page {page} of {meta?.last_page || 1}
              </div>
              <button
                onClick={() => setPage(p => Math.min(meta?.last_page || 1, p + 1))}
                disabled={page === (meta?.last_page || 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
                      Document Preview — Official Government Stock Ledger Register
                    </h3>
                    <span className="text-[10px] bg-[#701a2b]/15 text-[#701a2b] dark:text-rose-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      FORM GENERAL 139
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    නිකවැරටිය ප්‍රාදේශීය සභාව • Nikaweratiya Pradeshiya Sabha Official Audit Document
                  </p>
                </div>
              </div>

              {/* Toolbar Controls in Modal */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Switcher: Government Form vs PDF File */}
                <div className="flex items-center bg-muted rounded-xl p-1 border border-border text-xs">
                  <button
                    onClick={() => setPreviewMode('form')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      previewMode === 'form'
                        ? 'bg-[#701a2b] text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    රාජ්‍ය ආකෘතිය (Form View)
                  </button>
                  <button
                    onClick={() => setPreviewMode('pdf')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      previewMode === 'pdf'
                        ? 'bg-[#701a2b] text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    PDF ගොනුව (PDF File)
                  </button>
                </div>

                {/* Orientation Switcher */}
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
                  title="Print this official government document directly"
                >
                  <Printer size={14} />
                  මුද්‍රණය (Print)
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#701a2b] hover:bg-[#581522] text-white text-xs font-semibold transition-all shadow-sm"
                  title="Download Official PDF"
                >
                  <Download size={14} />
                  බාගන්න (Download PDF)
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

            {/* Modal Body */}
            <div className="flex-1 bg-slate-900/40 overflow-y-auto p-4 sm:p-6 relative">
              {previewMode === 'form' ? (
                <GovernmentReportView
                  titleEn="Stock Ledger Audit & Inventory Movements Register"
                  titleSi="බඩුතොග ලෙජර වාර්තාව සහ චලන ලේඛනය"
                  formCode="ආකෘති පත්‍රය: පොදු 139 (බඩුතොග ලෙජරය) • FORM GENERAL 139 (STOCK LEDGER)"
                  subtitleEn="Stores & Inventory Management Division • Government Store System"
                  subtitleSi="ගබඩා සහ බඩුතොග කළමනාකරණ අංශය"
                  reportRef={`NPS-LDG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`}
                  generatedBy={user?.email || 'Store Administration'}
                  orientation={previewOrientation}
                  filterScopeStr={`[ අයිතමය / Item: ${itemName || 'All Items'} ] • [ ගබඩාව / Warehouse: ${warehouseName || 'All Warehouses'} ] • [ වර්ගය / Type: ${transactionType ? transactionType.toUpperCase() : 'ALL'} ] • [ කාලසීමාව / Period: ${fromDate || 'Start'} to ${toDate || 'End'} ]`}
                  summaryMetrics={[
                    {
                      label: 'මුළු ගනුදෙනු වාර / TOTAL ENTRIES',
                      val: `${(activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).length.toLocaleString()} Movements`,
                      sub: 'Ledger Audit History'
                    },
                    {
                      label: 'මුළු ලැබීම් / TOTAL RECEIVED (IN)',
                      val: `+${(activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).reduce((acc, curr) => acc + Number(curr.quantity_in || 0), 0).toLocaleString()} Units`,
                      sub: 'Stock Replenishments'
                    },
                    {
                      label: 'මුළු නිකුත් කිරීම් / TOTAL ISSUED (OUT)',
                      val: `-${(activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).reduce((acc, curr) => acc + Number(curr.quantity_out || 0), 0).toLocaleString()} Units`,
                      sub: 'Dispatches & Allocations'
                    },
                    {
                      label: 'ශුද්ධ තොග වෙනස / NET MOVEMENT',
                      val: `${((activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).reduce((acc, curr) => acc + Number(curr.quantity_in || 0) - Number(curr.quantity_out || 0), 0) >= 0 ? '+' : '')}${(activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).reduce((acc, curr) => acc + Number(curr.quantity_in || 0) - Number(curr.quantity_out || 0), 0).toLocaleString()} Units`,
                      sub: 'Net Stock Variation'
                    }
                  ]}
                  tableHeaders={['#', 'දිනය\nDate', 'වර්ගය\nType', 'යොමු අංකය\nReference', 'අයිතමය සහ විස්තරය\nItem Details (Sinhala & English)', 'ගබඩාව\nWarehouse', 'ලැබීම් (+)\nIn Qty', 'නිකුත් (-)\nOut Qty', 'ශේෂය\nBalance', 'වටිනාකම (රු.)\nValue (Rs)']}
                  columnAlignments={['center', 'center', 'center', 'center', 'left', 'left', 'right', 'right', 'right', 'right']}
                  columnWidths={['3%', '8%', '7%', '10%', '27%', '10%', '8%', '8%', '9%', '10%']}
                  tableRows={(activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).map((e, index) => {
                    const dateStr = e.transaction_date
                      ? new Date(e.transaction_date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: '2-digit' })
                      : '—';
                    const type = (e.transaction_type || 'adjustment').toUpperCase();
                    const ref = e.reference_number || '—';
                    const itemCode = e.item?.code || e.item?.item_code || '';
                    const itemName = e.item?.name_si
                      ? `${e.item.name_si} (${e.item.name_en || ''})`
                      : (e.item?.name_en || 'Item');
                    const warehouse = e.warehouse?.name_si
                      ? `${e.warehouse.name_si} (${e.warehouse.name_en})`
                      : (e.warehouse?.name_en || 'Main Store');
                    const inQty = Number(e.quantity_in || 0);
                    const outQty = Number(e.quantity_out || 0);
                    const balance = Number(e.balance || 0);
                    const val = Number(e.total_value || 0);

                    return [
                      <span key="idx" className="font-mono font-semibold text-slate-500">{index + 1}</span>,
                      <span key="date" className="whitespace-nowrap">{dateStr}</span>,
                      <span
                        key="type"
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          type === 'IN' || type === 'GRN'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : type === 'OUT' || type === 'ISSUE'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {type}
                      </span>,
                      <span key="ref" className="font-mono font-bold text-[#701a2b]">{ref}</span>,
                      <div key="item">
                        {itemCode && <span className="font-mono text-slate-500 text-[10px]">[{itemCode}] </span>}
                        <span className="font-medium text-slate-900">{itemName}</span>
                      </div>,
                      <span key="wh">{warehouse}</span>,
                      <span key="in" className="font-mono font-bold text-emerald-700 text-right block">{inQty > 0 ? `+${inQty.toLocaleString()}` : '—'}</span>,
                      <span key="out" className="font-mono font-bold text-rose-700 text-right block">{outQty > 0 ? `-${outQty.toLocaleString()}` : '—'}</span>,
                      <span key="bal" className="font-mono font-bold text-slate-900 text-right block">{balance.toLocaleString()}</span>,
                      <span key="val" className="font-mono text-slate-700 text-right block">{val.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    ];
                  })}
                />
              ) : previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  title="Stock Ledger Report PDF Preview"
                  className="w-full h-full rounded-xl border border-border shadow-md bg-white min-h-[600px]"
                />
              ) : (
                <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-3">
                  <Loader2 size={36} className="animate-spin text-[#701a2b]" />
                  <p className="text-sm font-semibold text-muted-foreground">Rendering print-ready PDF...</p>
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
              <span>රාජ්‍ය විගණනය සහ ගබඩා ලේඛනාගාර කටයුතු සඳහා සූදානම් නිල වාර්තාව • Ready for official filing & external audits</span>
              <span className="font-mono text-[11px]">Format: A4 ({previewOrientation === 'landscape' ? '297 x 210 mm' : '210 x 297 mm'}) • High Definition Government Standard</span>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED NATIVE PRINT VIEW (Visible only during window.print) */}
      <div className="hidden print:block">
        <GovernmentReportView
          titleEn="Stock Ledger Audit & Inventory Movements Register"
          titleSi="බඩුතොග ලෙජර වාර්තාව සහ චලන ලේඛනය"
          formCode="ආකෘති පත්‍රය: පොදු 139 (බඩුතොග ලෙජරය) • FORM GENERAL 139 (STOCK LEDGER)"
          subtitleEn="Stores & Inventory Management Division • Government Store System"
          subtitleSi="ගබඩා සහ බඩුතොග කළමනාකරණ අංශය"
          reportRef={`NPS-LDG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`}
          generatedBy={user?.email || 'Store Administration'}
          orientation={previewOrientation}
          filterScopeStr={`[ අයිතමය / Item: ${itemName || 'All Items'} ] • [ ගබඩාව / Warehouse: ${warehouseName || 'All Warehouses'} ] • [ වර්ගය / Type: ${transactionType ? transactionType.toUpperCase() : 'ALL'} ] • [ කාලසීමාව / Period: ${fromDate || 'Start'} to ${toDate || 'End'} ]`}
          summaryMetrics={[
            {
              label: 'මුළු ගනුදෙනු වාර / TOTAL ENTRIES',
              val: `${(activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).length.toLocaleString()} Movements`,
              sub: 'Ledger Audit History'
            },
            {
              label: 'මුළු ලැබීම් / TOTAL RECEIVED (IN)',
              val: `+${(activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).reduce((acc, curr) => acc + Number(curr.quantity_in || 0), 0).toLocaleString()} Units`,
              sub: 'Stock Replenishments'
            },
            {
              label: 'මුළු නිකුත් කිරීම් / TOTAL ISSUED (OUT)',
              val: `-${(activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).reduce((acc, curr) => acc + Number(curr.quantity_out || 0), 0).toLocaleString()} Units`,
              sub: 'Dispatches & Allocations'
            },
            {
              label: 'ශුද්ධ තොග වෙනස / NET MOVEMENT',
              val: `${((activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).reduce((acc, curr) => acc + Number(curr.quantity_in || 0) - Number(curr.quantity_out || 0), 0) >= 0 ? '+' : '')}${(activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).reduce((acc, curr) => acc + Number(curr.quantity_in || 0) - Number(curr.quantity_out || 0), 0).toLocaleString()} Units`,
              sub: 'Net Stock Variation'
            }
          ]}
          tableHeaders={['#', 'දිනය\nDate', 'වර්ගය\nType', 'යොමු අංකය\nReference', 'අයිතමය සහ විස්තරය\nItem Details (Sinhala & English)', 'ගබඩාව\nWarehouse', 'ලැබීම් (+)\nIn Qty', 'නිකුත් (-)\nOut Qty', 'ශේෂය\nBalance', 'වටිනාකම (රු.)\nValue (Rs)']}
          columnAlignments={['center', 'center', 'center', 'center', 'left', 'left', 'right', 'right', 'right', 'right']}
          columnWidths={['3%', '8%', '7%', '10%', '27%', '10%', '8%', '8%', '9%', '10%']}
          tableRows={(activeExportEntries.length > 0 ? activeExportEntries : (cachedExportEntries || entries)).map((e, index) => {
            const dateStr = e.transaction_date
              ? new Date(e.transaction_date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: '2-digit' })
              : '—';
            const type = (e.transaction_type || 'adjustment').toUpperCase();
            const ref = e.reference_number || '—';
            const itemCode = e.item?.code || e.item?.item_code || '';
            const itemName = e.item?.name_si
              ? `${e.item.name_si} (${e.item.name_en || ''})`
              : (e.item?.name_en || 'Item');
            const warehouse = e.warehouse?.name_si
              ? `${e.warehouse.name_si} (${e.warehouse.name_en})`
              : (e.warehouse?.name_en || 'Main Store');
            const inQty = Number(e.quantity_in || 0);
            const outQty = Number(e.quantity_out || 0);
            const balance = Number(e.balance || 0);
            const val = Number(e.total_value || 0);

            return [
              <span key="idx" className="font-mono font-semibold text-slate-500">{index + 1}</span>,
              <span key="date" className="whitespace-nowrap">{dateStr}</span>,
              <span
                key="type"
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                  type === 'IN' || type === 'GRN'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : type === 'OUT' || type === 'ISSUE'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                {type}
              </span>,
              <span key="ref" className="font-mono font-bold text-[#701a2b]">{ref}</span>,
              <div key="item">
                {itemCode && <span className="font-mono text-slate-500 text-[10px]">[{itemCode}] </span>}
                <span className="font-medium text-slate-900">{itemName}</span>
              </div>,
              <span key="wh">{warehouse}</span>,
              <span key="in" className="font-mono font-bold text-emerald-700 text-right block">{inQty > 0 ? `+${inQty.toLocaleString()}` : '—'}</span>,
              <span key="out" className="font-mono font-bold text-rose-700 text-right block">{outQty > 0 ? `-${outQty.toLocaleString()}` : '—'}</span>,
              <span key="bal" className="font-mono font-bold text-slate-900 text-right block">{balance.toLocaleString()}</span>,
              <span key="val" className="font-mono text-slate-700 text-right block">{val.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            ];
          })}
        />
      </div>

      {/* DEDICATED PRINT STYLING FOR BROWSER PRINT (Ctrl+P / window.print) */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
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
          body * {
            visibility: hidden;
          }
          .government-document,
          .government-document * {
            visibility: visible;
          }
          .government-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
