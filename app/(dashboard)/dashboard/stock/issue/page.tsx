'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, CheckCircle, RefreshCw, Printer, FileDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export default function StockIssuePage() {
  const qc = useQueryClient();
  const { user, hasPermission, hasSuperAdmin } = useAuthStore();
  const isAdmin = hasSuperAdmin() || user?.roles?.some((r: string) => r.toLowerCase().includes('admin')) || hasPermission('delete-stock-issues') || hasPermission('delete-all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data: issues = [], isLoading, refetch } = useQuery({
    queryKey: ['stock-issues', page, search, status],
    queryFn: async () => {
      let query = supabase
        .from('stock_issues')
        .select('*, department:departments(id, name_en), project:projects(id, name_en), customer:customers(id, name), warehouse:warehouses(id, name_en)')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('issue_number', `%${search}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('stock_issues').update({ status: 'issued' }).eq('id', id);
      if (error) throw error;

      // Auto update / deduct item stock counts
      const { data: issue } = await supabase
        .from('stock_issues')
        .select('warehouse_id, items:stock_issue_items(*)')
        .eq('id', id)
        .single();

      if (issue?.items && issue.items.length > 0) {
        for (const issueItem of issue.items) {
          if (!issueItem.item_id || !issueItem.quantity) continue;
          
          const { data: itemData } = await supabase
            .from('items')
            .select('current_quantity')
            .eq('id', issueItem.item_id)
            .single();

          if (itemData) {
            const currentQty = Number(itemData.current_quantity || 0);
            const deductQty = Number(issueItem.quantity || 0);
            const newQty = Math.max(0, currentQty - deductQty);

            await supabase
              .from('items')
              .update({ current_quantity: newQty })
              .eq('id', issueItem.item_id);
          }

          if (issue.warehouse_id) {
            const { data: stockData } = await supabase
              .from('stock')
              .select('id, quantity')
              .eq('item_id', issueItem.item_id)
              .eq('warehouse_id', issue.warehouse_id)
              .maybeSingle();

            if (stockData) {
              const currentStockQty = Number(stockData.quantity || 0);
              const newStockQty = Math.max(0, currentStockQty - Number(issueItem.quantity || 0));
              await supabase
                .from('stock')
                .update({ quantity: newStockQty })
                .eq('id', stockData.id);
            }
          }
        }
      }

      return true;
    },
    onSuccess: () => { 
      toast.success('Stock issue approved & item quantities deducted.'); 
      qc.invalidateQueries({ queryKey: ['stock-issues'] }); 
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
    onError: (err: any) => toast.error(err.message || 'Approval failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await supabase.from('stock_issue_items').delete().eq('stock_issue_id', id);
      const { error } = await supabase.from('stock_issues').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Stock issue deleted successfully.');
      qc.invalidateQueries({ queryKey: ['stock-issues'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (err: any) => toast.error(err.message || 'Delete failed.'),
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this stock issue?')) {
      deleteMutation.mutate(id);
    }
  };
  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold">Stock Issues</h1><p className="text-sm text-muted-foreground mt-1">Manage stock dispatch to departments, officers, and projects</p></div>
        {hasPermission('create-stock-issues') && (
          <Link href="/dashboard/stock/issue/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient shadow-sm hover:opacity-90">
            <Plus size={15} /> New Issue
          </Link>
        )}
      </div>
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input type="search" placeholder="Search issue number or department..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-48 text-sm rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="issued">Issued</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border hover:bg-muted"><RefreshCw size={15} className="text-muted-foreground" /></button>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Issue No.</th><th>Issued To</th><th>Type</th><th>Warehouse</th><th>Issue Date</th><th>Issued By</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {isLoading ? Array.from({length:6}).map((_,i) => <tr key={i}>{Array.from({length:8}).map((_,j) => <td key={j}><div className="shimmer h-3.5 rounded w-full max-w-[80px]" /></td>)}</tr>) :
              issues.map((issue: any) => (
                <tr key={issue.id}>
                  <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{issue.issue_number}</code></td>
                  <td className="text-sm font-medium">{issue.department?.name_en || issue.officer?.name || issue.project?.name_en || issue.customer?.name || '—'}</td>
                  <td><span className="badge-info capitalize text-xs">{issue.issue_to_type?.replace(/_/g,' ')}</span></td>
                  <td className="text-sm text-muted-foreground">{issue.warehouse?.name_en || '—'}</td>
                  <td className="text-sm text-muted-foreground">{issue.issue_date ? new Date(issue.issue_date).toLocaleDateString('en-LK') : '—'}</td>
                  <td className="text-sm text-muted-foreground">{issue.issued_by?.name || '—'}</td>
                  <td><span className={issue.status==='issued'?'badge-success':issue.status==='rejected'?'badge-danger':issue.status==='approved'?'badge-info':'badge-warning'}>{issue.status}</span></td>
                  <td><div className="flex items-center justify-end gap-1">
                    <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=stock-issue&id=${issue.id}&action=download`, '_blank')} className="p-1.5 rounded hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors" title="Download PDF"><FileDown size={15} /></button>
                    <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=stock-issue&id=${issue.id}`, '_blank')} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 transition-colors" title="Print Document"><Printer size={15} /></button>
                    <Link href={`/dashboard/stock/issue/view/?id=${issue.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View Details"><Eye size={15} /></Link>
                    {hasPermission('approve-stock-issues') && issue.status === 'draft' && (
                      <button onClick={() => approveMutation.mutate(issue.id)} className="p-1.5 rounded hover:bg-green-50 text-muted-foreground hover:text-green-500 transition-colors" title="Approve"><CheckCircle size={15} /></button>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(issue.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors" title="Delete Stock Issue"><Trash2 size={15} /></button>
                    )}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && issues.length === 0 && <div className="text-center py-16"><p className="text-muted-foreground">No stock issues found</p></div>}
      </div>
    </div>
  );
}