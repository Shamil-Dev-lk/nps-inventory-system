'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Filter, FileText, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StockLedgerPage() {
  const [itemId, setItemId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-stock-ledger', page, itemId, warehouseId, fromDate, toDate, transactionType],
    queryFn: async () => {
      let query = supabase
        .from('stock_ledger')
        .select('*, item:items(id, name_en, item_code), warehouse:warehouses(id, name_en)', { count: 'exact' });

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
          data: rawEntries || [],
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
      const { data, error } = await supabase.from('items').select('id, item_code, name_en');
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

  const entries = data?.data?.data || [];
  const meta = data?.data;

  const handleExport = (format: 'pdf' | 'csv') => {
    if (format === 'pdf') {
      window.print();
    } else {
      if (!ledgerData || ledgerData.length === 0) return;
      const headers = ['Date', 'Type', 'Reference', 'In Qty', 'Out Qty', 'Balance', 'Unit Price', 'Total Value'];
      const rows = ledgerData.map((row: any) => [
        row.date,
        row.type,
        row.reference,
        row.in_quantity || 0,
        row.out_quantity || 0,
        row.balance_quantity || 0,
        row.unit_price || 0,
        row.total_value || 0
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "stock_ledger_report.csv");
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
          <h1 className="text-2xl font-bold">Stock Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed history of all stock movements</p>
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

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex flex-wrap md:flex-nowrap gap-3">
        <div className="relative flex-1 md:w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <select value={itemId} onChange={e => { setItemId(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Items</option>
            {itemsList?.map((i: any) => <option key={i.id} value={i.id}>{i.item_code} - {i.name_en}</option>)}
          </select>
        </div>
        <div className="relative flex-1 md:w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Warehouses</option>
            {warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name_en}</option>)}
          </select>
        </div>
        <div className="relative flex-1 md:w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <select value={transactionType} onChange={e => { setTransactionType(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Types</option>
            <option value="IN">Stock IN</option>
            <option value="OUT">Stock OUT</option>
          </select>
        </div>
        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="w-full md:w-auto px-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="From Date" />
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="w-full md:w-auto px-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="To Date" />
        
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border hover:bg-muted"><RefreshCw size={15} className="text-muted-foreground" /></button>
      </div>

      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Document No</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Balance</th>
                <th>Warehouse</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length: 8}).map((_, i) => (
                <tr key={i}>{Array.from({length: 8}).map((_, j) => <td key={j}><div className="shimmer h-4 rounded w-full max-w-[100px]" /></td>)}</tr>
              )) : entries.map((entry: any) => (
                <tr key={entry.id}>
                  <td className="text-sm font-medium whitespace-nowrap">{new Date(entry.transaction_date).toLocaleString('en-LK')}</td>
                  <td className="text-sm">{entry.item?.name_en || '—'}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${entry.transaction_type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {entry.transaction_type}
                    </span>
                  </td>
                  <td className="text-sm"><code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{entry.document_type} - {entry.document_id}</code></td>
                  <td className={`text-right font-bold ${entry.transaction_type === 'IN' ? 'text-success' : 'text-danger'}`}>
                    {entry.transaction_type === 'IN' ? '+' : '-'}{Number(entry.quantity || 0)}
                  </td>
                  <td className="text-right font-semibold">{Number(entry.balance_quantity || 0)}</td>
                  <td className="text-sm text-muted-foreground">{entry.warehouse?.name_en || '—'}</td>
                  <td className="text-sm text-muted-foreground truncate max-w-[200px]">{entry.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && entries.length === 0 && <div className="text-center py-16 text-muted-foreground">No ledger entries found</div>}

        {!isLoading && meta?.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {meta.from}–{meta.to} of {meta.total} entries</p>
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