'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Trash2, ClipboardCheck, Clock, CheckCircle, Printer, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const statusConfig = {
  draft:       { label: 'Draft', class: 'badge-secondary', icon: Clock },
  in_progress: { label: 'In Progress', class: 'badge-warning', icon: Clock },
  completed:   { label: 'Completed', class: 'badge-info', icon: CheckCircle },
  approved:    { label: 'Approved', class: 'badge-success', icon: ClipboardCheck },
};

export default function StockTakingPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stock-taking', page, search, status],
    queryFn: async () => {
      let query = supabase
        .from('stock_takings')
        .select('*, warehouse:warehouses(id, name_en)', { count: 'exact' });

      if (search) query = query.ilike('st_number', `%${search}%`);
      if (status) query = query.eq('status', status);

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: stData, error, count } = await query;
      if (error) throw error;

      return {
        data: {
          data: stData || [],
          total: count || 0,
        }
      };
    },
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('stock_takings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Session deleted successfully.');
      qc.invalidateQueries({ queryKey: ['stock-taking'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete'),
  });

  const handleDelete = (item: any) => {
    if (confirm(`Delete session "${item.st_number}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const items = data?.data?.data || [];
  const meta = data?.data;

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Taking</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage physical inventory counting sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/stock/taking/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={15} />
            New Stock Take
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between gap-4">
          <div className="flex gap-3 flex-1">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                type="search"
                placeholder="Search by ST number..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-48 text-sm rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ST Number</th>
                <th>Title</th>
                <th>Warehouse</th>
                <th>Count Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}><div className="shimmer h-3.5 rounded w-full max-w-[80px]" /></td>
                      ))}
                    </tr>
                  ))
                : items.map((item: any) => {
                    const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.draft;
                    return (
                      <tr key={item.id}>
                        <td>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{item.st_number}</code>
                        </td>
                        <td className="font-medium text-sm">{item.title}</td>
                        <td className="text-muted-foreground text-sm">{item.warehouse?.name_en || '—'}</td>
                        <td className="text-muted-foreground text-sm">{item.count_date}</td>
                        <td>
                          <span className={status.class + " inline-flex items-center gap-1"}>
                            <status.icon size={12} />
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=stock-taking&id=${item.id}&action=download`, '_blank')} className="p-1.5 rounded hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors" title="Download PDF"><FileDown size={15} /></button>
                            <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=stock-taking&id=${item.id}`, '_blank')} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 transition-colors" title="Print Document"><Printer size={15} /></button>
                            <Link
                              href={`/dashboard/stock/taking/${item.id}`}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="View / Continue"
                            >
                              <Eye size={15} />
                            </Link>
                            {item.status === 'draft' && (
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
                                title="Delete"
                                disabled={deleteMutation.isPending}
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

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="text-center py-16">
            <ClipboardCheck size={48} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No stock taking sessions found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Start a new physical count session</p>
          </div>
        )}
      </div>
    </div>
  );
}
