'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Modal } from '@/components/ui/modal';
import api from '@/lib/api';

interface Supplier {
  id: number;
  supplier_code: string;
  company_name: string;
  contact_person?: string;
  telephone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'blacklisted';
  created_at: string;
}

type SupplierFormData = Omit<Supplier, 'id' | 'created_at'>;

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormData>();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/v1/suppliers').then((r) => (r.data?.data || []) as Supplier[]),
  });

  const createMutation = useMutation({
    mutationFn: (data: SupplierFormData) => api.post('/v1/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier created successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to create supplier'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: SupplierFormData }) => 
      api.put(`/v1/suppliers/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier updated successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to update supplier'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/v1/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier deleted successfully');
      setIsDeleteOpen(false);
      setDeletingSupplier(null);
    },
    onError: () => toast.error('Failed to delete supplier'),
  });

  const handleOpenForm = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      reset({
        supplier_code: supplier.supplier_code,
        company_name: supplier.company_name,
        contact_person: supplier.contact_person || '',
        telephone: supplier.telephone || '',
        email: supplier.email || '',
        status: supplier.status,
      });
    } else {
      setEditingSupplier(null);
      reset({
        supplier_code: '',
        company_name: '',
        contact_person: '',
        telephone: '',
        email: '',
        status: 'active',
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSupplier(null);
    reset();
  };

  const onSubmit = (data: SupplierFormData) => {
    if (editingSupplier) updateMutation.mutate({ id: editingSupplier.id, payload: data });
    else createMutation.mutate(data);
  };

  const columns: Column<Supplier>[] = [
    { header: 'Code', accessor: 'supplier_code', className: 'font-medium' },
    { header: 'Company Name', accessor: 'company_name' },
    { header: 'Contact Person', accessor: 'contact_person' },
    { header: 'Telephone', accessor: 'telephone' },
    { 
      header: 'Status', 
      accessor: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          row.status === 'blacklisted' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full h-[calc(100vh-100px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage vendor and supplier information</p>
      </div>

      <div className="flex-1">
        <DataTable
          data={suppliers}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          searchKey="company_name"
          searchPlaceholder="Search suppliers..."
          addButtonLabel="Add Supplier"
          onAdd={() => handleOpenForm()}
          onEdit={handleOpenForm}
          onDelete={(row) => { setDeletingSupplier(row); setIsDeleteOpen(true); }}
          onPrint={(row) => window.open(`/dashboard/receipts/print?type=supplier&id=${row.id}`, '_blank')}
          onDownload={(row) => window.open(`/dashboard/receipts/print?type=supplier&id=${row.id}&action=download`, '_blank')}
        />
      </div>

      <Modal isOpen={isFormOpen} onClose={handleCloseForm} title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Supplier Code *</label>
              <input {...register('supplier_code', { required: 'Required' })} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
              {errors.supplier_code && <p className="text-xs text-red-500">{errors.supplier_code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Company Name *</label>
              <input {...register('company_name', { required: 'Required' })} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
              {errors.company_name && <p className="text-xs text-red-500">{errors.company_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Contact Person</label>
              <input {...register('contact_person')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Telephone</label>
              <input {...register('telephone')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input type="email" {...register('email')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status *</label>
              <select {...register('status', { required: 'Required' })} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={handleCloseForm} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => deletingSupplier && deleteMutation.mutate(deletingSupplier.id)} isLoading={deleteMutation.isPending} title="Delete Supplier" description={`Are you sure you want to delete "${deletingSupplier?.company_name}"?`} />
    </div>
  );
}
