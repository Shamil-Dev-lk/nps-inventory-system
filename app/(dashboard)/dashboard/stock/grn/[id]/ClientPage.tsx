'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Calendar, MapPin, FileText, CheckCircle, XCircle, Printer, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { PrintLayout } from '@/components/print/PrintLayout';

export default function GrnViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const { data: grn, isLoading } = useQuery({
    queryKey: ['grn', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grns')
        .select('*, supplier:suppliers(*), warehouse:warehouses(*), items:grn_items(*, item:items(*))')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading GRN details...</div>;
  }

  if (!grn) {
    return <div className="p-8 text-center text-muted-foreground">GRN not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="hidden print:block w-full mb-8">
        <PrintLayout title={`Goods Receive Note (GRN): ${grn.grn_number}`} />
      </div>
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stock/grn" className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              GRN Details 
              <span className={`text-xs px-2 py-1 rounded-full ${grn.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {grn.status || 'Draft'}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{grn.grn_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print?type=grn&id=${grn.id}&action=download`, '_blank')} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors">
            <Download size={16} /> Download PDF
          </button>
          <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print?type=grn&id=${id}`, '_blank')} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors">
            <Printer size={16} /> Print Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package size={18}/> Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Supplier:</span>
              <span className="font-medium">{grn.supplier?.company_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Warehouse:</span>
              <span className="font-medium">{grn.warehouse?.name_en || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Received Date:</span>
              <span className="font-medium">{grn.received_date ? new Date(grn.received_date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Invoice No:</span>
              <span className="font-medium">{grn.invoice_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText size={18}/> Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{grn.notes || 'No notes provided.'}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Qty</th>
                <th className="px-5 py-3 font-medium">Unit Price</th>
                <th className="px-5 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grn.items?.length > 0 ? grn.items.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3">{item.item?.name_en || 'Unknown Item'}</td>
                  <td className="px-5 py-3">{item.quantity}</td>
                  <td className="px-5 py-3">Rs. {Number(item.unit_price).toLocaleString()}</td>
                  <td className="px-5 py-3 font-medium">Rs. {(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-border bg-muted/20 flex justify-end">
          <div className="text-right">
            <span className="text-muted-foreground text-sm mr-4">Total Amount:</span>
            <span className="text-lg font-bold">Rs. {Number(grn.total_amount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


