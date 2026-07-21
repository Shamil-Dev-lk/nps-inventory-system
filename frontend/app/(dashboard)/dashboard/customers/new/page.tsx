'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function NewCustomerPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/customers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
      router.push('/dashboard/customers');
    },
    onError: (error: any) => {
        const message = error.response?.data?.message || 'Failed to create customer. This customer might already exist.';
        toast.error(message);
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/customers" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Customer</h1>
          <p className="text-sm text-muted-foreground">Create a new customer record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input {...register('name', { required: true, minLength: 2, maxLength: 255 })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
              {errors.name && <span className="text-xs text-red-500">Name is required (min 2 characters)</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input type="email" {...register('email', { pattern: /^\S+@\S+$/i })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
              {errors.email && <span className="text-xs text-red-500">Invalid email address</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input {...register('phone', { pattern: /^\+?[0-9\s\-]+$/i })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
              {errors.phone && <span className="text-xs text-red-500">Invalid phone number</span>}
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
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} />
            {createMutation.isPending ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
