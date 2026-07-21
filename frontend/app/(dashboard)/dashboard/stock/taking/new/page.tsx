'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function NewStockTakingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      warehouse_id: '',
      count_date: new Date().toISOString().split('T')[0],
      remarks: '',
    }
  });

  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => api.get('/v1/warehouses').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/stock/taking', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['stock-taking'] });
      toast.success('Stock taking session created successfully');
      router.push(`/dashboard/stock/taking/${res.data.data.id}?print=true`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create session'),
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/stock/taking" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Stock Taking Session</h1>
          <p className="text-sm text-muted-foreground">Start a physical count for a warehouse</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Session Title *</label>
              <input {...register('title', { required: true })} placeholder="e.g., Annual Inventory Count 2024" className="w-full px-3 py-2 mt-1 border rounded-lg" />
              {errors.title && <span className="text-xs text-red-500">Required</span>}
            </div>
            
            <div>
              <label className="text-sm font-medium">Warehouse to Count *</label>
              <select {...register('warehouse_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select Warehouse</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name_en}</option>)}
              </select>
              {errors.warehouse_id && <span className="text-xs text-red-500">Required</span>}
              <p className="text-xs text-muted-foreground mt-1">
                All items currently in this warehouse will be snapshotted for counting.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Count Date *</label>
              <input type="date" {...register('count_date', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg" />
              {errors.count_date && <span className="text-xs text-red-500">Required</span>}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Remarks</label>
              <textarea {...register('remarks')} rows={3} className="w-full px-3 py-2 mt-1 border rounded-lg"></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/stock/taking" className="px-6 py-2 border rounded-lg hover:bg-muted font-medium transition-colors">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
            <Save size={18} />
            {createMutation.isPending ? 'Creating Snapshot...' : 'Start Counting'}
          </button>
        </div>
      </form>
    </div>
  );
}
