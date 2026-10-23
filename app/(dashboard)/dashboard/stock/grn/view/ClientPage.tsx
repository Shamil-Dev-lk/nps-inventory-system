'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Package, Calendar, MapPin, FileText, CheckCircle, XCircle, Printer, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { PrintLayout } from '@/components/print/PrintLayout';

export default function GrnViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

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

  const grnNumber = grn.grn_number || (`GRN-${String(grn.id).padStart(5, '0')}`);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="hidden print:block w-full mb-8">
        <PrintLayout title={`Goods Receive Note (GRN): ${grnNumber}`} />
      </div>
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stock/grn" className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              GRN Details 
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                grn.status === 'approved' ? 'bg-green-100 text-green-700' :
                grn.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {grn.status ? grn.status.toUpperCase() : 'DRAFT'}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">{grnNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=grn&id=${grn.id}&action=download`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors"
          >
            <Download size={16} /> Download PDF
          </button>
          <button
            onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=grn&id=${id}`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors"
          >
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
              <span className="font-medium">{grn.received_date ? new Date(grn.received_date).toLocaleDateString('en-LK') : 'N/A'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Invoice No:</span>
              <span className="font-medium">{grn.invoice_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText size={18}/> Remarks & Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{grn.remarks || grn.notes || 'No notes provided.'}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Received Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Batch / Expiry</th>
                <th className="px-5 py-3 font-medium text-right">Accepted Qty</th>
                <th className="px-5 py-3 font-medium text-right">Unit Price</th>
                <th className="px-5 py-3 font-medium text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grn.items?.length > 0 ? grn.items.map((item: any, i: number) => {
                const qty = Number(item.accepted_quantity ?? item.received_quantity ?? item.quantity ?? 0);
                const unitPrice = Number(item.unit_price || 0);
                const lineTotal = Number(item.total_price || (qty * unitPrice));
                return (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium">{item.item?.name_en || 'Unknown Item'}</div>
                      {item.item?.item_code && <div className="text-xs text-muted-foreground font-mono">{item.item.item_code}</div>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {item.batch_number ? `Batch: ${item.batch_number}` : '—'}
                      {item.expiry_date ? ` (Exp: ${item.expiry_date})` : ''}
                    </td>
                    <td className="px-5 py-3 font-semibold text-right">{qty}</td>
                    <td className="px-5 py-3 text-right">Rs. {unitPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3 font-semibold text-right">Rs. {lineTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No items found in this GRN</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-border bg-muted/20 flex justify-end">
          <div className="text-right">
            <span className="text-muted-foreground text-sm mr-4">Total Amount:</span>
            <span className="text-xl font-bold text-foreground">
              Rs. {Number(grn.total_amount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
