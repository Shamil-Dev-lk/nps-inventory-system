'use client';
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RefreshCw,
  Search,
  Download,
  Filter,
  Package,
  AlertTriangle,
  FileText,
  Printer,
  Eye,
  X,
  Loader2,
  Building2,
  Coins,
  AlertCircle,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import {
  generateCurrentStockPdf,
  StockItemForPdf
} from '@/lib/reports/stock-report-pdf';

export default function CurrentStockPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // PDF Preview & Print states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewOrientation, setPreviewOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isExporting, setIsExporting] = useState(false);
  const [exportAction, setExportAction] = useState<'download' | 'preview' | 'print' | 'csv' | null>(null);
  const [cachedExportItems, setCachedExportItems] = useState<StockItemForPdf[] | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-current-stock', page, search, categoryId, warehouseId],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select('*, category:categories(id, name_en, name_si), warehouse:warehouses(id, name_en, name_si), unit:units(id, symbol, name_en)', { count: 'exact' });

      if (search.trim()) {
        const term = search.trim();
        query = query.or(`name_en.ilike.%${term}%,name_si.ilike.%${term}%,code.ilike.%${term}%`);
      }
      if (categoryId) query = query.eq('category_id', categoryId);
      if (warehouseId) query = query.eq('warehouse_id', warehouseId);

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: rawItems, error, count } = await query;
      if (error) throw error;

      const { data: allItems, error: summaryError } = await supabase
        .from('items')
        .select('current_quantity, average_cost, reorder_level, minimum_stock, purchase_price, price');
      if (summaryError) throw summaryError;

      const totalItems = allItems?.length || 0;
      const totalValue = allItems?.reduce((sum: number, item: any) => sum + (Number(item.current_quantity || 0) * Number(item.purchase_price || item.price || item.average_cost || 0)), 0) || 0;
      const lowStockCount = allItems?.filter((item: any) => {
        const q = Number(item.current_quantity || 0);
        const t = Number(item.reorder_level || item.minimum_stock || 5);
        return q > 0 && q <= t;
      }).length || 0;
      const outOfStockCount = allItems?.filter((item: any) => Number(item.current_quantity || 0) <= 0).length || 0;

      return {
        data: {
          data: (rawItems || []) as unknown as StockItemForPdf[],
          total: count || 0,
          from: from + 1,
          to: Math.min(from + perPage, count || 0),
          last_page: Math.ceil((count || 0) / perPage),
        },
        summary: {
          total_items: totalItems,
          total_value: totalValue,
          low_stock_count: lowStockCount,
          out_of_stock_count: outOfStockCount,
        }
      };
    },
    placeholderData: (prev) => prev,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name_en');
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

  const items = data?.data?.data || [];
  const meta = data?.data;
  const summary = data?.summary || { total_items: 0, total_value: 0, low_stock_count: 0, out_of_stock_count: 0 };

  const selectedCategory = categories?.find((c: any) => String(c.id) === String(categoryId));
  const categoryName = selectedCategory ? (selectedCategory.name_si ? `${selectedCategory.name_si} (${selectedCategory.name_en})` : selectedCategory.name_en) : undefined;

  const selectedWarehouse = warehouses?.find((w: any) => String(w.id) === String(warehouseId));
  const warehouseName = selectedWarehouse ? (selectedWarehouse.name_si ? `${selectedWarehouse.name_si} (${selectedWarehouse.name_en})` : selectedWarehouse.name_en) : undefined;

  // Fetch all matching items for export
  const fetchAllMatchingItems = async (): Promise<StockItemForPdf[]> => {
    let query = supabase
      .from('items')
      .select('*, category:categories(id, name_en, name_si), warehouse:warehouses(id, name_en, name_si), unit:units(id, symbol, name_en)')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      const term = search.trim();
      query = query.or(`name_en.ilike.%${term}%,name_si.ilike.%${term}%,code.ilike.%${term}%`);
    }
    if (categoryId) query = query.eq('category_id', categoryId);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);

    const { data: allRecords, error } = await query;
    if (error) throw error;
    return (allRecords || []) as unknown as StockItemForPdf[];
  };

  const buildPdf = (records: StockItemForPdf[], orientation: 'landscape' | 'portrait') => {
    const generatedBy = user?.name || user?.email || 'Store Administration';
    return generateCurrentStockPdf({
      items: records,
      filters: {
        categoryName,
        warehouseName,
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
    const toastId = toast.loading('Preparing high-resolution PDF document...');

    try {
      const records = cachedExportItems || (await fetchAllMatchingItems());
      setCachedExportItems(records);

      if (records.length === 0) {
        toast.error('No inventory items match the selected criteria.', { id: toastId });
        return;
      }

      const doc = buildPdf(records, previewOrientation);
      const todayStr = new Date().toISOString().slice(0, 10);
      doc.save(`NPS_Current_Stock_Report_${todayStr}.pdf`);
      toast.success(`Official stock PDF downloaded (${records.length} items)`, { id: toastId });
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
    const toastId = toast.loading('Rendering print-ready preview...');

    try {
      const records = cachedExportItems || (await fetchAllMatchingItems());
      setCachedExportItems(records);

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
      const records = cachedExportItems || (await fetchAllMatchingItems());
      setCachedExportItems(records);

      if (records.length === 0) {
        toast.error('No items found to print.', { id: toastId });
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
      toast.error(err.message || 'Failed to print.', { id: toastId });
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
    setCachedExportItems(null);
  }, [search, categoryId, warehouseId]);

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
      const records = cachedExportItems || (await fetchAllMatchingItems());
      setCachedExportItems(records);

      if (!records || records.length === 0) {
        toast.error('No items to export.', { id: toastId });
        return;
      }

      const headers = ['#', 'Code', 'Item Name', 'Category', 'Warehouse', 'Unit', 'Stock Qty', 'Unit Cost (Rs)', 'Total Value (Rs)', 'Status'];
      const rows = records.map((r: any, idx: number) => {
        const code = r.code || r.item_code || `ITM-${String(r.id).padStart(4, '0')}`;
        const name = r.name_si ? `${r.name_si} (${r.name_en})` : r.name_en;
        const cat = r.category?.name_en || '—';
        const wh = r.warehouse?.name_en || 'Main Store';
        const unit = r.unit?.symbol || r.unit?.name_en || 'ea';
        const qty = Number(r.current_quantity || r.stock_quantity || 0);
        const unitPrice = Number(r.purchase_price || r.price || r.average_cost || 0);
        const totalVal = qty * unitPrice;
        const threshold = Number(r.reorder_level || r.minimum_stock || 5);
        let st = 'IN STOCK';
        if (qty <= 0) st = 'OUT OF STOCK';
        else if (qty <= threshold) st = 'LOW STOCK';

        return [
          idx + 1,
          `"${code}"`,
          `"${name.replace(/"/g, '""')}"`,
          `"${cat.replace(/"/g, '""')}"`,
          `"${wh.replace(/"/g, '""')}"`,
          `"${unit}"`,
          qty,
          unitPrice.toFixed(2),
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
      link.setAttribute('download', `NPS_Current_Stock_Report_${todayStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${records.length} items to CSV`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to export CSV.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  const hasActiveFilters = Boolean(search.trim() || categoryId || warehouseId);

  return (
    <div className="space-y-6 max-w-[1600px] pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#701a2b]">
            <Building2 size={14} /> Nikaweratiya Pradeshiya Sabha
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-0.5">
            Current Stock Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time inventory levels, store valuations, and audit-ready stock status
          </p>
        </div>

        {/* Action Controls Toolbar */}
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
            <span className="text-xs font-semibold uppercase tracking-wider">Total Items</span>
            <Package size={16} className="text-[#701a2b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {summary.total_items}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">catalogue items</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">All inventory lines</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#701a2b]" />
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Value</span>
            <Coins size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Rs. {summary.total_value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Estimated valuation</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {summary.low_stock_count}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">alerts</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">At or below reorder limit</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Out of Stock</span>
            <XCircle size={16} className="text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {summary.out_of_stock_count}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">critical</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Immediate procurement needed</div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by code, English name, or Sinhala name..."
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
              value={categoryId}
              onChange={e => { setCategoryId(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            >
              <option value="">All Categories (සියලු ප්‍රවර්ග)</option>
              {categories?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name_si ? `${c.name_si} (${c.name_en})` : c.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex gap-2">
            <select
              value={warehouseId}
              onChange={e => { setWarehouseId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            >
              <option value="">All Warehouses (සියලු ගබඩා)</option>
              {warehouses?.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name_si ? `${w.name_si} (${w.name_en})` : w.name_en}
                </option>
              ))}
            </select>
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
              <span className="font-semibold text-foreground">Active Filter:</span>
              {categoryName && (
                <span className="bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 px-2 py-0.5 rounded-full font-medium">
                  {categoryName}
                </span>
              )}
              {warehouseName && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {warehouseName}
                </span>
              )}
              {search && (
                <span className="bg-muted px-2 py-0.5 rounded-full font-mono">
                  &ldquo;{search}&rdquo;
                </span>
              )}
            </div>
            <button
              onClick={() => { setSearch(''); setCategoryId(''); setWarehouseId(''); setPage(1); }}
              className="text-[#701a2b] dark:text-rose-400 hover:underline font-medium text-xs ml-auto"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#701a2b]" />
            <span className="text-sm font-semibold">Inventory Catalogue Items</span>
            <span className="text-xs bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 px-2.5 py-0.5 rounded-full font-bold">
              {meta?.total || 0} Total
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            {meta?.total ? (
              <span>Showing <strong>{meta.from}–{meta.to}</strong> of <strong>{meta.total}</strong> records</span>
            ) : (
              <span>No items found</span>
            )}
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
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Stock Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">Status</th>
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
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={32} className="text-muted-foreground/60" />
                      <p className="font-medium text-foreground">No stock data found</p>
                      <p className="text-xs max-w-sm">Try adjusting your category, warehouse, or keyword search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item: any, idx: number) => {
                  const serial = (meta?.from || 1) + idx;
                  const code = item.code || item.item_code || `ITM-${String(item.id).padStart(4, '0')}`;
                  const qty = Number(item.current_quantity || item.stock_quantity || 0);
                  const price = Number(item.purchase_price || item.price || item.average_cost || 0);
                  const val = qty * price;
                  const threshold = Number(item.reorder_level || item.minimum_stock || 5);

                  let statusText = 'In Stock';
                  let statusBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
                  if (qty <= 0) {
                    statusText = 'Out of Stock';
                    statusBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
                  } else if (qty <= threshold) {
                    statusText = 'Low Stock';
                    statusBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
                  }

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground font-mono">
                        {serial}
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
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {item.warehouse?.name_en || 'Main Store'}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground font-mono">
                        {item.unit?.symbol || item.unit?.name_en || 'ea'}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-right text-foreground font-mono">
                        {qty.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-xs text-right text-muted-foreground font-mono">
                        Rs. {price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-right text-foreground font-mono">
                        Rs. {val.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${statusBadge}`}>
                          {statusText}
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
                      Document Preview — Current Stock Inventory Report
                    </h3>
                    <span className="text-[10px] bg-[#701a2b]/15 text-[#701a2b] dark:text-rose-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Official A4
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nikaweratiya Pradeshiya Sabha • Print-ready vector audit record
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
                  title="Current Stock Report PDF Preview"
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
