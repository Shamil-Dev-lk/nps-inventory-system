'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase_order', params.id],
    queryFn: () => api.get(`/v1/purchase/orders/${params.id}`).then(r => r.data.data)
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!po) return <div className="p-8 text-center text-red-500">Purchase Order not found</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/purchase/orders" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Purchase Order: {po.po_number}</h1>
            <p className="text-sm text-muted-foreground">View purchase order details</p>
          </div>
        </div>
        <Link href={`/dashboard/purchase/orders/${params.id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          <Edit size={16} />
          Edit Order
        </Link>
      </div>

      <div className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <p className="text-sm text-muted-foreground">PO Number</p>
              <p className="font-medium">{po.po_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{po.status || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">{po.order_date || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Delivery Date</p>
              <p className="font-medium">{po.expected_delivery_date || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium">{po.supplier?.name || po.supplier_id || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="font-medium">{po.createdBy?.name || po.created_by || '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Financial Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="font-medium">{po.subtotal ? `Rs ${po.subtotal}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Discount Amount</p>
              <p className="font-medium">{po.discount_amount ? `Rs ${po.discount_amount}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tax Amount</p>
              <p className="font-medium">{po.tax_amount ? `Rs ${po.tax_amount}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium text-lg">{po.total_amount ? `Rs ${po.total_amount}` : '-'}</p>
            </div>
          </div>
        </div>

        {(po.terms_conditions || po.remarks) && (
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
            <div className="space-y-4">
              {po.terms_conditions && (
                <div>
                  <p className="text-sm text-muted-foreground">Terms & Conditions</p>
                  <p className="mt-1 whitespace-pre-wrap">{po.terms_conditions}</p>
                </div>
              )}
              {po.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="mt-1 whitespace-pre-wrap">{po.remarks}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


