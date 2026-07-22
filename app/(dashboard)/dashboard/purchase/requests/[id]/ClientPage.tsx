'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PurchaseRequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const { data: pr, isLoading } = useQuery({
    queryKey: ['purchase_request', params.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_requests').select('*, department:departments(name_en)').eq('id', params.id).single();
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!pr) return <div className="p-8 text-center text-red-500">Purchase Request not found</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/purchase/requests" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Purchase Request: {pr.pr_number}</h1>
            <p className="text-sm text-muted-foreground">View purchase request details</p>
          </div>
        </div>
        <Link href={`/dashboard/purchase/requests/${params.id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          <Edit size={16} />
          Edit Request
        </Link>
      </div>

      <div className="space-y-6">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <p className="text-sm text-muted-foreground">PR Number</p>
              <p className="font-medium">{pr.pr_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{pr.status || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <p className="font-medium capitalize">{pr.priority || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Required Date</p>
              <p className="font-medium">{pr.required_date || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requested By</p>
              <p className="font-medium">{pr.requestedBy?.name || pr.requested_by || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">{pr.department?.name || pr.department_id || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purpose</p>
              <p className="font-medium">{pr.purpose || '-'}</p>
            </div>
          </div>
        </div>

        {(pr.approved_by || pr.approval_remarks || pr.remarks) && (
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Approval & Remarks</h2>
            <div className="space-y-4">
              {pr.approved_by && (
                <div>
                  <p className="text-sm text-muted-foreground">Approved By</p>
                  <p className="font-medium">{pr.approvedBy?.name || pr.approved_by} on {pr.approved_at || '-'}</p>
                </div>
              )}
              {pr.approval_remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Approval Remarks</p>
                  <p className="mt-1 whitespace-pre-wrap">{pr.approval_remarks}</p>
                </div>
              )}
              {pr.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">General Remarks</p>
                  <p className="mt-1 whitespace-pre-wrap">{pr.remarks}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


