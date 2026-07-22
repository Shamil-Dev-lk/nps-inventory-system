'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function EditSubCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: categories = [] } = useQuery({ 
    queryKey: ['categories'], 
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: subCategory, isLoading } = useQuery({
    queryKey: ['sub-category', params.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('sub_categories').select('*').eq('id', params.id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (subCategory) reset(subCategory);
  }, [subCategory, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('sub_categories').update(data).eq('id', params.id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-categories'] });
      toast.success('Sub-category updated successfully');
      router.push('/dashboard/store/sub-categories');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update sub-category'),
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground shimmer h-32 rounded-xl max-w-2xl mx-auto" />;
  if (!subCategory) return <div className="p-8 text-center text-red-500 font-bold">Sub-Category not found</div>;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/store/sub-categories" className="p-2 rounded-lg hover:bg-muted transition-colors border bg-card">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Sub-Category</h1>
          <p className="text-sm text-muted-foreground">Update sub-category details</p>
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
          <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 shadow-sm">
            <Save size={16} />
            {updateMutation.isPending ? 'Saving...' : 'Update Sub-Category'}
          </button>
        </div>
      </form>
    </div>
  );
}


