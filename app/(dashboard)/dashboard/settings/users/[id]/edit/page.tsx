'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', params.id],
    queryFn: () => api.get(`/v1/users/${params.id}`).then(r => r.data.data),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/v1/roles').then(r => r.data),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/v1/departments').then(r => r.data),
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.roles?.[0] || '',
        designation: user.designation || '',
        department_id: user.department_id || '',
        phone: user.phone || '',
        address: user.address || '',
        joining_date: user.joining_date ? user.joining_date.split('T')[0] : '',
      });
    }
  }, [user, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/v1/users/${params.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user', params.id] });
      toast.success('User updated successfully');
      router.push('/dashboard/settings/users');
    },
    onError: (error: any) => {
        const message = error.response?.data?.message || 'Failed to update user.';
        toast.error(message);
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading user data...</div>;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/settings/users" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit User / Employee</h1>
          <p className="text-sm text-muted-foreground">Update system user details</p>
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
          <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function generateStaticParams() { return []; }
