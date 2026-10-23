'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Plus, Trash2, Package, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const grnEditSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  received_date: z.string().min(1, 'Date is required'),
  invoice_number: z.string().optional(),
  status: z.enum(['draft', 'approved', 'rejected']),
  remarks: z.string().optional(),
  items: z.array(
    z.object({
      item_id: z.string().min(1, 'Item is required'),
      received_quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
      accepted_quantity: z.number().min(0, 'Quantity cannot be negative'),
      unit_price: z.number().min(0, 'Price cannot be negative'),
      batch_number: z.string().optional(),
      expiry_date: z.string().optional(),
    })
  ).min(1, 'At least one item is required'),
});

type GRNEditFormValues = z.infer<typeof grnEditSchema>;

export default function EditGrnClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const qc = useQueryClient();

  const { user, hasSuperAdmin, hasPermission } = useAuthStore();
  const isAdmin = hasSuperAdmin() || 
    user?.roles?.some((r: string) => r.toLowerCase().includes('admin')) || 
    user?.designation?.toLowerCase().includes('admin') ||
    user?.email?.toLowerCase().includes('admin') ||
    hasPermission('delete-all') || 
    hasPermission('manage-inventory');

  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: number; name_en: string }[]>([]);
  const [itemsList, setItemsList] = useState<{ id: number; name_en: string; item_code?: string; code?: string; purchase_price: number; current_quantity?: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<GRNEditFormValues>({
    resolver: zodResolver(grnEditSchema),
    defaultValues: {
      supplier_id: '',
      warehouse_id: '',
      received_date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      status: 'draft',
      remarks: '',
      items: [{ item_id: '', received_quantity: 1, accepted_quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Fetch GRN record
  const { data: grn, isLoading: isLoadingGrn } = useQuery({
    queryKey: ['grn', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('grns')
        .select('*, supplier:suppliers(*), warehouse:warehouses(*), items:grn_items(*, item:items(*))')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch dropdown lookups
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [supRes, whRes, itemRes] = await Promise.all([
          supabase.from('suppliers').select('*').order('company_name', { ascending: true }),
          supabase.from('warehouses').select('*').order('name_en', { ascending: true }),
          supabase.from('items').select('*').order('name_en', { ascending: true }),
        ]);

        if (supRes.data) setSuppliers(supRes.data.map((s: any) => ({ id: s.id, name: s.company_name || s.name || `Supplier #${s.id}` })));
        if (whRes.data) setWarehouses(whRes.data);
        if (itemRes.data) setItemsList(itemRes.data);
      } catch (err) {
        console.error('Error fetching lookups:', err);
      }
    };
    fetchLookups();
  }, []);

  // Populate form with existing GRN data
  useEffect(() => {
    if (grn) {
      reset({
        supplier_id: grn.supplier_id ? String(grn.supplier_id) : '',
        warehouse_id: grn.warehouse_id ? String(grn.warehouse_id) : '',
        received_date: grn.received_date ? grn.received_date.split('T')[0] : new Date().toISOString().split('T')[0],
        invoice_number: grn.invoice_number || '',
        status: (grn.status as 'draft' | 'approved' | 'rejected') || 'draft',
        remarks: grn.remarks || grn.notes || '',
        items: grn.items && grn.items.length > 0 ? grn.items.map((i: any) => ({
          item_id: String(i.item_id || ''),
          received_quantity: Number(i.received_quantity ?? i.accepted_quantity ?? 1),
          accepted_quantity: Number(i.accepted_quantity ?? i.received_quantity ?? 1),
          unit_price: Number(i.unit_price || 0),
          batch_number: i.batch_number || '',
          expiry_date: i.expiry_date || '',
        })) : [{ item_id: '', received_quantity: 1, accepted_quantity: 1, unit_price: 0 }],
      });
    }
  }, [grn, reset]);

  const handleItemChange = (index: number, itemId: string) => {
    const item = itemsList.find(i => String(i.id) === String(itemId));
    if (item) {
      setValue(`items.${index}.unit_price`, Number(item.purchase_price || 0));
    }
  };

  const watchItems = watch('items') || [];
  const totalAmount = watchItems.reduce((sum, item) => sum + (Number(item?.accepted_quantity) || 0) * (Number(item?.unit_price) || 0), 0);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-sm">
          Editing Goods Received Notes is restricted to Administrators only. Please contact your system administrator if you require access.
        </p>
        <Link
          href="/dashboard/stock/grn"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90"
        >
          <ArrowLeft size={16} /> Return to GRN List
        </Link>
      </div>
    );
  }

  if (isLoadingGrn) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading GRN information...</div>;
  }

  if (!grn) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">GRN Not Found</h2>
        <p className="text-muted-foreground text-sm">The requested Goods Received Note record could not be loaded.</p>
        <Link href="/dashboard/stock/grn" className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted text-sm">
          <ArrowLeft size={16} /> Back to GRN List
        </Link>
      </div>
    );
  }

  const grnNumber = grn.grn_number || (`GRN-${String(grn.id).padStart(5, '0')}`);

  const onSubmit = async (data: GRNEditFormValues) => {
    try {
      setIsSubmitting(true);
      const totalVal = data.items.reduce((sum, item) => sum + (Number(item.accepted_quantity) || 0) * (Number(item.unit_price) || 0), 0);
      const sId = data.supplier_id ? parseInt(String(data.supplier_id)) || null : null;
      const wId = data.warehouse_id ? parseInt(String(data.warehouse_id)) || null : null;

      // 1. Update GRN master record
      const { error: grnErr } = await supabase.from('grns').update({
        supplier_id: sId,
        warehouse_id: wId,
        received_date: data.received_date,
        invoice_number: data.invoice_number || null,
        remarks: data.remarks || null,
        status: data.status,
        total_amount: totalVal,
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      if (grnErr) throw grnErr;

      // 2. Re-synchronize child grn_items
      await supabase.from('grn_items').delete().eq('grn_id', id);

      if (data.items?.length) {
        const grnItems = data.items.map(item => ({
          grn_id: Number(id),
          item_id: parseInt(String(item.item_id)),
          ordered_quantity: Number(item.received_quantity) || 0,
          received_quantity: Number(item.received_quantity) || 0,
          accepted_quantity: Number(item.accepted_quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          total_price: (Number(item.accepted_quantity) || 0) * (Number(item.unit_price) || 0),
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null,
        }));

        const { error: itemsErr } = await supabase.from('grn_items').insert(grnItems);
        if (itemsErr) throw itemsErr;
      }

      // 3. If status set to 'approved', automatically update stock quantities
      if (data.status === 'approved') {
        for (const item of data.items) {
          const acceptedQty = Number(item.accepted_quantity ?? item.received_quantity ?? 0);
          const itmId = parseInt(String(item.item_id));
          if (!itmId || acceptedQty <= 0) continue;

          // Update items current_quantity
          const { data: itemData } = await supabase.from('items').select('current_quantity').eq('id', itmId).single();
          if (itemData) {
            await supabase.from('items').update({
              current_quantity: Number(itemData.current_quantity || 0) + acceptedQty,
              ...(item.unit_price ? { purchase_price: Number(item.unit_price) } : {}),
            }).eq('id', itmId);
          }

          // Update stock table for warehouse
          if (wId) {
            const { data: stockData } = await supabase.from('stock').select('id, quantity').eq('item_id', itmId).eq('warehouse_id', wId).maybeSingle();
            if (stockData) {
              await supabase.from('stock').update({
                quantity: Number(stockData.quantity || 0) + acceptedQty,
                ...(item.unit_price ? { unit_price: Number(item.unit_price) } : {}),
                ...(item.batch_number ? { batch_number: item.batch_number } : {}),
              }).eq('id', stockData.id);
            } else {
              await supabase.from('stock').insert([{
                item_id: itmId,
                warehouse_id: wId,
                quantity: acceptedQty,
                unit_price: Number(item.unit_price || 0),
                batch_number: item.batch_number || null,
              }]);
            }
          }
        }
      }

      toast.success('Goods Received Note updated successfully');
      qc.invalidateQueries({ queryKey: ['grn'] });
      qc.invalidateQueries({ queryKey: ['grn', id] });
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      qc.invalidateQueries({ queryKey: ['report-grn'] });

      router.push(`/dashboard/stock/grn/view/?id=${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update GRN');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/stock/grn/view/?id=${id}`} className="p-2 rounded-lg hover:bg-muted border bg-card transition-colors" title="Back">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Edit GRN: {grnNumber}</h1>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
              Admin Mode
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Modify delivery quantities, supplier, warehouse, or approval status</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">GRN Header Information</h2>
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
            <div>
              <label className="block text-sm font-medium mb-1">Invoice / Reference No.</label>
              <input type="text" {...register('invoice_number')} placeholder="e.g. INV-2026-001" className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status *</label>
              <select {...register('status')} className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 text-sm font-medium">
                <option value="draft">Draft (Pending Approval)</option>
                <option value="approved">Approved (Increments Inventory)</option>
                <option value="rejected">Rejected</option>
              </select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Remarks & Notes</label>
              <input type="text" {...register('remarks')} placeholder="Remarks or inspection notes..." className="w-full p-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/50 text-sm" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package size={18} className="text-primary" /> Received Items
            </h2>
            <button
              type="button"
              onClick={() => append({ item_id: '', received_quantity: 1, accepted_quantity: 1, unit_price: 0 })}
              className="text-sm flex items-center gap-1 text-primary hover:underline font-medium"
            >
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
                  <th className="px-4 py-3 w-[15%]">Unit Cost (Rs.) *</th>
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
                        {itemsList.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.item_code || i.code ? `${i.item_code || i.code} - ` : ''}{i.name_en} (Stock: {i.current_quantity ?? 0})
                          </option>
                        ))}
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
                      Rs. {((Number(watchItems[index]?.accepted_quantity) || 0) * (Number(watchItems[index]?.unit_price) || 0)).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
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
              <p className="text-2xl font-black text-foreground">Rs. {totalAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-xl border font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-sm disabled:opacity-50">
            <Save size={16} />
            {isSubmitting ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
