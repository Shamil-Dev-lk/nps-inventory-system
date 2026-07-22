'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewItemPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: async () => { const { data } = await supabase.from('categories').select('*'); return data || []; } });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: async () => { const { data } = await supabase.from('brands').select('*'); return data || []; } });
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: async () => { const { data } = await supabase.from('units').select('*'); return data || []; } });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: async () => { const { data } = await supabase.from('warehouses').select('*'); return data || []; } });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Generate a random item code if none provided
      if (!data.code) data.code = 'ITM-' + Math.floor(Math.random() * 1000000);
      delete data.item_code;
      
      const { error } = await supabase.from('items').insert([data]);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item created successfully');
      router.push('/dashboard/items');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create item'),
  });

  const onSubmit = (data: any) => {
    // Format numeric values
    data.purchase_price = parseFloat(data.purchase_price || 0);
    data.selling_price = parseFloat(data.selling_price || 0);
    data.minimum_stock = parseFloat(data.minimum_stock || 0);
    data.maximum_stock = parseFloat(data.maximum_stock || 0);
    data.reorder_level = parseFloat(data.reorder_level || 0);
    if (data.current_quantity) data.current_quantity = parseFloat(data.current_quantity);
    
    if (data.category_id === '') data.category_id = null;
    if (data.brand_id === '') data.brand_id = null;
    if (data.unit_id === '') data.unit_id = null;
    if (data.warehouse_id === '') data.warehouse_id = null;
    
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/items" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Item</h1>
          <p className="text-sm text-muted-foreground">Create a new inventory item</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Basic Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Item Code</label>
              <input {...register('code')} placeholder="Auto-generated if empty" className="w-full px-3 py-2 mt-1 border rounded-lg bg-white dark:bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium">Name (English) *</label>
              <input {...register('name_en', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg bg-white dark:bg-background" />
              {errors.name_en && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select {...register('category_id')} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select Category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Brand</label>
              <select {...register('brand_id')} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select Brand</option>
                {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Unit</label>
              <select {...register('unit_id')} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select Unit</option>
                {units.map((u: any) => <option key={u.id} value={u.id}>{u.name_en}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea {...register('description')} rows={3} className="w-full px-3 py-2 mt-1 border rounded-lg"></textarea>
            </div>
          </div>
        </div>

        {/* Pricing & Stock Details */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Pricing & Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Purchase Price (Rs) *</label>
              <input type="number" step="0.01" {...register('purchase_price', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Selling Price (Rs)</label>
              <input type="number" step="0.01" {...register('selling_price')} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Warehouse</label>
              <select {...register('warehouse_id')} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select Warehouse</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Reorder Level</label>
              <input type="number" step="0.01" {...register('reorder_level')} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Current Stock (Opening Stock)</label>
              <input type="number" step="0.01" {...register('current_quantity')} placeholder="Optional" className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Minimum Stock</label>
              <input type="number" step="0.01" {...register('minimum_stock')} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Maximum Stock</label>
              <input type="number" step="0.01" {...register('maximum_stock')} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/items" className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} />
            {createMutation.isPending ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
