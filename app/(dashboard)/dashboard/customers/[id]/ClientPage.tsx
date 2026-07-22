'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', params.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').eq('id', params.id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (customer) reset(customer);
  }, [customer, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, created_at, updated_at, ...updateData } = data;
      const { data: result, error } = await supabase.from('customers').update(updateData).eq('id', params.id).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
      router.push('/dashboard/customers');
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to update customer'),
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground shimmer h-32 rounded-xl max-w-2xl mx-auto" />;
  if (!customer) return <div className="p-8 text-center text-red-500 font-bold">Customer not found</div>;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/customers" className="p-2 rounded-lg hover:bg-muted transition-colors border bg-card">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Customer</h1>
          <p className="text-sm text-muted-foreground">Update customer details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input {...register('name', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
              {errors.name && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input type="email" {...register('email')} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input {...register('phone')} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">ID Number / NIC</label>
              <input {...register('nic')} placeholder="e.g. 123456789V" className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Job Role / Designation</label>
              <input {...register('designation')} placeholder="e.g. Technician" className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <textarea {...register('address')} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" rows={3} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/customers" className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</Link>
          <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 shadow-sm">
            <Save size={16} />
            {updateMutation.isPending ? 'Saving...' : 'Update Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}


