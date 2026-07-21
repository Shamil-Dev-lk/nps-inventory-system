'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Eye, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  nic?: string;
  designation?: string;
}

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/v1/customers').then((r) => r.data?.data || []),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/v1/customers/${id}`),
    onSuccess: () => {
      toast.success('Customer deleted successfully.');
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => toast.error('Failed to delete customer.'),
  });

  const handleDelete = (customer: Customer) => {
    if (confirm(`Delete "${customer.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  const filteredCustomers = customers.filter((c: Customer) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer records</p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient hover:opacity-90 transition-all shadow-sm"
        >
          <Plus size={15} />
          Add Customer
        </Link>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <input
          type="search"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>ID Number</th>
                <th>Job Role</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}><div className="shimmer h-4 rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <Users size={32} className="mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer: Customer) => (
                  <tr key={customer.id}>
                    <td className="font-medium">{customer.name}</td>
                    <td>{customer.email || '—'}</td>
                    <td>{customer.phone || '—'}</td>
                    <td>{customer.nic || '—'}</td>
                    <td>{customer.designation || '—'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/dashboard/customers/${customer.id}/view`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-green-500" title="View Customer" rel="noopener noreferrer">
                          <Eye size={15} />
                        </a>
                        <button onClick={() => window.open(`/dashboard/receipts/print?type=customer&id=${customer.id}`, '_blank')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-purple-500" title="Print Receipt">
                          <Printer size={15} />
                        </button>
                        <button 
                          onClick={() => window.open(`/dashboard/receipts/print?type=customer&id=${customer.id}&action=download`, '_blank')}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-indigo-500" title="Download Receipt"
                        >
                          <Download size={15} />
                        </button>
                        <Link href={`/dashboard/customers/${customer.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-500" title="Edit Customer">
                          <Edit size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                          title="Delete Customer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
