'use client';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export default function PurchaseOrdersPage() {
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data: posData, isLoading, refetch } = useQuery({
    queryKey: ['purchase-orders', page, search, status],
    queryFn: async () => {
      let query = supabase.from('purchase_orders').select('*, supplier:suppliers(name)').order('created_at', { ascending: false });
      if (search) {
        query = query.ilike('po_number', `%${search}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
  const pos = Array.isArray(posData) ? posData : (posData as any)?.data?.data || [];

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track purchase orders with suppliers</p>
        </div>
        {hasPermission('create-purchase-orders') && (
          <Link href="/dashboard/purchase/orders/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient shadow-sm hover:opacity-90">
            <Plus size={15} /> New Order
          </Link>
        )}
      </div>
      
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input 
            type="search" 
            placeholder="Search PO number..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" 
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="py-2 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="issued">Issued</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border hover:bg-muted">
          <RefreshCw size={15} className="text-muted-foreground" />
        </button>
      </div>

      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO No.</th>
                <th>Order Date</th>
                <th>Supplier</th>
                <th>Created By</th>
                <th className="text-right">Total Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length:6}).map((_,i) => (
                <tr key={i}>
                  {Array.from({length:7}).map((_,j) => (
                    <td key={j}><div className="shimmer h-3.5 rounded w-full max-w-[80px]" /></td>
                  ))}
                </tr>
              )) :
              pos.map((po: any) => (
                <tr key={po.id}>
                  <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{po.po_number}</code></td>
                  <td className="text-sm text-muted-foreground">{new Date(po.order_date).toLocaleDateString('en-LK')}</td>
                  <td className="text-sm">{po.supplier?.name || '—'}</td>
                  <td className="text-sm text-muted-foreground">{po.created_by?.name || po.createdBy?.name || '—'}</td>
                  <td className="text-sm font-medium text-right font-mono text-foreground/80">
                    Rs. {parseFloat(po.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={
                      po.status === 'approved' || po.status === 'completed' ? 'badge-success' :
                      po.status === 'cancelled' ? 'badge-danger' :
                      po.status === 'issued' ? 'badge-info' :
                      po.status === 'pending_approval' ? 'badge-warning' :
                      'badge-gray'
                    }>
                      {po.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/dashboard/purchase/orders/${po.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Eye size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && pos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No purchase orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}