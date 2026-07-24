'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Package, Calendar, MapPin, FileText, CheckCircle, XCircle, Edit, Printer, User, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function IssueViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const shouldPrint = searchParams.get('print') === 'true';
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_issues')
        .select('*, warehouse:warehouses(id, name_en), department:departments(id, name_en), officer:users(id, name), project:projects(id, name_en), issued_by:users(id, name), items:stock_issue_items(*, item:items(*))')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (issue && shouldPrint) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [issue, shouldPrint]);

  const approveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('stock_issues').update({ status: 'issued' }).eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Stock issue approved successfully.');
      qc.invalidateQueries({ queryKey: ['issue', id] });
    },
    onError: (e: any) => toast.error(e.message || 'Approval failed.'),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('stock_issues').update({ status: 'rejected', remarks: rejectReason }).eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Stock issue rejected.');
      qc.invalidateQueries({ queryKey: ['issue', id] });
      setIsRejecting(false);
    },
    onError: (e: any) => toast.error(e.message || 'Rejection failed.'),
  });


  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Issue details...</div>;
  if (!issue) return <div className="p-8 text-center text-muted-foreground">Issue not found.</div>;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stock/issue" className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Issue Details 
              <span className={`text-xs px-2 py-1 rounded-full ${
                issue.status === 'issued' ? 'bg-green-100 text-green-700' :
                issue.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {issue.status?.toUpperCase() || 'DRAFT'}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{issue.issue_number}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print?type=stock-issue&id=${issue.id}&action=download`, '_blank')} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors">
            <Download size={16} /> Download PDF
          </button>
          <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print?type=stock-issue&id=${id}`, '_blank')} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted font-medium transition-colors">
            <Printer size={16} /> Print Document
          </button>
          
          {issue.status === 'draft' && (
            <>
              <Link href={`/dashboard/stock/issue/${id}/edit`} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors">
                <Edit size={16} /> Edit
              </Link>
              <button onClick={() => setIsRejecting(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                <XCircle size={16} /> Reject
              </button>
              <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                <CheckCircle size={16} /> {approveMutation.isPending ? 'Approving...' : 'Approve & Issue'}
              </button>
            </>
          )}
        </div>
      </div>

      {isRejecting && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3">
          <input type="text" placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="flex-1 px-3 py-2 border border-red-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200" />
          <button onClick={() => rejectMutation.mutate()} disabled={!rejectReason || rejectMutation.isPending} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Confirm Reject</button>
          <button onClick={() => setIsRejecting(false)} className="px-4 py-2 border border-red-200 rounded-lg hover:bg-red-100 text-red-700">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package size={18}/> Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Warehouse:</span>
              <span className="font-medium">{issue.warehouse?.name_en || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Issue Date:</span>
              <span className="font-medium">{issue.issue_date ? new Date(issue.issue_date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Issued To:</span>
              <span className="font-medium capitalize">
                {issue.issue_to_type} - {
                  issue.issue_to_type === 'department' ? issue.department?.name_en :
                  issue.issue_to_type === 'officer' ? issue.officer?.name :
                  issue.issue_to_type === 'project' ? issue.project?.name : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Created By:</span>
              <span className="font-medium">{issue.issued_by?.name || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText size={18}/> Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Purpose:</p>
              <p className="text-sm text-muted-foreground">{issue.purpose || 'None'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Remarks:</p>
              <p className="text-sm text-muted-foreground">{issue.remarks || 'None'}</p>
            </div>
          </div>
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
                <th className="px-5 py-3 font-medium text-right">Qty Issued</th>
                <th className="px-5 py-3 font-medium text-right">Unit Price</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {issue.items?.length > 0 ? issue.items.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3">{item.item?.name_en || 'Unknown Item'}</td>
                  <td className="px-5 py-3 font-medium text-right">{item.quantity}</td>
                  <td className="px-5 py-3 text-right">Rs. {Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">Rs. {Number(item.total_price).toFixed(2)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{item.remarks || '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


