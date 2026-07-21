'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      supplier_id: '',
      purchase_request_id: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      terms_conditions: '',
      remarks: '',
      items: [{ item_id: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0, specification: '' }]
    }
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => api.get('/v1/suppliers').then(r => r.data.data) });
  const { data: itemsList = [] } = useQuery({ queryKey: ['items'], queryFn: () => api.get('/v1/items?per_page=1000').then(r => r.data.data.data || []) });
  const { data: prs = [] } = useQuery({ queryKey: ['purchase-requests-approved'], queryFn: () => api.get('/v1/purchase/requests?status=approved').then(r => r.data.data.data || []) });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/purchase/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order created successfully');
      router.push('/dashboard/purchase/orders');
    },
    onError: () => toast.error('Failed to create purchase order'),
  });

  const onSubmit = (data: any) => {
    if (!data.items || data.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    // Format numeric values
    data.items = data.items.map((item: any) => ({
      ...item,
      quantity: parseFloat(item.quantity || 0),
      unit_price: parseFloat(item.unit_price || 0),
      discount_percent: parseFloat(item.discount_percent || 0),
      tax_percent: parseFloat(item.tax_percent || 0)
    }));
    
    createMutation.mutate(data);
  };

  const calculateSubtotal = () => {
    return watchItems.reduce((acc, item) => acc + ((parseFloat(item.quantity as any) || 0) * (parseFloat(item.unit_price as any) || 0)), 0);
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/purchase/orders" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Purchase Order</h1>
          <p className="text-sm text-muted-foreground">Create a new PO for suppliers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Order Details */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Supplier *</label>
              <select {...register('supplier_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select Supplier</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.supplier_id && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Purchase Request (Optional)</label>
              <select {...register('purchase_request_id')} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select PR</option>
                {prs.map((pr: any) => <option key={pr.id} value={pr.id}>{pr.pr_number} - {pr.purpose}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Order Date *</label>
              <input type="date" {...register('order_date', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Expected Delivery Date</label>
              <input type="date" {...register('expected_delivery_date')} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Remarks</label>
              <input {...register('remarks')} placeholder="Internal notes..." className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Order Items</h2>
            <button 
              type="button" 
              onClick={() => append({ item_id: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0, specification: '' })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium min-w-[200px]">Item *</th>
                  <th className="px-4 py-3 font-medium w-32">Qty *</th>
                  <th className="px-4 py-3 font-medium w-32">Unit Price *</th>
                  <th className="px-4 py-3 font-medium w-24">Disc %</th>
                  <th className="px-4 py-3 font-medium w-24">Tax %</th>
                  <th className="px-4 py-3 font-medium w-32 text-right">Line Total</th>
                  <th className="px-4 py-3 font-medium w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((field, index) => {
                  const qty = parseFloat(watchItems[index]?.quantity as any) || 0;
                  const price = parseFloat(watchItems[index]?.unit_price as any) || 0;
                  const disc = parseFloat(watchItems[index]?.discount_percent as any) || 0;
                  const tax = parseFloat(watchItems[index]?.tax_percent as any) || 0;
                  
                  const sub = qty * price;
                  const afterDisc = sub - (sub * disc / 100);
                  const lineTotal = afterDisc + (afterDisc * tax / 100);

                  return (
                    <tr key={field.id}>
                      <td className="px-4 py-3">
                        <select {...register(`items.${index}.item_id`, { required: true })} className="w-full px-2 py-1.5 border rounded-md bg-background">
                          <option value="">Select Item</option>
                          {itemsList.map((item: any) => <option key={item.id} value={item.id}>{item.item_code} - {item.name_en}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" step="0.001" min="0.001" {...register(`items.${index}.quantity`, { required: true })} className="w-full px-2 py-1.5 border rounded-md bg-background" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" step="0.01" min="0" {...register(`items.${index}.unit_price`, { required: true })} className="w-full px-2 py-1.5 border rounded-md bg-background" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" step="1" min="0" max="100" {...register(`items.${index}.discount_percent`)} className="w-full px-2 py-1.5 border rounded-md bg-background" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" step="1" min="0" max="100" {...register(`items.${index}.tax_percent`)} className="w-full px-2 py-1.5 border rounded-md bg-background" />
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        Rs. {lineTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button type="button" onClick={() => remove(index)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-muted/20 border-t flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Subtotal:</span>
                <span className="font-mono">Rs. {calculateSubtotal().toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Terms */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <label className="text-sm font-medium">Terms & Conditions</label>
          <textarea {...register('terms_conditions')} rows={3} className="w-full px-3 py-2 mt-1 border rounded-lg" placeholder="Payment terms, delivery instructions, etc..."></textarea>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/purchase/orders" className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} />
            {createMutation.isPending ? 'Saving...' : 'Save Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
