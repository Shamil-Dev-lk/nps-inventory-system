'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, Search, Filter, Edit, Trash2, Eye, Package,
  Barcode, Tag, AlertTriangle, CheckCircle, XCircle,
  Download, Upload, ScanLine, RefreshCw, ChevronDown,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { exportToCsv } from '@/lib/export';
import { supabase } from '@/lib/supabase';
import type { Item } from '@/types';
import { StickerGeneratorDialog } from '@/components/print/StickerGeneratorDialog';
import { QRGeneratorDialog } from '@/components/print/QRGeneratorDialog';
import { BarcodeGeneratorDialog } from '@/components/print/BarcodeGeneratorDialog';

const statusConfig = {
  in_stock:    { label: 'In Stock',    class: 'badge-success' },
  low_stock:   { label: 'Low Stock',   class: 'badge-warning' },
  out_of_stock:{ label: 'Out of Stock',class: 'badge-danger' },
  overstocked: { label: 'Overstocked', class: 'badge-info' },
};

export default function ItemsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [isFetchingAll, setIsFetchingAll] = useState(false);

  const handlePrintAllStickers = async () => {
    try {
      setIsFetchingAll(true);
      const { data, error } = await supabase.from('items').select('*, category:categories(id, name_en)');
      if (error) throw error;
      setSelectedItems(data as any[] || []);
      setStickerOpen(true);
    } catch (error) {
      toast.error('Failed to load all items for printing');
    } finally {
      setIsFetchingAll(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked && data?.data) setSelectedItems(data.data as any[]);
    else setSelectedItems([]);
  };

  const toggleSelectItem = (item: Item) => {
    setSelectedItems(prev => prev.find(i => i.id === item.id) 
      ? prev.filter(i => i.id !== item.id)
      : [...prev, item]
    );
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['items', page, search, categoryId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select('*, category:categories(id, name_en)', { count: 'exact' });
        
      if (search) query = query.or(`name_en.ilike.%${search}%,item_code.ilike.%${search}%,barcode.ilike.%${search}%`);
      if (categoryId) query = query.eq('category_id', categoryId);
      
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        data: data || [],
        total: count || 0,
        from: from + 1,
        to: Math.min(from + perPage, count || 0),
        last_page: Math.ceil((count || 0) / perPage),
        summary: {
           total_items: count || 0,
           total_value: data?.reduce((acc: number, curr: any) => acc + ((curr.average_cost || 0) * (curr.current_quantity || 0)), 0) || 0,
           low_stock_count: data?.filter(i => i.is_low_stock && !i.is_out_of_stock).length || 0,
           out_of_stock_count: data?.filter(i => i.is_out_of_stock).length || 0,
        }
      };
    },
    placeholderData: (prev) => prev,
  });

  const { data: categories } = useQuery({
    queryKey: ['item-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Item deleted successfully.');
      qc.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete item.');
    },
  });

  const handleDelete = (item: Item) => {
    if (confirm(`Delete "${item.name_en}"? This action cannot be undone.`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const items: Item[] = (data as any)?.data || [];
  const meta = data;

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Item Master</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all inventory items, categories, and stock levels
          </p>
        </div>
        <div className="flex items-center gap-2">

          {hasPermission('export-reports') && (
            <button onClick={() => exportToCsv('items', items)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-all">
              <Download size={14} />
              Export
            </button>
          )}
          <div className="h-6 w-px bg-border mx-1"></div>
            {selectedItems.length > 0 && (
              <>
                <button onClick={() => setStickerOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#c21f4c] text-[#c21f4c] bg-white hover:bg-red-50 text-sm font-medium transition-all shadow-sm">
                  <Printer size={14} /> Print Selected ({selectedItems.length})
                </button>
                <div className="h-6 w-px bg-border mx-1"></div>
              </>
            )}
            <button onClick={handlePrintAllStickers} disabled={isFetchingAll} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#c21f4c] text-white bg-[#c21f4c] hover:bg-[#a0183e] text-sm font-medium transition-all shadow-sm disabled:opacity-50">
            {isFetchingAll ? <RefreshCw size={14} className="animate-spin" /> : <Printer size={14} />} 
            Print All Stickers
          </button>
          <div className="h-6 w-px bg-border mx-1"></div>
          {hasPermission('create-items') && (
            <Link
              href="/dashboard/items/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient hover:opacity-90 transition-all shadow-sm"
            >
              <Plus size={15} />
              Add Item
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-card border border-border p-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="search"
              placeholder="Search by name, code, or barcode..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="py-2 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Categories</option>
            {(categories || []).map((c: { id: number; name_en: string }) => (
              <option key={c.id} value={c.id}>{c.name_en}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="py-2 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw size={15} className="text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Summary stats */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Items', value: data.summary.total_items, icon: Package, color: '#006838' },
            { label: 'Total Value', value: `Rs. ${Number(data.summary.total_value).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`, icon: Tag, color: '#8DC63F' },
            { label: 'Low Stock', value: data.summary.low_stock_count, icon: AlertTriangle, color: '#FDB913' },
            { label: 'Out of Stock', value: data.summary.out_of_stock_count, icon: XCircle, color: '#ef4444' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-card border border-border p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12 px-5 text-center">
                  <input type="checkbox" className="rounded" checked={selectedItems.length > 0 && selectedItems.length === items.length} onChange={(e) => toggleSelectAll(e.target.checked)} />
                </th>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Stock Qty</th>
                <th>Status</th>
                <th>Barcode</th>
                <th>QR Code</th>
                <th>Sticker</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j}><div className="shimmer h-3.5 rounded w-full max-w-[80px]" /></td>
                      ))}
                    </tr>
                  ))
                : items.map((item) => {
                    const status = statusConfig[item.stock_status] || statusConfig.in_stock;
                    const totalValue = item.current_quantity * item.average_cost;
                    return (
                      <tr key={item.id}>
                        <td className="px-5 text-center">
                          <input type="checkbox" className="rounded" checked={selectedItems.some(i => i.id === item.id)} onChange={() => toggleSelectItem(item)} />
                        </td>
                        <td>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{item.code || item.item_code}</code>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-foreground text-sm">{item.name_en}</p>
                            {item.name_si && <p className="text-xs text-muted-foreground">{item.name_si}</p>}
                          </div>
                        </td>
                        <td className="text-muted-foreground text-sm">{item.category?.name_en || '—'}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold ${item.is_out_of_stock ? 'text-red-500' : item.is_low_stock ? 'text-amber-500' : 'text-foreground'}`}>
                              {Number(item.current_quantity || 0).toLocaleString()}
                            </span>
                            {item.is_low_stock && !item.is_out_of_stock && (
                              <AlertTriangle size={12} className="text-amber-400" />
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={status.class}>{status.label}</span>
                        </td>
                        <td>
                          <button onClick={() => { setSelectedItems([item]); setBarcodeOpen(true); }} className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors">
                            {item.barcode || item.code || item.item_code || '—'}
                          </button>
                        </td>
                        <td>
                          <button onClick={() => { setSelectedItems([item]); setQrOpen(true); }} className="text-xs bg-purple-50 text-purple-600 dark:bg-purple-900/20 px-2 py-1 rounded border border-purple-100 dark:border-purple-800 hover:bg-purple-100 transition-colors">
                            {item.qr_code || item.code || item.item_code || '—'}
                          </button>
                        </td>
                        <td>
                          <button onClick={() => { setSelectedItems([item]); setStickerOpen(true); }} className="text-xs bg-amber-50 text-amber-600 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-100 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1">
                            <Printer size={12} /> Print
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/dashboard/items/${item.id}`}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="View"
                            >
                              <Eye size={15} />
                            </Link>
                            {hasPermission('edit-items') && (
                              <Link
                                href={`/dashboard/items/${item.id}/edit`}
                                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-500 transition-colors"
                                title="Edit"
                              >
                                <Edit size={15} />
                              </Link>
                            )}
                            {hasPermission('delete-items') && (
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
            <Package size={48} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No items found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {search ? 'Try adjusting your search or filters' : 'Add your first inventory item to get started'}
            </p>
            {!search && hasPermission('create-items') && (
              <Link
                href="/dashboard/items/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient"
              >
                <Plus size={14} /> Add First Item
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && meta?.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {meta.from}–{meta.to} of {meta.total} items
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">
                {page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generator Modals */}
      <StickerGeneratorDialog open={stickerOpen} onOpenChange={setStickerOpen} items={selectedItems} />
      <QRGeneratorDialog open={qrOpen} onOpenChange={setQrOpen} items={selectedItems} />
      <BarcodeGeneratorDialog open={barcodeOpen} onOpenChange={setBarcodeOpen} items={selectedItems} />
    </div>
  );
}
