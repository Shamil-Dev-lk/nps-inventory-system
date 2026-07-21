'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function NewPurchaseRequestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      department_id: '',
      project_id: '',
      required_date: '',
      purpose: '',
      priority: 'normal',
      remarks: '',
      items: [{ item_id: '', quantity: 1, estimated_unit_price: 0, specification: '' }]
    }
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => api.get('/v1/departments').then(r => r.data.data) });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/v1/projects').then(r => r.data.data) });
  const { data: itemsList = [] } = useQuery({ queryKey: ['items'], queryFn: () => api.get('/v1/items?per_page=1000').then(r => r.data.data.data || []) });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/purchase-requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast.success('Purchase request created successfully');
      router.push('/dashboard/purchase/requests');
    },
    onError: () => toast.error('Failed to create purchase request'),
  });

  const onSubmit = (data: any) => {
    if (!data.items || data.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    // Format numeric values
    data.items = data.items.map((item: any) => ({
      ...item,
      quantity: parseFloat(item.quantity || 0),
      estimated_unit_price: parseFloat(item.estimated_unit_price || 0)
    }));
    
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/purchase/requests" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Purchase Request</h1>
          <p className="text-sm text-muted-foreground">Create a new PR for materials or services</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Request Details */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Request Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Department *</label>
              <select {...register('department_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select Department</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name_en}</option>)}
              </select>
              {errors.department_id && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Project (Optional)</label>
              <select {...register('project_id')} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select Project</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Required By Date</label>
              <input type="date" {...register('required_date')} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select {...register('priority')} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Purpose</label>
              <input {...register('purpose')} placeholder="Why is this purchase needed?" className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Requested Items</h2>
            <button 
              type="button" 
              onClick={() => append({ item_id: '', quantity: 1, estimated_unit_price: 0, specification: '' })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Item *</th>
                  <th className="px-4 py-3 font-medium w-48">Specification</th>
                  <th className="px-4 py-3 font-medium w-32">Qty *</th>
                  <th className="px-4 py-3 font-medium w-40">Est. Price (Rs)</th>
                  <th className="px-4 py-3 font-medium w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-4 py-3">
                      <select {...register(`items.${index}.item_id`, { required: true })} className="w-full px-2 py-1.5 border rounded-md bg-background">
                        <option value="">Select Item</option>
                        {itemsList.map((item: any) => <option key={item.id} value={item.id}>{item.item_code} - {item.name_en}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input {...register(`items.${index}.specification`)} placeholder="Details..." className="w-full px-2 py-1.5 border rounded-md bg-background" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.001" min="0.001" {...register(`items.${index}.quantity`, { required: true })} className="w-full px-2 py-1.5 border rounded-md bg-background" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" min="0" {...register(`items.${index}.estimated_unit_price`)} className="w-full px-2 py-1.5 border rounded-md bg-background" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        type="button" 
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <label className="text-sm font-medium">Additional Remarks</label>
          <textarea {...register('remarks')} rows={3} className="w-full px-3 py-2 mt-1 border rounded-lg"></textarea>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/purchase/requests" className="px-6 py-2 border rounded-lg hover:bg-muted font-medium transition-colors">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
            <Save size={18} />
            {createMutation.isPending ? 'Saving...' : 'Create Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
