'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewUserPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('roles').select('*');
      if (error) throw error;
      return { data: data || [] };
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) throw error;
      return { data: data || [] };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (userData: any) => {
      // Auto-generate employee ID
      const { data: latestUsers, error: fetchErr } = await supabase
        .from('users')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
        
      if (fetchErr) throw fetchErr;
      
      const nextId = (latestUsers?.[0]?.id || 0) + 1;
      userData.employee_id = `EMP-${nextId.toString().padStart(4, '0')}`;

      const { data, error } = await supabase.from('users').insert([userData]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      router.push('/dashboard/settings/users');
    },
    onError: (error: any) => {
        const message = error.message || 'Failed to create user. Check the fields.';
        toast.error(message);
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/settings/users" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New User / Employee</h1>
          <p className="text-sm text-muted-foreground">Create a new system user</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Name *</label>
              <input {...register('name', { required: true, minLength: 2, maxLength: 255 })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
              {errors.name && <span className="text-xs text-red-500">Name is required</span>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Email *</label>
              <input type="email" {...register('email', { required: true, pattern: /^\S+@\S+$/i })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
              {errors.email && <span className="text-xs text-red-500">Valid email is required</span>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Password *</label>
              <input type="password" {...register('password', { required: true, minLength: 8 })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
              {errors.password && <span className="text-xs text-red-500">Password is required (min 8 chars)</span>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Role *</label>
              <select {...register('role', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none">
                <option value="">Select Role</option>
                {rolesData?.data?.map((role: any) => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
              {errors.role && <span className="text-xs text-red-500">Role is required</span>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Job Position / Designation</label>
              <input {...register('designation')} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Department</label>
              <select {...register('department_id')} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none">
                <option value="">Select Department</option>
                {departmentsData?.data?.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name_en}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Phone</label>
              <input {...register('phone')} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Joining Date</label>
              <input type="date" {...register('joining_date')} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Address</label>
              <textarea {...register('address')} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary/30 outline-none" rows={2} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} />
            {createMutation.isPending ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </form>
    </div>
  );
}
