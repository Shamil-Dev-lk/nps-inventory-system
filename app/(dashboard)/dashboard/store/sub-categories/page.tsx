'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ListTree } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface SubCategory {
  id: number;
  name_en: string;
  category_id: number;
  category?: { id: number; name_en: string };
}

export default function SubCategoriesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: subCategories = [], isLoading } = useQuery({
    queryKey: ['sub-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sub_categories').select('*, category:categories(name_en)').order('created_at', { ascending: false });
      if (error) throw error;
      return data as SubCategory[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('sub_categories').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Sub-Category deleted successfully.');
      qc.invalidateQueries({ queryKey: ['sub-categories'] });
    },
    onError: () => toast.error('Failed to delete sub-category.'),
  });

  const handleDelete = (sc: SubCategory) => {
    if (confirm(`Delete "${sc.name_en}"? This action cannot be undone.`)) {
      deleteMutation.mutate(sc.id);
    }
  };

  const filteredSubCategories = subCategories.filter((sc: SubCategory) => 
    sc.name_en?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sub-Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage item sub-categories</p>
        </div>
        <Link
          href="/dashboard/store/sub-categories/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient hover:opacity-90 transition-all shadow-sm"
        >
          <Plus size={15} />
          Add Sub-Category
        </Link>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <input
          type="search"
          placeholder="Search by name..."
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
                <th>Name (EN)</th>
                <th>Category</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={3}><div className="shimmer h-4 rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredSubCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-10">
                    <ListTree size={32} className="mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No sub-categories found</p>
                  </td>
                </tr>
              ) : (
                filteredSubCategories.map((sc: SubCategory) => (
                  <tr key={sc.id}>
                    <td className="font-medium">{sc.name_en}</td>
                    <td>
                      {sc.category ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          {sc.category.name_en}
                        </span>
                      ) : (
                        sc.category_id || '—'
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/store/sub-categories/${sc.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-500">
                          <Edit size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(sc)}
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
