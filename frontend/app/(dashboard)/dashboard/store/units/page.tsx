'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Modal } from '@/components/ui/modal';
import api from '@/lib/api';

interface Unit {
  id: number;
  code: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  symbol: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

type UnitFormData = Omit<Unit, 'id' | 'created_at'>;

export default function UnitsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UnitFormData>();

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.get('/v1/units').then((r) => (r.data?.data || []) as Unit[]),
  });

  const createMutation = useMutation({
    mutationFn: (data: UnitFormData) => api.post('/v1/units', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit created successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to create unit'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: UnitFormData }) => 
      api.put(`/v1/units/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit updated successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to update unit'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/v1/units/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit deleted successfully');
      setIsDeleteOpen(false);
      setDeletingUnit(null);
    },
    onError: () => toast.error('Failed to delete unit'),
  });

  const handleOpenForm = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      reset({
        code: unit.code,
        name_en: unit.name_en,
        name_si: unit.name_si || '',
        name_ta: unit.name_ta || '',
        symbol: unit.symbol || '',
        description: unit.description || '',
        is_active: unit.is_active,
      });
    } else {
      setEditingUnit(null);
      reset({
        code: '',
        name_en: '',
        name_si: '',
        name_ta: '',
        symbol: '',
        description: '',
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUnit(null);
    reset();
  };

  const onSubmit = (data: UnitFormData) => {
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, payload: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns: Column<Unit>[] = [
    { header: 'Code', accessor: 'code', className: 'font-medium' },
    { header: 'Name', accessor: 'name_en' },
    { header: 'Symbol', accessor: 'symbol' },
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
        <h1 className="text-2xl font-bold text-foreground">Units of Measurement</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage units used for inventory items (e.g. Kg, Liters, Pieces)</p>
      </div>

      <div className="flex-1">
        <DataTable
          data={units}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          searchKey="name_en"
          searchPlaceholder="Search units..."
          addButtonLabel="Add Unit"
          onAdd={() => handleOpenForm()}
          onEdit={(row) => handleOpenForm(row)}
          onDelete={(row) => {
            setDeletingUnit(row);
            setIsDeleteOpen(true);
          }}
        />
      </div>

      <Modal 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        title={editingUnit ? 'Edit Unit' : 'Add New Unit'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Unit Code *</label>
              <input
                {...register('code', { required: 'Code is required' })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. KG"
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (English) *</label>
              <input
                {...register('name_en', { required: 'Name is required' })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. Kilograms"
              />
              {errors.name_en && <p className="text-xs text-red-500">{errors.name_en.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Symbol *</label>
              <input
                {...register('symbol', { required: 'Symbol is required' })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. kg"
              />
              {errors.symbol && <p className="text-xs text-red-500">{errors.symbol.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (Sinhala)</label>
              <input
                {...register('name_si')}
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
              {editingUnit ? 'Update Unit' : 'Save Unit'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deletingUnit && deleteMutation.mutate(deletingUnit.id)}
        isLoading={deleteMutation.isPending}
        title="Delete Unit"
        description={`Are you sure you want to delete the unit "${deletingUnit?.name_en}"?`}
      />
    </div>
  );
}
