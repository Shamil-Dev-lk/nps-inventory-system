'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Modal } from '@/components/ui/modal';
import { supabase } from '@/lib/supabase';

interface Brand {
  id: number;
  code: string;
  name: string;
  country?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

type BrandFormData = Omit<Brand, 'id' | 'created_at'>;

export default function BrandsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BrandFormData>();

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Brand[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BrandFormData) => {
      const { error } = await supabase.from('brands').insert([data]);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand created successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to create brand'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; payload: BrandFormData }) => {
      const { error } = await supabase.from('brands').update(data.payload).eq('id', data.id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand updated successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to update brand'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('brands').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deleted successfully');
      setIsDeleteOpen(false);
      setDeletingBrand(null);
    },
    onError: () => toast.error('Failed to delete brand'),
  });

  const handleOpenForm = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      reset({
        code: brand.code,
        name: brand.name,
        country: brand.country || '',
        description: brand.description || '',
        is_active: brand.is_active,
      });
    } else {
      setEditingBrand(null);
      reset({
        code: '',
        name: '',
        country: '',
        description: '',
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBrand(null);
    reset();
  };

  const onSubmit = (data: BrandFormData) => {
    if (editingBrand) updateMutation.mutate({ id: editingBrand.id, payload: data });
    else createMutation.mutate(data);
  };

  const columns: Column<Brand>[] = [
    { header: 'Code', accessor: 'code', className: 'font-medium' },
    { header: 'Name', accessor: 'name' },
    { header: 'Country', accessor: 'country' },
    { 
      header: 'Status', 
      accessor: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
          row.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full h-[calc(100vh-100px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Brands</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage item brands and manufacturers</p>
      </div>

      <div className="flex-1">
        <DataTable
          data={brands}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          searchKey="name"
          searchPlaceholder="Search brands..."
          addButtonLabel="Add Brand"
          onAdd={() => handleOpenForm()}
          onEdit={handleOpenForm}
          onDelete={(row) => { setDeletingBrand(row); setIsDeleteOpen(true); }}
        />
      </div>

      <Modal isOpen={isFormOpen} onClose={handleCloseForm} title={editingBrand ? 'Edit Brand' : 'Add Brand'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Brand Code *</label>
              <input {...register('code', { required: 'Required' })} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Brand Name *</label>
              <input {...register('name', { required: 'Required' })} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Country of Origin</label>
            <input {...register('country')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea {...register('description')} rows={3} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register('is_active')} className="rounded border-input text-primary focus:ring-primary/30" />
            <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Active</label>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={handleCloseForm} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {editingBrand ? 'Update Brand' : 'Save Brand'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => deletingBrand && deleteMutation.mutate(deletingBrand.id)} isLoading={deleteMutation.isPending} title="Delete Brand" description={`Are you sure you want to delete "${deletingBrand?.name}"?`} />
    </div>
  );
}
