'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle, RefreshCw, Printer, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export default function GrnPage() {
  const qc = useQueryClient();
  const { user, hasPermission, hasSuperAdmin } = useAuthStore();
  const isAdmin = hasSuperAdmin() || 
    user?.roles?.some((r: string) => r.toLowerCase().includes('admin')) || 
    user?.designation?.toLowerCase().includes('admin') ||
    user?.email?.toLowerCase().includes('admin') ||
    hasPermission('delete-all') || 
    hasPermission('manage-inventory');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['grn', page, search, status],
    queryFn: async () => {
      let query = supabase
        .from('grns')
        .select('*, supplier:suppliers(id, company_name), warehouse:warehouses(id, name_en)', { count: 'exact' });

      if (search) {
        query = query.or(`grn_number.ilike.%${search}%,invoice_number.ilike.%${search}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const perPage = 20;
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: list, error, count } = await query;
      if (error) throw error;

      return {
        grns: list || [],
        meta: {
          total: count || 0,
          from: from + 1,
          to: Math.min(from + perPage, count || 0),
          last_page: Math.ceil((count || 0) / perPage),
        }
      };
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('grns')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      // Automatically increment stock quantities for approved items
      const { data: grn } = await supabase
        .from('grns')
        .select('warehouse_id, items:grn_items(*)')
        .eq('id', id)
        .single();

      if (grn?.items && grn.items.length > 0) {
        for (const grnItem of grn.items) {
          const acceptedQty = Number(grnItem.accepted_quantity ?? grnItem.received_quantity ?? 0);
          if (!grnItem.item_id || acceptedQty <= 0) continue;

          // 1. Update items table current_quantity
          const { data: itemData } = await supabase
            .from('items')
            .select('current_quantity')
            .eq('id', grnItem.item_id)
            .single();

          if (itemData) {
            const currentQty = Number(itemData.current_quantity || 0);
            await supabase
              .from('items')
              .update({
                current_quantity: currentQty + acceptedQty,
                ...(grnItem.unit_price ? { purchase_price: Number(grnItem.unit_price) } : {})
              })
              .eq('id', grnItem.item_id);
          }

          // 2. Update or insert into stock table for warehouse
          if (grn.warehouse_id) {
            const { data: stockData } = await supabase
              .from('stock')
              .select('id, quantity')
              .eq('item_id', grnItem.item_id)
              .eq('warehouse_id', grn.warehouse_id)
              .maybeSingle();

            if (stockData) {
              const currentStockQty = Number(stockData.quantity || 0);
              await supabase
                .from('stock')
                .update({
                  quantity: currentStockQty + acceptedQty,
                  ...(grnItem.unit_price ? { unit_price: Number(grnItem.unit_price) } : {}),
                  ...(grnItem.batch_number ? { batch_number: grnItem.batch_number } : {})
                })
                .eq('id', stockData.id);
            } else {
              await supabase
                .from('stock')
                .insert([{
                  item_id: grnItem.item_id,
                  warehouse_id: grn.warehouse_id,
                  quantity: acceptedQty,
                  unit_price: Number(grnItem.unit_price || 0),
                  batch_number: grnItem.batch_number || null,
                }]);
            }
          }
        }
      }
      return true;
    },
    onSuccess: () => {
      toast.success('GRN approved and inventory stock updated.');
      qc.invalidateQueries({ queryKey: ['grn'] });
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to approve.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Delete child grn_items first
      const { error: itemsErr } = await supabase.from('grn_items').delete().eq('grn_id', id);
      if (itemsErr) throw itemsErr;

      // Delete parent grn
      const { error } = await supabase.from('grns').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Goods Received Note deleted successfully.');
      qc.invalidateQueries({ queryKey: ['grn'] });
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      qc.invalidateQueries({ queryKey: ['report-grn'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete GRN.'),
  });

  const handleDelete = (id: number, grnNumber: string) => {
    if (window.confirm(`Are you sure you want to delete ${grnNumber}? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const grns = data?.grns || [];
  const meta = data?.meta;

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Goods Received Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage all incoming stock deliveries</p>
        </div>
        {hasPermission('create-grn') && (
          <Link href="/dashboard/stock/grn/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient shadow-sm hover:opacity-90">
            <Plus size={15} /> New GRN
          </Link>
        )}
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="search"
            placeholder="Search GRN number or invoice..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="w-48 text-sm rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="received">Received</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border hover:bg-muted" title="Refresh">
          <RefreshCw size={15} className="text-muted-foreground" />
        </button>
      </div>

      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>GRN No.</th>
                <th>Supplier</th>
                <th>Warehouse</th>
                <th>Received Date</th>
                <th>Invoice No.</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length:6}).map((_,i) => (
                <tr key={i}>{Array.from({length:8}).map((_,j) => <td key={j}><div className="shimmer h-3.5 rounded w-full max-w-[80px]" /></td>)}</tr>
              )) :
              grns.map((g: any) => {
                const grnNum = g.grn_number || (`GRN-${String(g.id).padStart(5, '0')}`);
                return (
                  <tr key={g.id}>
                    <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono font-medium">{grnNum}</code></td>
                    <td className="text-sm font-medium">{g.supplier?.company_name || '—'}</td>
                    <td className="text-sm text-muted-foreground">{g.warehouse?.name_en || '—'}</td>
                    <td className="text-sm text-muted-foreground">{g.received_date ? new Date(g.received_date).toLocaleDateString('en-LK') : '—'}</td>
                    <td className="text-sm text-muted-foreground">{g.invoice_number || '—'}</td>
                    <td className="text-sm font-semibold">Rs. {Number(g.total_amount||0).toLocaleString('en-LK', {minimumFractionDigits:2})}</td>
                    <td>
                      <span className={g.status === 'approved' ? 'badge-success' : g.status === 'rejected' ? 'badge-danger' : 'badge-warning'}>
                        {g.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=grn&id=${g.id}&action=download`, '_blank')}
                          className="p-1.5 rounded hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors"
                          title="Download PDF"
                        >
                          <FileDown size={15} />
                        </button>
                        <button
                          onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=grn&id=${g.id}`, '_blank')}
                          className="p-1.5 rounded hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 transition-colors"
                          title="Print Document"
                        >
                          <Printer size={15} />
                        </button>
                        <Link
                          href={`/dashboard/stock/grn/view/?id=${g.id}`}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </Link>
                        {isAdmin && (
                          <Link
                            href={`/dashboard/stock/grn/edit/?id=${g.id}`}
                            className="p-1.5 rounded hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors"
                            title="Edit GRN (Admin Only)"
                          >
                            <Edit size={15} />
                          </Link>
                        )}
                        {hasPermission('approve-grn') && g.status === 'draft' && (
                          <button
                            onClick={() => approveMutation.mutate(g.id)}
                            disabled={approveMutation.isPending}
                            className="p-1.5 rounded hover:bg-green-50 text-muted-foreground hover:text-green-500 transition-colors"
                            title="Approve GRN"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(g.id, grnNum)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                            title="Delete GRN (Admin Only)"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && grns.length === 0 && (
          <div className="text-center py-16"><p className="text-muted-foreground">No GRNs found</p></div>
        )}
        {!isLoading && meta && meta.last_page > 1 && (
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
