'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function NewAssetPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/assets', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset created successfully');
      router.push('/dashboard/assets');
    },
    onError: () => toast.error('Failed to create asset'),
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/assets" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Asset</h1>
          <p className="text-sm text-muted-foreground">Create a new company asset</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium">Asset Code *</label>
              <input {...register('asset_code', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
              {errors.asset_code && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input {...register('name', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
              {errors.name && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select {...register('status')} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/assets" className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} />
            {createMutation.isPending ? 'Saving...' : 'Save Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
