'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Filter, FileText, Download, TrendingUp, FileCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function IssueReportPage() {
  const [departmentId, setDepartmentId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-issue', page, departmentId, fromDate, toDate, status],
    queryFn: async () => {
      let query = supabase
        .from('stock_issues')
        .select('*, department:departments(id, name_en), warehouse:warehouses(id, name_en)', { count: 'exact' });

      if (departmentId) query = query.eq('department_id', departmentId);
      if (status) query = query.eq('status', status);
      if (fromDate) query = query.gte('issue_date', fromDate);
      if (toDate) query = query.lte('issue_date', toDate);

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: rawIssues, error, count } = await query;
      if (error) throw error;

      return {
        data: {
          data: rawIssues || [],
          total: count || 0,
          from: from + 1,
          to: Math.min(from + perPage, count || 0),
          last_page: Math.ceil((count || 0) / perPage),
        }
      };
    },
    placeholderData: (prev) => prev,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const issues = data?.data?.data || [];
  const meta = data?.data;

  const handleExport = (format: 'pdf' | 'csv') => {
    if (format === 'pdf') {
      window.print();
    } else {
      if (!issues || issues.length === 0) return;
      const headers = ['Date', 'Issue Number', 'Issue To Type', 'Warehouse', 'Items', 'Total Amount', 'Status'];
      const rows = issues.map((row: any) => [
        row.issue_date,
        row.issue_number,
        row.issue_to_type,
        row.warehouse?.name_en || 'N/A',
        row.items?.length || 0,
        row.total_amount || 0,
        row.status || 'draft'
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "issue_report.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Stock Issue Report</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed report of all stock issued to departments and officers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-all">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex flex-wrap md:flex-nowrap gap-3">
        <div className="relative flex-1 md:w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <select value={departmentId} onChange={e => { setDepartmentId(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Departments</option>
            {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name_en}</option>)}
          </select>
        </div>
        <div className="relative flex-1 md:w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="issued">Issued</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="w-full md:w-auto px-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="From Date" />
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="w-full md:w-auto px-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="To Date" />
        
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border hover:bg-muted"><RefreshCw size={15} className="text-muted-foreground" /></button>
      </div>

      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Issue No.</th>
                <th>Issue Date</th>
                <th>Department</th>
                <th>Officer</th>
                <th>Warehouse</th>
                <th>Issued By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length: 8}).map((_, i) => (
                <tr key={i}>{Array.from({length: 7}).map((_, j) => <td key={j}><div className="shimmer h-4 rounded w-full max-w-[100px]" /></td>)}</tr>
              )) : issues.map((issue: any) => (
                <tr key={issue.id}>
                  <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{issue.issue_number}</code></td>
                  <td className="text-sm text-muted-foreground">{issue.issue_date ? new Date(issue.issue_date).toLocaleDateString('en-LK') : '—'}</td>
                  <td className="text-sm font-medium">{issue.department?.name_en || '—'}</td>
                  <td className="text-sm">{issue.officer?.name || '—'}</td>
                  <td className="text-sm text-muted-foreground">{issue.warehouse?.name_en || '—'}</td>
                  <td className="text-sm text-muted-foreground">{issue.issued_by?.name || '—'}</td>
                  <td>
                    <span className={`badge-sm ${issue.status === 'issued' ? 'badge-success' : issue.status === 'rejected' ? 'badge-danger' : issue.status === 'approved' ? 'badge-info' : 'badge-warning'}`}>
                      {issue.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && issues.length === 0 && <div className="text-center py-16 text-muted-foreground">No stock issues found</div>}

        {!isLoading && meta?.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {meta.from}–{meta.to} of {meta.total} issues</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40">Prev</button>
              <span className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">{page}</span>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}