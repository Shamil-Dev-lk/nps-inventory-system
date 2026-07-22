'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Filter, FileText, Download, TrendingUp, FileCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GrnReportPage() {
  const [supplierId, setSupplierId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-grn', page, supplierId, fromDate, toDate, status],
    queryFn: async () => {
      let query = supabase
        .from('grn')
        .select('*, supplier:suppliers(id, name, company_name), warehouse:warehouses(id, name_en), received_by:users(id, name)', { count: 'exact' });

      if (supplierId) query = query.eq('supplier_id', supplierId);
      if (status) query = query.eq('status', status);
      if (fromDate) query = query.gte('received_date', fromDate);
      if (toDate) query = query.lte('received_date', toDate);

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: rawGrns, error, count } = await query;
      if (error) throw error;

      const { data: allGrns, error: summaryErr } = await supabase.from('grn').select('total_amount, status');
      if (summaryErr) throw summaryErr;

      const totalGrns = allGrns?.length || 0;
      const totalValue = allGrns?.filter((g: any) => g.status === 'approved').reduce((sum: number, g: any) => sum + Number(g.total_amount || 0), 0) || 0;

      return {
        data: {
          data: rawGrns || [],
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
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const grns = data?.data?.data || [];
  const meta = data?.data;
  const summary = data?.summary || { total_grns: 0, total_value: 0 };

  const handleExport = (format: 'pdf' | 'csv') => {
    if (format === 'pdf') {
      window.print();
    } else {
      if (!grns || grns.length === 0) return;
      const headers = ['Date', 'GRN Number', 'Supplier', 'Warehouse', 'Items', 'Total Amount', 'Status'];
      const rows = grns.map((row: any) => [
        row.received_date,
        row.grn_number,
        row.supplier?.company_name || 'N/A',
        row.warehouse?.name_en || 'N/A',
        row.items?.length || 0,
        row.total_amount || 0,
        row.status || 'draft'
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "grn_report.csv");
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
          <h1 className="text-2xl font-bold">Goods Received Notes (GRN) Report</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed report of all received inventory and supplier deliveries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-all">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-muted-foreground mb-2"><FileCheck size={18} /><span className="text-sm font-semibold uppercase tracking-wider">Total GRNs</span></div>
          <p className="text-3xl font-bold">{summary.total_grns}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-green-600 mb-2"><TrendingUp size={18} /><span className="text-sm font-semibold uppercase tracking-wider">Total Value (Approved)</span></div>
          <p className="text-3xl font-bold text-green-700">Rs. {Number(summary.total_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex flex-wrap md:flex-nowrap gap-3">
        <div className="relative flex-1 md:w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <select value={supplierId} onChange={e => { setSupplierId(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Suppliers</option>
            {suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="relative flex-1 md:w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
                <th>GRN No.</th>
                <th>Received Date</th>
                <th>Supplier</th>
                <th>Warehouse</th>
                <th>Received By</th>
                <th>Status</th>
                <th className="text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length: 8}).map((_, i) => (
                <tr key={i}>{Array.from({length: 7}).map((_, j) => <td key={j}><div className="shimmer h-4 rounded w-full max-w-[100px]" /></td>)}</tr>
              )) : grns.map((grn: any) => (
                <tr key={grn.id}>
                  <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{grn.grn_number}</code></td>
                  <td className="text-sm text-muted-foreground">{grn.received_date ? new Date(grn.received_date).toLocaleDateString('en-LK') : '—'}</td>
                  <td className="text-sm font-medium">{grn.supplier?.name || '—'}</td>
                  <td className="text-sm text-muted-foreground">{grn.warehouse?.name_en || '—'}</td>
                  <td className="text-sm text-muted-foreground">{grn.received_by?.name || '—'}</td>
                  <td>
                    <span className={`badge-sm ${grn.status === 'approved' ? 'badge-success' : grn.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {grn.status}
                    </span>
                  </td>
                  <td className="text-sm font-semibold text-right">Rs. {Number(grn.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && grns.length === 0 && <div className="text-center py-16 text-muted-foreground">No GRN records found</div>}

        {!isLoading && meta?.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {meta.from}–{meta.to} of {meta.total} GRNs</p>
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