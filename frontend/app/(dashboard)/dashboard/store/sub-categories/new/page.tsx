'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function NewSubCategoryPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { data: categories = [] } = useQuery({ 
    queryKey: ['categories'], 
    queryFn: () => api.get('/v1/categories').then(r => r.data?.data || []) 
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/sub-categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-categories'] });
      toast.success('Sub-category created successfully');
      router.push('/dashboard/store/sub-categories');
    },
    onError: () => toast.error('Failed to create sub-category'),
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/store/sub-categories" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Sub-Category</h1>
          <p className="text-sm text-muted-foreground">Create a new item sub-category</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium">Name (English) *</label>
              <input {...register('name_en', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
              {errors.name_en && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Category *</label>
              <select {...register('category_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none">
                <option value="">Select Category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name_en}</option>
                ))}
              </select>
              {errors.category_id && <span className="text-xs text-red-500">Required</span>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/store/sub-categories" className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} />
            {createMutation.isPending ? 'Saving...' : 'Save Sub-Category'}
          </button>
        </div>
      </form>
    </div>
  );
}
