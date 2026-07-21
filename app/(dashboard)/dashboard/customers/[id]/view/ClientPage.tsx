'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit, Printer, Download, User } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ViewCustomerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;
  
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/v1/customers/${id}`).then((r) => r.data?.data),
  });
  if (isLoading) return <div className="p-8 text-center text-muted-foreground shimmer h-32 rounded-xl max-w-2xl mx-auto" />;
  if (!customer) return <div className="p-8 text-center text-red-500 font-bold">Customer not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Screen View */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers" className="p-2 border border-border rounded-lg hover:bg-muted transition-colors bg-card">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Customer Details 
            </h1>
            <p className="text-sm text-muted-foreground mt-1">ID: {customer.id}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => window.open(`/dashboard/receipts/print?type=customer&id=${customer.id}&action=download`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors"
          >
            <Download size={16} /> Download PDF
          </button>
          <button 
            onClick={() => window.open(`/dashboard/receipts/print?type=customer&id=${customer.id}`, '_blank')} 
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors"
          >
            <Printer size={16} /> Print Document
          </button>
          <Link href={`/dashboard/customers/${id}`} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Edit size={16} /> Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><User size={18}/> Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Full Name:</span>
              <span className="font-bold">{customer.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">ID Number / NIC:</span>
              <span className="font-medium">{customer.nic || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Job Role:</span>
              <span className="font-medium">{customer.designation || 'N/A'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Registered Date:</span>
              <span className="font-medium">{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ArrowLeft size={18} className="opacity-0"/> Contact Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Phone Number:</span>
              <span className="font-medium">{customer.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Email Address:</span>
              <span className="font-medium">{customer.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-medium">{customer.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


