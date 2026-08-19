'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Star } from 'lucide-react';
import { isItemFeatured, toggleItemFeatured } from '@/lib/featured-items';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function EditItemPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  const searchParams = useSearchParams();
  const itemId = searchParams.get('id');

  const { data: itemData } = useQuery({ 
    queryKey: ['item', itemId], 
    queryFn: async () => {
      if (!itemId) return null;
      const { data, error } = await supabase.from('items').select('*').eq('id', itemId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: async () => { const { data } = await supabase.from('categories').select('*'); return data || []; } });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: async () => { const { data } = await supabase.from('brands').select('*'); return data || []; } });
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: async () => { const { data } = await supabase.from('units').select('*'); return data || []; } });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: async () => { const { data } = await supabase.from('warehouses').select('*'); return data || []; } });

  useEffect(() => {
    if (itemData) {
      reset({
        code: itemData.code || itemData.item_code || '',
        name_en: itemData.name_en || '',
        category_id: itemData.category_id || '',
        brand_id: itemData.brand_id || '',
        unit_id: itemData.unit_id || '',
        warehouse_id: itemData.warehouse_id || '',
        description: itemData.description?.replace(/\[Featured\]/g, '').trim() || '',
        is_featured: isItemFeatured(itemData),
        purchase_price: itemData.purchase_price || 0,
        selling_price: itemData.selling_price || 0,
        current_quantity: itemData.current_quantity ?? 0,
        reorder_level: itemData.reorder_level || 0,
        minimum_stock: itemData.minimum_stock || 0,
        maximum_stock: itemData.maximum_stock || 0,
      });
    }
  }, [itemData, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const isFeatured = Boolean(data.is_featured);
      delete data.is_featured;

      let cleanDesc = (data.description || '').replace(/\[Featured\]/g, '').trim();
      if (isFeatured) {
        data.description = `[Featured] ${cleanDesc}`.trim();
      } else {
        data.description = cleanDesc;
      }

      if (itemId) {
        const currentlyFeatured = isItemFeatured(itemData);
        if (isFeatured !== currentlyFeatured) {
          toggleItemFeatured(itemId);
        }
      }

      const { error } = await supabase.from('items').update(data).eq('id', itemId);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      toast.success('Item updated successfully');
      router.push('/dashboard/items');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update item'),
  });

  const onSubmit = (data: any) => {
    data.purchase_price = parseFloat(data.purchase_price || 0);
    data.selling_price = parseFloat(data.selling_price || 0);
    data.current_quantity = parseFloat(data.current_quantity || 0);
    data.minimum_stock = parseFloat(data.minimum_stock || 0);
    data.maximum_stock = parseFloat(data.maximum_stock || 0);
    data.reorder_level = parseFloat(data.reorder_level || 0);
    
    if (data.category_id === '') data.category_id = null;
    if (data.brand_id === '') data.brand_id = null;
    if (data.unit_id === '') data.unit_id = null;
    if (data.warehouse_id === '') data.warehouse_id = null;
    
    updateMutation.mutate(data);
  };

  if (!itemData) return <div className="p-8 text-center text-muted-foreground">Loading item details...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/items" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Item: {itemData.code || itemData.item_code}</h1>
          <p className="text-sm text-muted-foreground">Update inventory item details and current stock</p>
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
            <div className="md:col-span-2 flex items-center gap-2 pt-1">
              <input type="checkbox" id="is_featured" {...register('is_featured')} className="w-4 h-4 rounded text-amber-500 border-input focus:ring-amber-400" />
              <label htmlFor="is_featured" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer select-none">
                <Star size={16} className="text-amber-500 fill-amber-500" /> Feature this Item (Starred / High Priority)
              </label>
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
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <label className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                Current Stock (Quantity)
              </label>
              <input type="number" step="0.01" {...register('current_quantity')} placeholder="0" className="w-full px-3 py-2 mt-1 border border-amber-500/40 rounded-lg font-bold bg-white dark:bg-background text-foreground" />
              <p className="text-[11px] text-muted-foreground mt-1">Directly edit the current available stock quantity.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Reorder Level</label>
              <input type="number" step="0.01" {...register('reorder_level')} className="w-full px-3 py-2 mt-1 border rounded-lg" />
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
          <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium">
            <Save size={16} />
            {updateMutation.isPending ? 'Updating...' : 'Update Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
