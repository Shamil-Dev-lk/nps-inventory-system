'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Modal } from '@/components/ui/modal';
import { supabase } from '@/lib/supabase';

// Types
interface Category {
  id: number;
  code: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

type CategoryFormData = Omit<Category, 'id' | 'created_at'>;

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>();

  // Fetch data
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Category[];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const { error } = await supabase.from('categories').insert([data]);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; payload: CategoryFormData }) => {
      const { error } = await supabase.from('categories').update(data.payload).eq('id', data.id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
      setIsDeleteOpen(false);
      setDeletingCategory(null);
    },
    onError: () => toast.error('Failed to delete category'),
  });

  // Handlers
  const handleOpenForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      reset({
        code: category.code,
        name_en: category.name_en,
        name_si: category.name_si || '',
        name_ta: category.name_ta || '',
        description: category.description || '',
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
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
    setEditingCategory(null);
    reset();
  };

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, payload: data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Columns
  const columns: Column<Category>[] = [
    { header: 'Code', accessor: 'code', className: 'font-medium' },
    { header: 'Name (English)', accessor: 'name_en' },
    { header: 'Name (Sinhala)', accessor: 'name_si' },
    { header: 'Name (Tamil)', accessor: 'name_ta' },
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
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage item categories for inventory classification</p>
      </div>

      <div className="flex-1">
        <DataTable
          data={categories}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          searchKey="name_en"
          searchPlaceholder="Search categories..."
          addButtonLabel="Add Category"
          onAdd={() => handleOpenForm()}
          onEdit={(row) => handleOpenForm(row)}
          onDelete={(row) => {
            setDeletingCategory(row);
            setIsDeleteOpen(true);
          }}
        />
      </div>

      {/* Form Modal */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category Code *</label>
              <input
                {...register('code', { required: 'Code is required' })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. CAT-01"
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (English) *</label>
              <input
                {...register('name_en', { required: 'Name is required' })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30"
                placeholder="Category Name"
              />
              {errors.name_en && <p className="text-xs text-red-500">{errors.name_en.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (Sinhala)</label>
              <input
                {...register('name_si')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (Tamil)</label>
              <input
                {...register('name_ta')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 custom-scrollbar"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="rounded border-input text-primary focus:ring-primary/30"
            />
            <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
              Active Status
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {editingCategory ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
        isLoading={deleteMutation.isPending}
        title="Delete Category"
        description={`Are you sure you want to delete "${deletingCategory?.name_en}"? This action cannot be undone.`}
      />
    </div>
  );
}
