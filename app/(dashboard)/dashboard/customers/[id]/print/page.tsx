'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Printer } from 'lucide-react';

import { PrintLayout } from '@/components/print/PrintLayout';

export default function PrintCustomerPage({ params }: { params: { id: string } }) {
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', params.id],
    queryFn: () => api.get(`/v1/customers/${params.id}`).then((r) => r.data?.data),
  });

  useEffect(() => {
    if (customer && !isLoading && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('download') === 'true') {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    }
  }, [customer, isLoading]);

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading Customer Details...</div>;
  if (!customer) return <div className="p-8 text-center text-red-500 font-bold">Customer not found</div>;

  return (
    <div className="min-h-screen">
      {/* Non-printable controls */}
      <div className="print:hidden p-4 bg-muted flex justify-center border-b mb-8">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium shadow-sm transition-all"
        >
          <Printer size={18} />
          Print Customer Details
        </button>
      </div>

      {/* Official Printable Receipt Layout */}
      <div className="max-w-4xl mx-auto">
        <PrintLayout 
          title="Customer Profile Details" 
          subtitle={`Customer ID: ${customer.id}`}
        >
          <div className="p-4">
            <table className="w-full text-left border-collapse data-table">
              <tbody>
                <tr className="border-b">
                  <th className="py-3 px-4 w-1/3 bg-muted font-semibold text-gray-600 uppercase text-xs">Customer Name</th>
                  <td className="py-3 px-4 font-bold text-base">{customer.name || '—'}</td>
                </tr>
                <tr className="border-b">
                  <th className="py-3 px-4 bg-muted font-semibold text-gray-600 uppercase text-xs">ID Number / NIC</th>
                  <td className="py-3 px-4 font-bold text-base">{customer.nic || '—'}</td>
                </tr>
                <tr className="border-b">
                  <th className="py-3 px-4 bg-muted font-semibold text-gray-600 uppercase text-xs">Job Role / Designation</th>
                  <td className="py-3 px-4 font-medium">{customer.designation || '—'}</td>
                </tr>
                <tr className="border-b">
                  <th className="py-3 px-4 bg-muted font-semibold text-gray-600 uppercase text-xs">Phone Number</th>
                  <td className="py-3 px-4 font-medium">{customer.phone || '—'}</td>
                </tr>
                <tr className="border-b">
                  <th className="py-3 px-4 bg-muted font-semibold text-gray-600 uppercase text-xs">Email Address</th>
                  <td className="py-3 px-4 font-medium">{customer.email || '—'}</td>
                </tr>
                <tr className="border-b">
                  <th className="py-3 px-4 bg-muted font-semibold text-gray-600 uppercase text-xs">Registered Date</th>
                  <td className="py-3 px-4 font-medium">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
                <tr>
                  <th className="py-3 px-4 bg-muted font-semibold text-gray-600 uppercase text-xs">Address</th>
                  <td className="py-3 px-4 font-medium">{customer.address || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </PrintLayout>
      </div>
    </div>
  );
}

export function generateStaticParams() { return []; }
