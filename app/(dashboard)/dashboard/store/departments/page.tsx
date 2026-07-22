'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Modal } from '@/components/ui/modal';
import { supabase } from '@/lib/supabase';

interface Department {
  id: number;
  code: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

type DepartmentFormData = Omit<Department, 'id' | 'created_at'>;

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepartmentFormData>();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Department[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      const { error } = await supabase.from('departments').insert([data]);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to create department'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; payload: DepartmentFormData }) => {
      const { error } = await supabase.from('departments').update(data.payload).eq('id', data.id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to update department'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully');
      setIsDeleteOpen(false);
      setDeletingDepartment(null);
    },
    onError: (err: any) => {
      if (err.code === '23503' || err.message?.includes('foreign key constraint')) {
        toast.error('Cannot delete this department because it is currently assigned to one or more records (e.g. issues or returns).');
      } else {
        toast.error('Failed to delete department');
      }
    },
  });

  const handleOpenForm = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      reset({
        code: department.code,
        name_en: department.name_en,
        name_si: department.name_si || '',
        name_ta: department.name_ta || '',
        description: department.description || '',
        is_active: department.is_active,
      });
    } else {
      setEditingDepartment(null);
      reset({
        code: '',
        name_en: '',
        name_si: '',
        name_ta: '',
        description: '',
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDepartment(null);
    reset();
  };

  const onSubmit = (data: DepartmentFormData) => {
    if (editingDepartment) updateMutation.mutate({ id: editingDepartment.id, payload: data });
    else createMutation.mutate(data);
  };

  const columns: Column<Department>[] = [
    { header: 'Code', accessor: 'code', className: 'font-medium' },
    { header: 'Name', accessor: 'name_en' },
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
        <h1 className="text-2xl font-bold text-foreground">Departments</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage internal organization departments</p>
      </div>

      <div className="flex-1">
        <DataTable
          data={departments}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          searchKey="name_en"
          searchPlaceholder="Search departments..."
          addButtonLabel="Add Department"
          onAdd={() => handleOpenForm()}
          onEdit={handleOpenForm}
          onDelete={(row) => { setDeletingDepartment(row); setIsDeleteOpen(true); }}
        />
      </div>

      <Modal isOpen={isFormOpen} onClose={handleCloseForm} title={editingDepartment ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Department Code *</label>
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
              {editingDepartment ? 'Update Department' : 'Save Department'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => deletingDepartment && deleteMutation.mutate(deletingDepartment.id)} isLoading={deleteMutation.isPending} title="Delete Department" description={`Are you sure you want to delete "${deletingDepartment?.name_en}"?`} />
    </div>
  );
}
