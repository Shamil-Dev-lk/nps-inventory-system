'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Edit, CheckCircle, XCircle, RefreshCw, Printer, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function GrnPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['grn', page, search, status],
    queryFn: () => api.get('/v1/grn', { params: { page, search, status } }).then(r => r.data),
  });
  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/v1/grn/${id}/approve`),
    onSuccess: () => { toast.success('GRN approved.'); qc.invalidateQueries({ queryKey: ['grn'] }); },
    onError: () => toast.error('Failed to approve.'),
  });
  const grns = data?.data?.data || [];
  const meta = data?.data;
  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold">Goods Received Notes</h1><p className="text-sm text-muted-foreground mt-1">Track and manage all incoming stock deliveries</p></div>
        {hasPermission('create-grn') && (
          <Link href="/dashboard/stock/grn/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient shadow-sm hover:opacity-90">
            <Plus size={15} /> New GRN
          </Link>
        )}
      </div>
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input type="search" placeholder="Search GRN number or supplier..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-48 text-sm rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="received">Received</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border hover:bg-muted"><RefreshCw size={15} className="text-muted-foreground" /></button>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>GRN No.</th><th>Supplier</th><th>Warehouse</th><th>Received Date</th><th>Invoice No.</th><th>Amount</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {isLoading ? Array.from({length:6}).map((_,i) => <tr key={i}>{Array.from({length:8}).map((_,j) => <td key={j}><div className="shimmer h-3.5 rounded w-full max-w-[80px]" /></td>)}</tr>) :
              grns.map((g: any) => (
                <tr key={g.id}>
                  <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{g.grn_number}</code></td>
                  <td className="text-sm">{g.supplier?.company_name || '—'}</td>
                  <td className="text-sm text-muted-foreground">{g.warehouse?.name_en || '—'}</td>
                  <td className="text-sm text-muted-foreground">{g.received_date ? new Date(g.received_date).toLocaleDateString('en-LK') : '—'}</td>
                  <td className="text-sm text-muted-foreground">{g.invoice_number || '—'}</td>
                  <td className="text-sm font-semibold">Rs. {Number(g.total_amount||0).toLocaleString('en-LK', {minimumFractionDigits:2})}</td>
                  <td><span className={g.status==='approved'?'badge-success':g.status==='rejected'?'badge-danger':'badge-warning'}>{g.status}</span></td>
                  <td><div className="flex items-center justify-end gap-1">
                    <button onClick={() => window.open(`/dashboard/receipts/print?type=grn&id=${g.id}&action=download`, '_blank')} className="p-1.5 rounded hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors" title="Download PDF"><FileDown size={15} /></button>
                    <button onClick={() => window.open(`/dashboard/receipts/print?type=grn&id=${g.id}`, '_blank')} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 transition-colors" title="Print Document"><Printer size={15} /></button>
                    <Link href={`/dashboard/stock/grn/${g.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye size={15} /></Link>
                    {hasPermission('approve-grn') && g.status === 'draft' && (
                      <button onClick={() => approveMutation.mutate(g.id)} className="p-1.5 rounded hover:bg-green-50 text-muted-foreground hover:text-green-500 transition-colors" title="Approve"><CheckCircle size={15} /></button>
                    )}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && grns.length === 0 && <div className="text-center py-16"><p className="text-muted-foreground">No GRNs found</p></div>}
        {!isLoading && meta?.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {meta.from}–{meta.to} of {meta.total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40">Previous</button>
              <span className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">{page}</span>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p+1))} disabled={page===meta.last_page} className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}