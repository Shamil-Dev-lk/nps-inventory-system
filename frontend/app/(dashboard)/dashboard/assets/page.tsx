'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Eye, Edit, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

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
    queryFn: () => api.get('/v1/assets').then((r) => r.data?.data || []),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/v1/assets/${id}`),
    onSuccess: () => {
      toast.success('Asset deleted successfully.');
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: () => toast.error('Failed to delete asset.'),
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
        <Link
          href="/dashboard/assets/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient hover:opacity-90 transition-all shadow-sm"
        >
          <Plus size={15} />
          Add Asset
        </Link>
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
                        <Link href={`/dashboard/assets/${asset.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-500">
                          <Edit size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(asset)}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 size={15} />
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
