'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function EditPurchaseRequestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: pr } = useQuery({ 
    queryKey: ['purchase_request', params.id], 
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_requests').select('*').eq('id', params.id).single();
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (pr) {
      reset({
        status: pr.status || 'draft',
        priority: pr.priority || 'medium',
        required_date: pr.required_date || '',
        purpose: pr.purpose || '',
        remarks: pr.remarks || '',
        approval_remarks: pr.approval_remarks || '',
      });
    }
  }, [pr, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: res, error } = await supabase.from('purchase_requests').update(data).eq('id', params.id).select().single();
      if (error) throw error;
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_requests'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_request', params.id] });
      toast.success('Purchase request updated successfully');
      router.push(`/dashboard/purchase/requests/${params.id}`);
    },
    onError: () => toast.error('Failed to update purchase request'),
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (!pr) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/purchase/requests/${params.id}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Purchase Request: {pr.pr_number}</h1>
          <p className="text-sm text-muted-foreground">Update request details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Request Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <select {...register('status')} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select {...register('priority')} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Required Date</label>
              <input type="date" {...register('required_date')} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Purpose</label>
              <textarea {...register('purpose')} rows={2} className="w-full px-3 py-2 mt-1 border rounded-lg"></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">General Remarks</label>
              <textarea {...register('remarks')} rows={3} className="w-full px-3 py-2 mt-1 border rounded-lg"></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Approval Remarks</label>
              <textarea {...register('approval_remarks')} rows={2} className="w-full px-3 py-2 mt-1 border rounded-lg"></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/purchase/requests/${params.id}`} className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</Link>
          <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} />
            {updateMutation.isPending ? 'Updating...' : 'Update Request'}
          </button>
        </div>
      </form>
    </div>
  );
}


