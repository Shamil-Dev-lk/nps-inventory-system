'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, CheckCircle, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function StockTakingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, control, handleSubmit, reset } = useForm<any>({
    defaultValues: { items: [] }
  });
  
  const { fields } = useFieldArray({ control, name: 'items' });

  const { data, isLoading } = useQuery({
    queryKey: ['stock-taking', params.id],
    queryFn: async () => {
      const { data: st, error } = await supabase
        .from('stock_takings')
        .select(`
          *,
          warehouse:warehouses(id, name_en),
          items:stock_taking_items(*, item:items(*))
        `)
        .eq('id', params.id)
        .single();
      if (error) throw error;
      reset({ items: st.items || [] });
      return st;
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (formData.items && formData.items.length > 0) {
        for (const item of formData.items) {
          const { error: itemErr } = await supabase
            .from('stock_taking_items')
            .update({
              physical_quantity: parseFloat(item.physical_quantity || 0),
              variance_reason: item.variance_reason || null,
            })
            .eq('id', item.id);
          if (itemErr) throw itemErr;
        }
      }
      const { error } = await supabase
        .from('stock_takings')
        .update({ status: 'completed' })
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-taking'] });
      toast.success('Stock taking completed and adjusted successfully');
      router.push('/dashboard/stock/taking');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to complete session'),
  });

  const onSubmit = (formData: any) => {
    formData.items = formData.items.map((i: any) => ({
      ...i,
      physical_quantity: parseFloat(i.physical_quantity || 0)
    }));
    completeMutation.mutate(formData);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading snapshot...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Session not found</div>;

  return (
    <div className="max-w-[1600px] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stock/taking" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Physical Count: {data.st_number}</h1>
            <p className="text-sm text-muted-foreground">{data.title} • {data.warehouse?.name_en}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.open(`/dashboard/receipts/print?type=stock-taking&id=${data.id}&action=download`, '_blank')} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors">
            <Download size={16} /> Download PDF
          </button>
          <button type="button" onClick={() => window.open(`/dashboard/receipts/print?type=stock-taking&id=${data.id}`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th className="text-right">System Qty</th>
                  <th className="w-40 text-center">Physical Count</th>
                  <th className="w-48">Variance Reason</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field: any, index: number) => {
                  const sysQty = Number(field.system_quantity || 0);
                  return (
                    <tr key={field.id}>
                      <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{field.item?.item_code}</code></td>
                      <td className="font-medium text-sm">{field.item?.name_en}</td>
                      <td className="text-right text-sm text-muted-foreground">{sysQty}</td>
                      <td className="px-2">
                        <input 
                          type="number" 
                          step="0.001" 
                          min="0"
                          disabled={data.status !== 'draft' && data.status !== 'in_progress'}
                          {...register(`items.${index}.physical_quantity`, { required: true })} 
                          className="w-full px-2 py-1.5 border rounded-md text-center bg-background" 
                        />
                      </td>
                      <td className="px-2">
                        <input 
                          disabled={data.status !== 'draft' && data.status !== 'in_progress'}
                          {...register(`items.${index}.variance_reason`)} 
                          placeholder="If variance..." 
                          className="w-full px-2 py-1.5 border rounded-md bg-background text-sm" 
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {fields.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No items found in this warehouse at the time of snapshot.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/stock/taking" className="px-6 py-2 border rounded-lg hover:bg-muted font-medium transition-colors">Cancel</Link>
          {(data.status === 'draft' || data.status === 'in_progress') && (
            <button type="submit" disabled={completeMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
              <CheckCircle size={18} />
              {completeMutation.isPending ? 'Processing...' : 'Complete Count'}
            </button>
          )}
          {data.status === 'completed' && (
            <button 
              type="button" 
              onClick={async () => {
                const toastId = toast.loading('Approving and adjusting stock...');
                try {
                  const { error } = await supabase
                    .from('stock_takings')
                    .update({ status: 'approved' })
                    .eq('id', params.id);
                  if (error) throw error;
                  toast.success('Stock levels adjusted successfully', { id: toastId });
                  queryClient.invalidateQueries({ queryKey: ['stock-taking'] });
                } catch (err: any) {
                  toast.error(err.message || 'Failed to approve', { id: toastId });
                }
              }} 
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <CheckCircle size={18} />
              Approve & Adjust Stock
            </button>
          )}
        </div>
      </form>
    </div>
  );
}


