'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save, ScanLine, QrCode } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { BarcodeScannerModal } from '@/components/scanner/BarcodeScannerModal';

export default function NewStockTransferPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      transfer_type: 'warehouse_to_warehouse',
      from_warehouse_id: '',
      to_warehouse_id: '',
      from_department_id: '',
      to_department_id: '',
      transfer_date: new Date().toISOString().split('T')[0],
      reason: '',
      remarks: '',
      items: [{ item_id: '', quantity: 1 }]
    }
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');

  const transferType = watch('transfer_type');

  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => api.get('/v1/departments').then(r => r.data.data) });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => api.get('/v1/warehouses').then(r => r.data.data) });
  const { data: itemsList = [] } = useQuery({ queryKey: ['items'], queryFn: () => api.get('/v1/items?per_page=1000').then(r => (r.data?.data?.data || r.data?.data || r.data || [])) });

  const handleBarcodeScan = (code: string) => {
    if (!code) return;
    const item = itemsList.find((i: any) => i.barcode === code || i.item_code === code);
    if (!item) {
      toast.error(`Item with barcode ${code} not found`);
      return;
    }

    const currentItems = watch('items');
    const existingIndex = currentItems.findIndex((i: any) => i.item_id == item.id);
    
    if (existingIndex >= 0) {
      const currentQty = parseFloat(currentItems[existingIndex].quantity || 0);
      // @ts-ignore
      setValue(`items.${existingIndex}.quantity`, currentQty + 1);
      toast.success(`Incremented quantity for ${item.name_en}`);
    } else {
      if (currentItems.length === 1 && !currentItems[0].item_id) {
        remove(0);
      }
      append({ item_id: item.id, quantity: 1 });
      toast.success(`Added ${item.name_en}`);
    }
    setBarcodeInput('');
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/stock/transfers', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      toast.success('Stock transfer created successfully');
      router.push(`/dashboard/stock/transfer/${data.data.data.id}?print=true`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create stock transfer');
    },
  });

  const onSubmit = (data: any) => {
    if (!data.items || data.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    data.items = data.items.map((item: any) => ({
      ...item,
      quantity: parseFloat(item.quantity || 0),
    }));

    // Cleanup unnecessary fields based on transfer type
    if (data.transfer_type === 'warehouse_to_warehouse') {
      data.from_department_id = null;
      data.to_department_id = null;
    } else if (data.transfer_type === 'department_to_warehouse') {
      data.from_warehouse_id = null;
      data.to_department_id = null;
    }
    
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/stock/transfer" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Stock Transfer</h1>
          <p className="text-sm text-muted-foreground">Transfer stock between locations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Transfer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Transfer Type *</label>
              <select {...register('transfer_type', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="warehouse_to_warehouse">Warehouse to Warehouse</option>
                <option value="department_to_warehouse">Department to Warehouse</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Transfer Date *</label>
              <input type="date" {...register('transfer_date', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>

            {transferType === 'warehouse_to_warehouse' ? (
              <>
                <div>
                  <label className="text-sm font-medium">From Warehouse *</label>
                  <select {...register('from_warehouse_id', { required: transferType === 'warehouse_to_warehouse' })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                    <option value="">Select Source Warehouse</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name_en}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">To Warehouse *</label>
                  <select {...register('to_warehouse_id', { required: transferType === 'warehouse_to_warehouse' })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                    <option value="">Select Destination Warehouse</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name_en}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium">From Department *</label>
                  <select {...register('from_department_id', { required: transferType === 'department_to_warehouse' })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                    <option value="">Select Source Department</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name_en}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">To Warehouse *</label>
                  <select {...register('to_warehouse_id', { required: transferType === 'department_to_warehouse' })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                    <option value="">Select Destination Warehouse</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name_en}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium">Reason</label>
              <input {...register('reason')} placeholder="e.g., Relocation, Surplus" className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>

            <div>
              <label className="text-sm font-medium">Remarks</label>
              <input {...register('remarks')} placeholder="Any additional notes" className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-lg font-semibold shrink-0">Items to Transfer</h2>
            
            <div className="flex flex-1 max-w-md items-center gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Scan barcode..." 
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeScan(barcodeInput);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-1.5 border rounded-md text-sm"
                />
                <ScanLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <button type="button" onClick={() => setIsScannerOpen(true)} className="p-1.5 border rounded-md bg-background hover:bg-muted text-muted-foreground transition-colors">
                <QrCode size={18} />
              </button>
            </div>

            <button type="button" onClick={() => append({ item_id: '', quantity: 1 })} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors shrink-0">
              <Plus size={16} /> Add Item
            </button>
          </div>
          
          <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleBarcodeScan} />
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Item *</th>
                  <th className="px-4 py-3 font-medium w-48">Quantity *</th>
                  <th className="px-4 py-3 font-medium w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-4 py-3">
                      <select {...register(`items.${index}.item_id`, { required: true })} className="w-full px-2 py-1.5 border rounded-md bg-background">
                        <option value="">Select Item</option>
                        {itemsList.map((item: any) => <option key={item.id} value={item.id}>{item.item_code} - {item.name_en}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top pt-3">
                      <input type="number" step="0.001" min="0.001" {...register(`items.${index}.quantity`, { required: true })} className="w-full px-2 py-1.5 border rounded-md bg-background" />
                    </td>
                    <td className="px-4 py-3 text-center align-top pt-3">
                      <button type="button" onClick={() => remove(index)} disabled={fields.length === 1} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30 mt-1">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/stock/transfer" className="px-6 py-2 border rounded-lg hover:bg-muted font-medium transition-colors">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
            <Save size={18} />
            {createMutation.isPending ? 'Saving...' : 'Save Transfer'}
          </button>
        </div>
      </form>
    </div>
  );
}
