'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit, FileText, MapPin, Printer, User, Phone, Download, Building2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ViewSupplierPage() {
  const router = useRouter();

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', params.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').eq('id', params.id).single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground shimmer h-32 rounded-xl max-w-4xl mx-auto" />;
  if (!supplier) return <div className="p-8 text-center text-red-500 font-bold">Supplier not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/store/suppliers" className="p-2 border border-border rounded-lg bg-card hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Supplier Details
              <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${
                supplier.status === 'active' ? 'bg-green-100 text-green-700' :
                supplier.status === 'blacklisted' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {supplier.status}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">ID: {supplier.supplier_code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print?type=supplier&id=${supplier.id}&action=download`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors"
          >
            <Download size={16} /> Download PDF
          </button>
          <button 
            onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print?type=supplier&id=${supplier.id}`, '_blank')} 
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors"
          >
            <Printer size={16} /> Print Document
          </button>
          <Link 
            href={`/dashboard/store/suppliers/${supplier.id}/edit`} 
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors shadow-sm"
          >
            <Edit size={16} /> Edit Supplier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-3">
            <Building2 size={18} className="text-muted-foreground" /> Company Info
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Supplier Code</span>
              <span className="font-medium text-foreground">{supplier.supplier_code}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Company Name</span>
              <span className="font-medium text-foreground">{supplier.company_name}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Created At</span>
              <span className="font-medium text-foreground">{new Date(supplier.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-3">
            <User size={18} className="text-muted-foreground" /> Contact Info
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Contact Person</span>
              <span className="font-medium text-foreground">{supplier.contact_person || '—'}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Telephone</span>
              <span className="font-medium text-foreground">{supplier.telephone || '—'}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{supplier.email || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
