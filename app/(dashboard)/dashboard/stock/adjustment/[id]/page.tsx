'use client';
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Calendar, FileText, Printer, Download, SlidersHorizontal } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { PrintLayout } from '@/components/print/PrintLayout';

export default function StockAdjustmentViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const shouldPrint = searchParams.get('print') === 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['stock-adjustment', id],
    queryFn: () => api.get(`/v1/stock/adjustments/${id}`).then(r => r.data),
  });

  const adjustment = data?.data;

  useEffect(() => {
    if (adjustment && shouldPrint) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [adjustment, shouldPrint]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading adjustment details...</div>;
  }

  if (!adjustment) {
    return <div className="p-8 text-center text-muted-foreground">Adjustment not found.</div>;
  }

  const isAddition = adjustment.adjustment_type === 'addition';

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stock/adjustment" className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Adjustment Details 
              <span className={`text-xs px-2 py-1 rounded-full ${adjustment.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {adjustment.status || 'Draft'}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{adjustment.adjustment_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(`/dashboard/receipts/print?type=stock-adjustment&id=${adjustment.id}&action=download`, '_blank')} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors">
            <Download size={16} /> Download PDF
          </button>
          <button onClick={() => window.open(`/dashboard/receipts/print?type=stock-adjustment&id=${adjustment.id}`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors">
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><SlidersHorizontal size={18}/> Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Type:</span>
              <span className={`font-medium ${isAddition ? 'text-green-600' : 'text-red-600'}`}>
                {isAddition ? 'Addition (+)' : 'Deduction (-)'}
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Warehouse:</span>
              <span className="font-medium">{adjustment.warehouse?.name_en || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Reason:</span>
              <span className="font-medium capitalize">{adjustment.reason?.replace('_', ' ') || 'N/A'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{adjustment.adjustment_date ? new Date(adjustment.adjustment_date).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText size={18}/> Details</h3>
          <div className="space-y-3 text-sm">
             <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Reference No:</span>
              <span className="font-medium">{adjustment.reference_number || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1 pb-2">
              <span className="text-muted-foreground">Description / Remarks:</span>
              <span className="font-medium">{adjustment.description || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Adjusted Item</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Item Code</th>
                <th className="px-5 py-3 font-medium">Item Name</th>
                <th className="px-5 py-3 font-medium text-right">Unit Cost</th>
                <th className="px-5 py-3 font-medium text-right">Quantity</th>
                <th className="px-5 py-3 font-medium text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-5 py-3">{adjustment.item?.item_code || '—'}</td>
                <td className="px-5 py-3 font-medium">{adjustment.item?.name_en || 'Unknown Item'}</td>
                <td className="px-5 py-3 text-right">LKR {parseFloat(adjustment.unit_cost || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="px-5 py-3 text-right font-medium">{adjustment.quantity} {adjustment.item?.unit?.symbol}</td>
                <td className="px-5 py-3 text-right">LKR {(parseFloat(adjustment.quantity || 0) * parseFloat(adjustment.unit_cost || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() { return []; }
