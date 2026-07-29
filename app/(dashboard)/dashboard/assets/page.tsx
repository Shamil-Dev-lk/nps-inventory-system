'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Eye, Edit, Trash2, Package, Printer, FileDown, Download } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { exportToCsv } from '@/lib/export-utils';

interface Asset {
  id: number;
  asset_code: string;
  name: string;
  status: string;
}

export default function AssetsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Asset deleted successfully.');
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete asset.');
    },
  });

  const handleDelete = (asset: Asset) => {
    if (confirm(`Delete "${asset.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(asset.id);
    }
  };

  const filteredAssets = assets.filter((a: Asset) => 
    a.name?.toLowerCase().includes(search.toLowerCase()) || 
    a.asset_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all company assets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv('assets', filteredAssets)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download size={15} /> Export
          </button>
          <Link
            href="/dashboard/assets/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={15} />
            Add Asset
          </Link>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <input
          type="search"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4}><div className="shimmer h-4 rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10">
                    <Package size={32} className="mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No assets found</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset: Asset) => (
                  <tr key={asset.id}>
                    <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{asset.asset_code}</code></td>
                    <td className="font-medium">{asset.name}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                        asset.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=asset&id=${asset.id}&action=download`, '_blank')} 
                          className="p-1.5 rounded text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" 
                          title="Download PDF"
                        >
                          <FileDown size={16} />
                        </button>
                        <button 
                          onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=asset&id=${asset.id}`, '_blank')} 
                          className="p-1.5 rounded text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" 
                          title="Print Asset Label"
                        >
                          <Printer size={16} />
                        </button>
                        <Link href={`/dashboard/assets/view/?id=${asset.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="View Details">
                          <Eye size={16} />
                        </Link>
                        <Link href={`/dashboard/assets/edit/?id=${asset.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-500 transition-colors" title="Edit Asset">
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(asset)}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete Asset"
                        >
                          <Trash2 size={16} />
                        </button>
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
