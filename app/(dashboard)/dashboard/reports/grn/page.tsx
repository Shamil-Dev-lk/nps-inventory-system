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
  Search,
  Building2,
  Truck,
  Coins,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import {
  generateGrnReportPdf,
  GrnRecordForPdf
} from '@/lib/reports/grn-report-pdf';

export default function GrnReportPage() {
  const { user } = useAuthStore();
  const [supplierId, setSupplierId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // PDF Preview & Print states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewOrientation, setPreviewOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isExporting, setIsExporting] = useState(false);
  const [exportAction, setExportAction] = useState<'download' | 'preview' | 'print' | 'csv' | null>(null);
  const [cachedExportGrns, setCachedExportGrns] = useState<GrnRecordForPdf[] | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-grn', page, supplierId, fromDate, toDate, status, search],
    queryFn: async () => {
      let query = supabase
        .from('grns')
        .select(`
          *,
          supplier:suppliers(id, company_name),
          warehouse:warehouses(id, name_en, name_si),
          items:grn_items(
            id,
            received_quantity,
            accepted_quantity,
            unit_price,
            total_price,
            item:items(id, name_en, name_si, code, unit:units(symbol, name_en))
          )
        `, { count: 'exact' });

      if (supplierId) query = query.eq('supplier_id', supplierId);
      if (status) query = query.eq('status', status);
      if (fromDate) query = query.gte('received_date', fromDate);
      if (toDate) query = query.lte('received_date', toDate);
      if (search.trim()) {
        query = query.or(`grn_number.ilike.%${search.trim()}%,invoice_number.ilike.%${search.trim()}%,remarks.ilike.%${search.trim()}%`);
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: rawGrns, error, count } = await query;
      if (error) throw error;

      const { data: allGrns, error: summaryErr } = await supabase.from('grns').select('total_amount, status');
      if (summaryErr) throw summaryErr;

      const totalGrns = allGrns?.length || 0;
      const totalValue = allGrns?.filter((g: any) => g.status === 'approved').reduce((sum: number, g: any) => sum + Number(g.total_amount || 0), 0) || 0;

      return {
        data: {
          data: (rawGrns || []) as unknown as GrnRecordForPdf[],
          total: count || 0,
          from: from + 1,
          to: Math.min(from + perPage, count || 0),
          last_page: Math.ceil((count || 0) / perPage),
        },
        summary: {
          total_grns: totalGrns,
          total_value: totalValue,
        }
      };
    },
    placeholderData: (prev) => prev,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('company_name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const grns = data?.data?.data || [];
  const meta = data?.data;
  const summary = data?.summary || { total_grns: 0, total_value: 0 };

  const selectedSupplier = suppliers?.find((s: any) => String(s.id) === String(supplierId));
  const supplierName = selectedSupplier?.company_name;

  const fetchAllMatchingGrns = async (): Promise<GrnRecordForPdf[]> => {
    let query = supabase
      .from('grns')
      .select(`
        *,
        supplier:suppliers(id, company_name),
        warehouse:warehouses(id, name_en, name_si),
        items:grn_items(
          id,
          received_quantity,
          accepted_quantity,
          unit_price,
          total_price,
          item:items(id, name_en, name_si, code, unit:units(symbol, name_en))
        )
      `)
      .order('created_at', { ascending: false });

    if (supplierId) query = query.eq('supplier_id', supplierId);
    if (status) query = query.eq('status', status);
    if (fromDate) query = query.gte('received_date', fromDate);
    if (toDate) query = query.lte('received_date', toDate);
    if (search.trim()) {
      query = query.or(`grn_number.ilike.%${search.trim()}%,invoice_number.ilike.%${search.trim()}%,remarks.ilike.%${search.trim()}%`);
    }

    const { data: allRecords, error } = await query;
    if (error) throw error;
    return (allRecords || []) as unknown as GrnRecordForPdf[];
  };

  const buildPdf = (records: GrnRecordForPdf[], orientation: 'landscape' | 'portrait') => {
    const generatedBy = user?.name || user?.email || 'Store Administration';
    return generateGrnReportPdf({
      grns: records,
      filters: {
        supplierName,
        status: status || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: search.trim() || undefined,
      },
      generatedBy,
      orientation,
    });
  };

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportAction('download');
    const toastId = toast.loading('Preparing high-resolution GRN PDF...');

    try {
      const records = cachedExportGrns || (await fetchAllMatchingGrns());
      setCachedExportGrns(records);

      if (records.length === 0) {
        toast.error('No GRN records match the selected filters.', { id: toastId });
        return;
      }

      const doc = buildPdf(records, previewOrientation);
      const todayStr = new Date().toISOString().slice(0, 10);
      doc.save(`NPS_GRN_Report_${todayStr}.pdf`);
      toast.success(`GRN Report downloaded successfully (${records.length} records)`, { id: toastId });
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
    const toastId = toast.loading('Rendering print-ready GRN preview...');

    try {
      const records = cachedExportGrns || (await fetchAllMatchingGrns());
      setCachedExportGrns(records);

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
      const records = cachedExportGrns || (await fetchAllMatchingGrns());
      setCachedExportGrns(records);

      if (records.length === 0) {
        toast.error('No GRN records found to print.', { id: toastId });
        return;
      }

      const doc = buildPdf(records, previewOrientation);
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
      toast.error(err.message || 'Failed to print GRN report.', { id: toastId });
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
    setCachedExportGrns(null);
  }, [supplierId, status, fromDate, toDate, search]);

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
      const records = cachedExportGrns || (await fetchAllMatchingGrns());
      setCachedExportGrns(records);

      if (!records || records.length === 0) {
        toast.error('No GRN records to export.', { id: toastId });
        return;
      }

      const headers = ['#', 'GRN Number', 'Received Date', 'Supplier', 'Invoice Number', 'Warehouse', 'Total Items', 'Total Value (Rs)', 'Status'];
      const rows = records.map((g: any, idx: number) => {
        const grnNo = g.grn_number || `GRN-${String(g.id).padStart(5, '0')}`;
        const dateStr = g.received_date || '';
        const supplier = g.supplier?.company_name || '—';
        const invoice = g.invoice_number || '—';
        const warehouse = g.warehouse?.name_en || 'Main Store';
        const itemsCount = g.items?.length || 0;
        const totalVal = Number(g.total_amount || 0);
        const st = g.status || 'draft';

        return [
          idx + 1,
          `"${grnNo}"`,
          `"${dateStr}"`,
          `"${supplier.replace(/"/g, '""')}"`,
          `"${invoice.replace(/"/g, '""')}"`,
          `"${warehouse.replace(/"/g, '""')}"`,
          itemsCount,
          totalVal.toFixed(2),
          `"${st}"`
        ];
      });

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const todayStr = new Date().toISOString().slice(0, 10);

      link.setAttribute('href', url);
      link.setAttribute('download', `NPS_GRN_Report_${todayStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${records.length} GRN records to CSV`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to export CSV.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  const hasActiveFilters = Boolean(supplierId || status || fromDate || toDate || search.trim());

  return (
    <div className="space-y-6 max-w-[1600px] pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#701a2b]">
            <Building2 size={14} /> Nikaweratiya Pradeshiya Sabha
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-0.5">
            Goods Received Notes (GRN) Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed procurement logs, supplier deliveries, and audit-ready received inventory documentation
          </p>
        </div>

        {/* Actions */}
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
            <span className="text-xs font-semibold uppercase tracking-wider">Total Deliveries</span>
            <Truck size={16} className="text-[#701a2b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {summary.total_grns}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">GRN vouchers</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Recorded supplier deliveries</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#701a2b]" />
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Value</span>
            <Coins size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Rs. {summary.total_value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Sanctioned procurements</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Suppliers</span>
            <Building2 size={16} className="text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {suppliers?.length || 0}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">registered</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Council approved vendors</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Filtered View</span>
            <FileCheck2 size={16} className="text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {meta?.total || grns.length}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">records</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Matching active filters</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by GRN no, invoice no, remarks..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <select
              value={supplierId}
              onChange={e => { setSupplierId(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            >
              <option value="">All Suppliers (සියලු සැපයුම්කරුවන්)</option>
              {suppliers?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.company_name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            >
              <option value="">All Statuses (සියලු තත්ත්ව)</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
              title="Received Date From"
            />
          </div>

          <div className="relative flex gap-2">
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
              title="Received Date To"
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
              {supplierName && (
                <span className="bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 px-2 py-0.5 rounded-full font-medium">
                  Supplier: {supplierName}
                </span>
              )}
              {status && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  Status: {status.toUpperCase()}
                </span>
              )}
              {fromDate && <span className="bg-muted px-2 py-0.5 rounded-full">From: {fromDate}</span>}
              {toDate && <span className="bg-muted px-2 py-0.5 rounded-full">To: {toDate}</span>}
              {search && <span className="bg-muted px-2 py-0.5 rounded-full font-mono">&ldquo;{search}&rdquo;</span>}
            </div>
            <button
              onClick={() => { setSupplierId(''); setStatus(''); setFromDate(''); setToDate(''); setSearch(''); setPage(1); }}
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
            <Truck size={16} className="text-[#701a2b]" />
            <span className="text-sm font-semibold">Goods Received Vouchers</span>
            <span className="text-xs bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 px-2.5 py-0.5 rounded-full font-bold">
              {meta?.total || 0} Total
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            {meta?.total ? (
              <span>Showing <strong>{meta.from}–{meta.to}</strong> of <strong>{meta.total}</strong> records</span>
            ) : (
              <span>No GRN records</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm data-table">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground border-b border-border uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">GRN No.</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4 text-right">Total Amount (Rs.)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-3.5 px-4">
                        <div className="h-4 bg-muted/60 animate-pulse rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : grns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={32} className="text-muted-foreground/60" />
                      <p className="font-medium text-foreground">No Goods Received Notes found</p>
                      <p className="text-xs max-w-sm">Adjust your date range or supplier filter to inspect historical vouchers.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                grns.map((g: any, idx: number) => {
                  const serial = (meta?.from || 1) + idx;
                  const grnNo = g.grn_number || `GRN-${String(g.id).padStart(5, '0')}`;
                  const total = Number(g.total_amount || 0);

                  return (
                    <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground font-mono">
                        {serial}
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-muted/80 text-foreground px-2 py-0.5 rounded font-mono font-medium border border-border">
                          {grnNo}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {g.received_date ? new Date(g.received_date).toLocaleDateString('en-LK') : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        {g.supplier?.company_name || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {g.warehouse?.name_en || 'Main Store'}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                        {g.invoice_number || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-right text-foreground font-mono">
                        Rs. {total.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                          g.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : g.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {g.status || 'draft'}
                        </span>
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
                      Document Preview — Goods Received Notes (GRN) Report
                    </h3>
                    <span className="text-[10px] bg-[#701a2b]/15 text-[#701a2b] dark:text-rose-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Official A4
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nikaweratiya Pradeshiya Sabha • Print-ready procurement audit record
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
                  title="GRN Report PDF Preview"
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
