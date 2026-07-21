'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function EditAssetPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', params.id],
    queryFn: () => api.get(`/v1/assets/${params.id}`).then((r) => r.data?.data),
  });

  useEffect(() => {
    if (asset) reset(asset);
  }, [asset, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/v1/assets/${params.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset updated successfully');
      router.push('/dashboard/assets');
    },
    onError: () => toast.error('Failed to update asset'),
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground shimmer h-32 rounded-xl max-w-2xl mx-auto" />;
  if (!asset) return <div className="p-8 text-center text-red-500 font-bold">Asset not found</div>;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/assets" className="p-2 rounded-lg hover:bg-muted transition-colors border bg-card">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Asset</h1>
          <p className="text-sm text-muted-foreground">Update asset details</p>
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
          <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 shadow-sm">
            <Save size={16} />
            {updateMutation.isPending ? 'Saving...' : 'Update Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
