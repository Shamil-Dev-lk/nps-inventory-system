'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Search, Download, Filter, Package, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CurrentStockPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-current-stock', page, search, categoryId, warehouseId],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select('*, category:categories(id, name_en), warehouse:warehouses(id, name_en), unit:units(id, short_name)', { count: 'exact' });

      if (search) query = query.or(`name_en.ilike.%${search}%,item_code.ilike.%${search}%`);
      if (categoryId) query = query.eq('category_id', categoryId);
      if (warehouseId) query = query.eq('warehouse_id', warehouseId);

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: rawItems, error, count } = await query;
      if (error) throw error;

      const { data: allItems, error: summaryError } = await supabase.from('items').select('current_quantity, average_cost, reorder_level');
      if (summaryError) throw summaryError;

      const totalItems = allItems?.length || 0;
      const totalValue = allItems?.reduce((sum: number, item: any) => sum + (Number(item.current_quantity || 0) * Number(item.average_cost || 0)), 0) || 0;
      const lowStockCount = allItems?.filter((item: any) => (item.current_quantity || 0) <= (item.reorder_level || 0) && (item.current_quantity || 0) > 0).length || 0;
      const outOfStockCount = allItems?.filter((item: any) => (item.current_quantity || 0) <= 0).length || 0;

      return {
        data: {
          data: rawItems || [],
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
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const items = data?.data?.data || [];
  const meta = data?.data;
  const summary = data?.summary || { total_items: 0, total_value: 0, low_stock_count: 0, out_of_stock_count: 0 };

  const handleExport = (format: 'pdf' | 'csv') => {
    if (format === 'pdf') {
      window.print();
    } else {
      if (!items || items.length === 0) return;
      const headers = ['Item Code', 'Item Name', 'Category', 'Stock Qty', 'Unit Value', 'Total Value'];
      const rows = items.map((row: any) => [
        row.item_code,
        row.name_en,
        row.category?.name_en || '-',
        row.stock_quantity || 0,
        row.unit_price || 0,
        (row.stock_quantity || 0) * (row.unit_price || 0)
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "current_stock_report.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Current Stock Report</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time inventory levels and valuation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-all">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-all">
            <FileText size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-muted-foreground mb-2"><Package size={18} /><span className="text-sm font-semibold uppercase tracking-wider">Total Items</span></div>
          <p className="text-3xl font-bold">{summary.total_items}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-green-600 mb-2"><CheckCircle size={18} /><span className="text-sm font-semibold uppercase tracking-wider">Stock Value</span></div>
          <p className="text-3xl font-bold text-green-700">Rs. {Number(summary.total_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card border border-warning/30 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-warning mb-2"><AlertTriangle size={18} /><span className="text-sm font-semibold uppercase tracking-wider">Low Stock</span></div>
          <p className="text-3xl font-bold text-warning">{summary.low_stock_count}</p>
        </div>
        <div className="bg-card border border-danger/30 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-danger mb-2"><AlertTriangle size={18} /><span className="text-sm font-semibold uppercase tracking-wider">Out of Stock</span></div>
          <p className="text-3xl font-bold text-danger">{summary.out_of_stock_count}</p>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex flex-wrap md:flex-nowrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input type="search" placeholder="Search item code or name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="relative w-full md:w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Categories</option>
            {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
        </div>
        <div className="relative w-full md:w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Warehouses</option>
            {warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name_en}</option>)}
          </select>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border hover:bg-muted"><RefreshCw size={15} className="text-muted-foreground" /></button>
      </div>

      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Warehouse</th>
                <th className="text-right">Qty</th>
                <th>Unit</th>
                <th className="text-right">Avg Cost</th>
                <th className="text-right">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length: 8}).map((_, i) => (
                <tr key={i}>{Array.from({length: 8}).map((_, j) => <td key={j}><div className="shimmer h-4 rounded w-full max-w-[100px]" /></td>)}</tr>
              )) : items.map((item: any) => (
                <tr key={item.id}>
                  <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{item.item_code}</code></td>
                  <td className="text-sm font-medium">{item.name_en}</td>
                  <td className="text-sm text-muted-foreground">{item.category?.name_en || '—'}</td>
                  <td className="text-sm text-muted-foreground">{item.warehouse?.name_en || '—'}</td>
                  <td className="text-right">
                    <span className={`font-semibold ${item.current_quantity <= 0 ? 'text-danger' : item.current_quantity <= item.reorder_level ? 'text-warning' : 'text-success'}`}>
                      {Number(item.current_quantity)}
                    </span>
                  </td>
                  <td className="text-sm text-muted-foreground">{item.unit?.short_name || '—'}</td>
                  <td className="text-sm text-right">Rs. {Number(item.average_cost).toFixed(2)}</td>
                  <td className="text-sm font-semibold text-right text-foreground">Rs. {(Number(item.current_quantity) * Number(item.average_cost)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && items.length === 0 && <div className="text-center py-16 text-muted-foreground">No stock data found</div>}

        {!isLoading && meta?.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {meta.from}–{meta.to} of {meta.total} items</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40">Prev</button>
              <span className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">{page}</span>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}