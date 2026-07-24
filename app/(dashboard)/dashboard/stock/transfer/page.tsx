'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, ArrowRightLeft, Filter, Eye, Printer, FileDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StockTransferListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['stock-transfers', searchTerm, status],
    queryFn: async () => {
      let query = supabase
        .from('stock_transfers')
        .select(`
          *,
          from_warehouse:from_warehouse_id(id, name_en),
          to_warehouse:to_warehouse_id(id, name_en),
          from_department:from_department_id(id, name_en),
          to_department:to_department_id(id, name_en)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('transfer_number', `%${searchTerm}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Transfers</h1>
          <p className="text-sm text-muted-foreground">Manage stock transfers between warehouses or departments</p>
        </div>
        <Link href="/dashboard/stock/transfer/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={18} /> New Transfer
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search transfer number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-48 bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="transferred">Transferred</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground">
            <Filter size={18} />
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Transfer No.</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">From</th>
                <th className="px-5 py-3 font-medium">To</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">Loading transfers...</td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ArrowRightLeft size={48} className="mb-4 opacity-20" />
                      <p>No stock transfers found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transfers.map((t: any) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-primary">{t.transfer_number}</td>
                    <td className="px-5 py-3">{t.transfer_type === 'warehouse_to_warehouse' ? 'WH to WH' : 'WH to Dept'}</td>
                    <td className="px-5 py-3">
                      {t.transfer_type === 'warehouse_to_warehouse' ? t.from_warehouse?.name_en : t.from_department?.name_en || '—'}
                    </td>
                    <td className="px-5 py-3">
                      {t.transfer_type === 'warehouse_to_warehouse' ? t.to_warehouse?.name_en : t.to_department?.name_en || '—'}
                    </td>
                    <td className="px-5 py-3">{t.transfer_date ? new Date(t.transfer_date).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        t.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        t.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {t.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=stock-transfer&id=${t.id}&action=download`, '_blank')} className="p-1.5 rounded text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Download PDF"><FileDown size={18} /></button>
                        <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=stock-transfer&id=${t.id}`, '_blank')} className="p-1.5 rounded text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Print Document"><Printer size={18} /></button>
                        <Link href={`/dashboard/stock/transfer/${t.id}`} className="inline-flex p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="View Details">
                          <Eye size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}