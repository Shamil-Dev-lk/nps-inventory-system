'use client';
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Calendar, MapPin, FileText, Printer, Download, ArrowRightLeft } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { PrintLayout } from '@/components/print/PrintLayout';

export default function StockTransferViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const shouldPrint = searchParams.get('print') === 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['stock-transfer', id],
    queryFn: () => api.get(`/v1/stock/transfers/${id}`).then(r => r.data),
  });

  const transfer = data?.data;

  useEffect(() => {
    if (transfer && shouldPrint) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [transfer, shouldPrint]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading transfer details...</div>;
  }

  if (!transfer) {
    return <div className="p-8 text-center text-muted-foreground">Transfer not found.</div>;
  }

  const isWhToWh = transfer.transfer_type === 'warehouse_to_warehouse';

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stock/transfer" className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Transfer Details 
              <span className={`text-xs px-2 py-1 rounded-full ${transfer.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {transfer.status || 'Draft'}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{transfer.transfer_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(`/dashboard/receipts/print?type=stock-transfer&id=${transfer.id}&action=download`, '_blank')} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors">
            <Download size={16} /> Download PDF
          </button>
          <button onClick={() => window.open(`/dashboard/receipts/print?type=stock-transfer&id=${transfer.id}`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors">
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ArrowRightLeft size={18}/> Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{isWhToWh ? 'Warehouse to Warehouse' : 'Department to Warehouse'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">From:</span>
              <span className="font-medium">{isWhToWh ? transfer.from_warehouse?.name_en : transfer.from_department?.name_en || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">To:</span>
              <span className="font-medium">{isWhToWh ? transfer.to_warehouse?.name_en : transfer.to_department?.name_en || 'N/A'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{transfer.transfer_date ? new Date(transfer.transfer_date).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText size={18}/> Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Reason:</span>
              <span className="font-medium">{transfer.reason || 'N/A'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Remarks:</span>
              <span className="font-medium">{transfer.remarks || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Transferred Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transfer.items?.length > 0 ? transfer.items.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{item.item?.name_en || 'Unknown Item'}</td>
                  <td className="px-5 py-3">{item.quantity} {item.item?.unit?.symbol}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={2} className="px-5 py-8 text-center text-muted-foreground">No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
