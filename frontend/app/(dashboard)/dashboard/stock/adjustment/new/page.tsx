'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, ScanLine, QrCode } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { BarcodeScannerModal } from '@/components/scanner/BarcodeScannerModal';

export default function NewStockAdjustmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      adjustment_type: 'addition',
      warehouse_id: '',
      item_id: '',
      quantity: '',
      unit_cost: '',
      reason: 'stock_taking',
      adjustment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      description: ''
    }
  });
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const selectedItemId = watch('item_id');

  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => api.get('/v1/warehouses').then(r => r.data.data) });
  const { data: itemsList = [] } = useQuery({ queryKey: ['items'], queryFn: () => api.get('/v1/items?per_page=1000').then(r => (r.data?.data?.data || r.data?.data || r.data || [])) });

  const handleBarcodeScan = (code: string) => {
    if (!code) return;
    const item = itemsList.find((i: any) => i.barcode === code || i.item_code === code);
    if (!item) {
      toast.error(`Item with barcode ${code} not found`);
      return;
    }
    
    setValue('item_id', item.id);
    setValue('unit_cost', item.average_cost || 0);
    toast.success(`Selected ${item.name_en}`);
    setBarcodeInput('');
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/stock/adjustments', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      toast.success('Stock adjustment created successfully');
      router.push(`/dashboard/stock/adjustment/${data.data.data.id}?print=true`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create stock adjustment');
    },
  });

  const onSubmit = (data: any) => {
    data.quantity = parseFloat(data.quantity || 0);
    data.unit_cost = parseFloat(data.unit_cost || 0);
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/stock/adjustment" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Stock Adjustment</h1>
          <p className="text-sm text-muted-foreground">Record stock additions or deductions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Adjustment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Adjustment Type *</label>
              <select {...register('adjustment_type', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg font-medium">
                <option value="addition">Addition (+)</option>
                <option value="deduction">Deduction (-)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Adjustment Date *</label>
              <input type="date" {...register('adjustment_date', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>

            <div>
              <label className="text-sm font-medium">Warehouse *</label>
              <select {...register('warehouse_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select Source Warehouse</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name_en}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Reason *</label>
              <select {...register('reason', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="stock_taking">Stock Taking Discrepancy</option>
                <option value="damage">Damage / Breakage</option>
                <option value="expired">Expired Stock</option>
                <option value="data_entry_error">Data Entry Error</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-semibold">Item Details</h2>
             <div className="flex max-w-sm items-center gap-2">
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
            <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleBarcodeScan} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Item *</label>
              <select {...register('item_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg bg-background">
                <option value="">Select Item</option>
                {itemsList.map((item: any) => <option key={item.id} value={item.id}>{item.item_code} - {item.name_en}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Quantity *</label>
              <input type="number" step="0.001" min="0.001" {...register('quantity', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>

            <div>
              <label className="text-sm font-medium">Unit Cost (LKR)</label>
              <input type="number" step="0.01" min="0" {...register('unit_cost')} className="w-full px-3 py-2 mt-1 border rounded-lg" placeholder="0.00" />
            </div>

            <div>
              <label className="text-sm font-medium">Reference Number</label>
              <input {...register('reference_number')} placeholder="e.g. Report ID" className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description / Remarks</label>
              <input {...register('description')} placeholder="Any additional details" className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/stock/adjustment" className="px-6 py-2 border rounded-lg hover:bg-muted font-medium transition-colors">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
            <Save size={18} />
            {createMutation.isPending ? 'Saving...' : 'Save Adjustment'}
          </button>
        </div>
      </form>
    </div>
  );
}
