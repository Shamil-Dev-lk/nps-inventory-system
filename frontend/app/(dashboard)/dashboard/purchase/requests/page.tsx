'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function PurchaseRequestsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['purchase-requests', page, search, status],
    queryFn: () => api.get('/v1/purchase/requests', { params: { page, search, status } }).then(r => r.data),
  });
  const prs = data?.data?.data || [];
  const meta = data?.data;
  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold">Purchase Requests</h1><p className="text-sm text-muted-foreground mt-1">Manage procurement requests with approval workflow</p></div>
        {hasPermission('create-purchase-requests') && (
          <Link href="/dashboard/purchase/requests/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient shadow-sm hover:opacity-90">
            <Plus size={15} /> New Request
          </Link>
        )}
      </div>
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input type="search" placeholder="Search PR number or department..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="py-2 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border hover:bg-muted"><RefreshCw size={15} className="text-muted-foreground" /></button>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>PR No.</th><th>Department</th><th>Requested By</th><th>Priority</th><th>Required Date</th><th>Purpose</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {isLoading ? Array.from({length:6}).map((_,i) => <tr key={i}>{Array.from({length:8}).map((_,j) => <td key={j}><div className="shimmer h-3.5 rounded w-full max-w-[80px]" /></td>)}</tr>) :
              prs.map((pr: any) => (
                <tr key={pr.id}>
                  <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{pr.pr_number}</code></td>
                  <td className="text-sm">{pr.department?.name_en || '—'}</td>
                  <td className="text-sm text-muted-foreground">{pr.requested_by?.name || pr.requestedBy?.name || '—'}</td>
                  <td><span className={pr.priority==='urgent'?'badge-danger':pr.priority==='high'?'badge-warning':pr.priority==='normal'?'badge-info':'badge-gray'}>{pr.priority||'normal'}</span></td>
                  <td className="text-sm text-muted-foreground">{pr.required_date ? new Date(pr.required_date).toLocaleDateString('en-LK') : '—'}</td>
                  <td className="text-sm text-muted-foreground max-w-[150px] truncate">{pr.purpose || '—'}</td>
                  <td><span className={pr.status==='approved'?'badge-success':pr.status==='rejected'?'badge-danger':pr.status==='submitted'?'badge-info':'badge-gray'}>{pr.status}</span></td>
                  <td><div className="flex items-center justify-end gap-1">
                    <Link href={`/dashboard/purchase/requests/${pr.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye size={15} /></Link>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && prs.length === 0 && <div className="text-center py-16"><p className="text-muted-foreground">No purchase requests found</p></div>}
      </div>
    </div>
  );
}