'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Plus, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';

const grnSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  received_date: z.string().min(1, 'Date is required'),
  invoice_number: z.string().optional(),
  remarks: z.string().optional(),
  items: z.array(
    z.object({
      item_id: z.string().min(1, 'Item is required'),
      received_quantity: z.number().min(1, 'Quantity must be at least 1'),
      accepted_quantity: z.number().min(0, 'Quantity cannot be negative'),
      unit_price: z.number().min(0, 'Price cannot be negative'),
      batch_number: z.string().optional(),
      expiry_date: z.string().optional()
    })
  ).min(1, 'At least one item is required')
});

type GRNFormValues = z.infer<typeof grnSchema>;

export default function NewGRNPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillItemId = searchParams.get('item');

  const [suppliers, setSuppliers] = useState<{id: number, name: string}[]>([]);
  const [warehouses, setWarehouses] = useState<{id: number, name_en: string}[]>([]);
  const [itemsList, setItemsList] = useState<{id: number, name_en: string, purchase_price: number}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, formState: { errors }, setValue, watch } = useForm<GRNFormValues>({
    resolver: zodResolver(grnSchema),
    defaultValues: {
      received_date: new Date().toISOString().split('T')[0],
      items: [{ item_id: prefillItemId || '', received_quantity: 1, accepted_quantity: 1, unit_price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  useEffect(() => {
    // Fetch suppliers, warehouses, and items
    api.get('/v1/suppliers').then(res => setSuppliers(res.data.data || []));
    api.get('/v1/warehouses').then(res => setWarehouses(res.data.data || []));
    api.get('/v1/items?per_page=1000').then(res => {
      const items = (res.data?.data?.data || res.data?.data || res.data || []);
      setItemsList(items);
      
      // Auto-fill price if prefilled item exists
      if (prefillItemId) {
        const item = items.find((i: any) => i.id.toString() === prefillItemId);
        if (item) {
          setValue('items.0.unit_price', Number(item.purchase_price));
        }
      }
    });
  }, [prefillItemId, setValue]);

  // Update unit price when item selection changes
  const handleItemChange = (index: number, itemId: string) => {
    const item = itemsList.find(i => i.id.toString() === itemId);
    if (item) {
      setValue(`items.${index}.unit_price`, Number(item.purchase_price));
    }
  };

  const watchItems = watch('items');
  const totalAmount = watchItems.reduce((sum, item) => sum + (Number(item.accepted_quantity) || 0) * (Number(item.unit_price) || 0), 0);

  const onSubmit = async (data: GRNFormValues) => {
    try {
      setIsSubmitting(true);
      await api.post('/v1/grn', data);
      toast.success('Goods Receive Note created successfully');
      router.push('/dashboard/stock/grn');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create GRN');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/items" className="p-2 rounded-lg hover:bg-muted border bg-card transition-colors" title="Back">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Receive Stock (GRN)</h1>
          <p className="text-sm text-muted-foreground mt-1">Create a new Goods Receive Note to add stock</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">GRN Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supplier *</label>
              <select {...register('supplier_id')} className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 text-sm">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.supplier_id && <p className="text-red-500 text-xs mt-1">{errors.supplier_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Warehouse *</label>
              <select {...register('warehouse_id')} className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 text-sm">
                <option value="">Select Warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name_en}</option>)}
              </select>
              {errors.warehouse_id && <p className="text-red-500 text-xs mt-1">{errors.warehouse_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Received Date *</label>
              <input type="date" {...register('received_date')} className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 text-sm" />
              {errors.received_date && <p className="text-red-500 text-xs mt-1">{errors.received_date.message}</p>}
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">Reference No (PO / Invoice)</label>
              <input type="text" {...register('invoice_number')} placeholder="e.g. INV-2026-001" className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <input type="text" {...register('remarks')} placeholder="Any remarks..." className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package size={18} className="text-primary" /> Received Items
            </h2>
            <button type="button" onClick={() => append({ item_id: '', received_quantity: 1, accepted_quantity: 1, unit_price: 0 })} className="text-sm flex items-center gap-1 text-primary hover:underline font-medium">
              <Plus size={14} /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b">
                <tr>
                  <th className="px-4 py-3 w-[25%]">Item *</th>
                  <th className="px-4 py-3 w-[15%]">Received Qty *</th>
                  <th className="px-4 py-3 w-[15%]">Accepted Qty *</th>
                  <th className="px-4 py-3 w-[15%]">Unit Cost *</th>
                  <th className="px-4 py-3 w-[15%]">Batch No</th>
                  <th className="px-4 py-3 w-[10%]">Subtotal</th>
                  <th className="px-4 py-3 w-[5%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2">
                      <select 
                        {...register(`items.${index}.item_id`)} 
                        onChange={(e) => {
                          register(`items.${index}.item_id`).onChange(e);
                          handleItemChange(index, e.target.value);
                        }}
                        className="w-full p-2 rounded-md border bg-background text-sm"
                      >
                        <option value="">Select Item</option>
                        {itemsList.map(i => <option key={i.id} value={i.id}>{i.name_en}</option>)}
                      </select>
                      {errors.items?.[index]?.item_id && <p className="text-red-500 text-xs mt-1">{errors.items[index].item_id?.message}</p>}
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number" step="0.01" 
                        {...register(`items.${index}.received_quantity`, { valueAsNumber: true })} 
                        onChange={(e) => {
                          register(`items.${index}.received_quantity`, { valueAsNumber: true }).onChange(e);
                          setValue(`items.${index}.accepted_quantity`, Number(e.target.value));
                        }}
                        className="w-full p-2 rounded-md border bg-background text-sm" 
                      />
                      {errors.items?.[index]?.received_quantity && <p className="text-red-500 text-xs mt-1">{errors.items[index].received_quantity?.message}</p>}
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" step="0.01" {...register(`items.${index}.accepted_quantity`, { valueAsNumber: true })} className="w-full p-2 rounded-md border bg-background text-sm" />
                      {errors.items?.[index]?.accepted_quantity && <p className="text-red-500 text-xs mt-1">{errors.items[index].accepted_quantity?.message}</p>}
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" step="0.01" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} className="w-full p-2 rounded-md border bg-background text-sm" />
                      {errors.items?.[index]?.unit_price && <p className="text-red-500 text-xs mt-1">{errors.items[index].unit_price?.message}</p>}
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" {...register(`items.${index}.batch_number`)} placeholder="Optional" className="w-full p-2 rounded-md border bg-background text-sm" />
                    </td>
                    <td className="px-4 py-2 font-medium">
                      Rs. {((Number(watchItems[index]?.accepted_quantity) || 0) * (Number(watchItems[index]?.unit_price) || 0)).toLocaleString('en-LK', {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total GRN Value</p>
              <p className="text-2xl font-black text-foreground">Rs. {totalAmount.toLocaleString('en-LK', {minimumFractionDigits: 2})}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-xl border font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-sm disabled:opacity-50">
            <Save size={16} />
            {isSubmitting ? 'Saving...' : 'Save & Receive Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
