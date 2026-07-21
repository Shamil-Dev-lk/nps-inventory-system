'use client';
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Calendar, MapPin, FileText, CheckCircle, XCircle, Printer, Download } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { PrintLayout } from '@/components/print/PrintLayout';

export default function StockReturnViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const shouldPrint = searchParams.get('print') === 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['stock-return', id],
    queryFn: () => api.get(`/v1/stock/returns/${id}`).then(r => r.data),
  });

  const ret = data?.data;

  useEffect(() => {
    if (ret && shouldPrint) {
      // Small delay to allow rendering
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [ret, shouldPrint]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading return details...</div>;
  }

  if (!ret) {
    return <div className="p-8 text-center text-muted-foreground">Return not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stock/return" className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Return Details 
              <span className={`text-xs px-2 py-1 rounded-full ${ret.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {ret.status || 'Draft'}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{ret.return_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(`/dashboard/receipts/print?type=stock-return&id=${ret.id}&action=download`, '_blank')} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors">
            <Download size={16} /> Download PDF
          </button>
          <button onClick={() => window.open(`/dashboard/receipts/print?type=stock-return&id=${ret.id}`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors">
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package size={18}/> Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Returned By:</span>
              <span className="font-medium">{ret.department?.name_en || ret.officer?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">To Warehouse:</span>
              <span className="font-medium">{ret.warehouse?.name_en || 'N/A'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Return Date:</span>
              <span className="font-medium">{ret.return_date ? new Date(ret.return_date).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText size={18}/> Remarks</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ret.remarks || 'No remarks provided.'}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Returned Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Condition / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ret.items?.length > 0 ? ret.items.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{item.item?.name_en || 'Unknown Item'}</td>
                  <td className="px-5 py-3">{item.quantity} {item.item?.unit?.symbol}</td>
                  <td className="px-5 py-3 text-muted-foreground">{item.remarks || '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


