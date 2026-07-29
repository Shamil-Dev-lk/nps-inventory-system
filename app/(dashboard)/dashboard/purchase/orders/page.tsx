'use client';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, RefreshCw, Printer, FileDown, Download, Edit } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { exportToCsv } from '@/lib/export';

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
          <p className="text-sm text-muted-foreground mt-1">Manage purchase orders and track supplier deliveries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv('purchase_orders', pos)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download size={15} /> Export
          </button>
          {hasPermission('create-purchase-orders') && (
            <Link href="/dashboard/purchase/orders/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient shadow-sm hover:opacity-90">
              <Plus size={16} /> New PO
            </Link>
          )}
        </div>
      </div>
      
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="search" 
              placeholder="Search by PO number..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" 
            />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[160px]">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="ordered">Ordered</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={() => refetch()} className="p-2 rounded-lg border border-input bg-background hover:bg-muted transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Order Date</th>
                <th>Supplier</th>
                <th>Created By</th>
                <th className="text-right">Total Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : pos.map((po: any) => (
                <tr key={po.id}>
                  <td className="font-mono font-medium text-xs">{po.po_number || po.order_number}</td>
                  <td className="text-sm text-muted-foreground">{new Date(po.order_date).toLocaleDateString('en-LK')}</td>
                  <td className="text-sm">{po.supplier?.name || '—'}</td>
                  <td className="text-sm text-muted-foreground">{po.created_by?.name || po.createdBy?.name || '—'}</td>
                  <td className="text-sm font-medium text-right font-mono text-foreground/80">
                    Rs. {parseFloat(po.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={
                      po.status === 'approved' || po.status === 'received' ? 'badge-success' :
                      po.status === 'cancelled' ? 'badge-danger' :
                      po.status === 'ordered' ? 'badge-info' :
                      po.status === 'pending_approval' ? 'badge-warning' :
                      'badge-gray'
                    }>
                      {po.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=purchase-order&id=${po.id}&action=download`, '_blank')} 
                        className="p-1.5 rounded text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" 
                        title="Download PDF"
                      >
                        <FileDown size={15} />
                      </button>
                      <button 
                        onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=purchase-order&id=${po.id}`, '_blank')} 
                        className="p-1.5 rounded text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" 
                        title="Print Document"
                      >
                        <Printer size={15} />
                      </button>
                      <Link href={`/dashboard/purchase/orders/view/?id=${po.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View Details">
                        <Eye size={15} />
                      </Link>
                      <Link href={`/dashboard/purchase/orders/edit/?id=${po.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-500 transition-colors" title="Edit Purchase Order">
                        <Edit size={15} />
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