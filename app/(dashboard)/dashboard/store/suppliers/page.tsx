'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { supabase } from '@/lib/supabase';

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
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Supplier[];
    },
  });

  // Mutations and handlers for creating and updating moved to dedicated pages

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier deleted successfully');
      setIsDeleteOpen(false);
      setDeletingSupplier(null);
    },
    onError: () => toast.error('Failed to delete supplier'),
  });

  // Modal handlers removed

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
          onAdd={() => router.push('/dashboard/store/suppliers/new')}
          onEdit={(row) => router.push(`/dashboard/store/suppliers/${row.id}/view`)}
          onDelete={(row) => { setDeletingSupplier(row); setIsDeleteOpen(true); }}
          onPrint={(row) => window.open(`/dashboard/receipts/print?type=supplier&id=${row.id}`, '_blank')}
          onDownload={(row) => window.open(`/dashboard/receipts/print?type=supplier&id=${row.id}&action=download`, '_blank')}
        />
      </div>

      {/* Modal removed in favor of dedicated pages */}

      <ConfirmDeleteDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => deletingSupplier && deleteMutation.mutate(deletingSupplier.id)} isLoading={deleteMutation.isPending} title="Delete Supplier" description={`Are you sure you want to delete "${deletingSupplier?.company_name}"?`} />
    </div>
  );
}
