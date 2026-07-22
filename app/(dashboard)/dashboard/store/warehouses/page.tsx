'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Modal } from '@/components/ui/modal';
import { supabase } from '@/lib/supabase';

interface Warehouse {
  id: number;
  code: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  address?: string;
  telephone?: string;
  capacity?: number;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
}

type WarehouseFormData = Omit<Warehouse, 'id' | 'created_at'>;

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WarehouseFormData>();

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Warehouse[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: WarehouseFormData) => {
      const { error } = await supabase.from('warehouses').insert([data]);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse created successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to create warehouse'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; payload: WarehouseFormData }) => {
      const { error } = await supabase.from('warehouses').update(data.payload).eq('id', data.id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse updated successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to update warehouse'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('warehouses').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse deleted successfully');
      setIsDeleteOpen(false);
      setDeletingWarehouse(null);
    },
    onError: () => toast.error('Failed to delete warehouse'),
  });

  const handleOpenForm = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      reset({
        code: warehouse.code,
        name_en: warehouse.name_en,
        name_si: warehouse.name_si || '',
        name_ta: warehouse.name_ta || '',
        address: warehouse.address || '',
        telephone: warehouse.telephone || '',
        capacity: warehouse.capacity,
        is_main: warehouse.is_main,
        is_active: warehouse.is_active,
      });
    } else {
      setEditingWarehouse(null);
      reset({
        code: '',
        name_en: '',
        name_si: '',
        name_ta: '',
        address: '',
        telephone: '',
        capacity: 0,
        is_main: false,
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWarehouse(null);
    reset();
  };

  const onSubmit = (data: WarehouseFormData) => {
    if (editingWarehouse) updateMutation.mutate({ id: editingWarehouse.id, payload: data });
    else createMutation.mutate(data);
  };

  const columns: Column<Warehouse>[] = [
    { header: 'Code', accessor: 'code', className: 'font-medium' },
    { header: 'Name', accessor: 'name_en' },
    { header: 'Telephone', accessor: 'telephone' },
    { 
      header: 'Type', 
      accessor: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
          row.is_main ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {row.is_main ? 'Main Store' : 'Sub Store'}
        </span>
      ),
    },
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
        <h1 className="text-2xl font-bold text-foreground">Warehouses</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage physical storage locations and stores</p>
      </div>

      <div className="flex-1">
        <DataTable
          data={warehouses}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          searchKey="name_en"
          searchPlaceholder="Search warehouses..."
          addButtonLabel="Add Warehouse"
          onAdd={() => handleOpenForm()}
          onEdit={handleOpenForm}
          onDelete={(row) => { setDeletingWarehouse(row); setIsDeleteOpen(true); }}
        />
      </div>

      <Modal isOpen={isFormOpen} onClose={handleCloseForm} title={editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Warehouse Code *</label>
              <input {...register('code', { required: 'Required' })} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (English) *</label>
              <input {...register('name_en', { required: 'Required' })} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
              {errors.name_en && <p className="text-xs text-red-500">{errors.name_en.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (Sinhala)</label>
              <input {...register('name_si')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (Tamil)</label>
              <input {...register('name_ta')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Address</label>
              <input {...register('address')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Telephone</label>
              <input {...register('telephone')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Capacity (Optional)</label>
              <input type="number" step="0.01" {...register('capacity')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_main" {...register('is_main')} className="rounded border-input text-primary focus:ring-primary/30" />
              <label htmlFor="is_main" className="text-sm font-medium cursor-pointer">Is Main Store?</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" {...register('is_active')} className="rounded border-input text-primary focus:ring-primary/30" />
              <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Active</label>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={handleCloseForm} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {editingWarehouse ? 'Update Warehouse' : 'Save Warehouse'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => deletingWarehouse && deleteMutation.mutate(deletingWarehouse.id)} isLoading={deleteMutation.isPending} title="Delete Warehouse" description={`Are you sure you want to delete "${deletingWarehouse?.name_en}"?`} />
    </div>
  );
}
