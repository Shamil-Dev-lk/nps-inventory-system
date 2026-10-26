'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RefreshCw,
  Filter,
  FileText,
  Download,
  Printer,
  Eye,
  X,
  Loader2,
  Search,
  Building2,
  Calendar,
  AlertCircle,
  Package,
  Layers,
  Users,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import {
  generateIssueReportPdf,
  IssueRecordForPdf,
  getRecipientDetails,
  getDepartmentOrPurpose,
  calculateTotalQty
} from '@/lib/reports/issue-report-pdf';

export default function IssueReportPage() {
  const { user } = useAuthStore();
  const [departmentId, setDepartmentId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // PDF Preview & Print states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewOrientation, setPreviewOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isExporting, setIsExporting] = useState(false);
  const [exportAction, setExportAction] = useState<'download' | 'preview' | 'print' | 'csv' | null>(null);
  const [cachedExportIssues, setCachedExportIssues] = useState<IssueRecordForPdf[] | null>(null);

  const getIssueNumber = (issue: any) => issue.issue_number || `IS-${String(issue.id || 0).padStart(4, '0')}`;
  const getOfficerName = (issue: any) => {
    if (issue.customer?.name) return issue.customer.name;
    if (issue.officer?.name) return issue.officer.name;
    if (issue.remarks && issue.remarks.includes('[Person Details]')) {
      const match = issue.remarks.match(/Name:\s*([^|\n]+)/);
      if (match && match[1]) return match[1].trim();
    }
    return '—';
  };
  const getDepartmentName = (issue: any) => {
    if (issue.department?.name_en) return issue.department.name_en;
    if (issue.project?.name_en) return issue.project.name_en;
    if (issue.purpose) return issue.purpose;
    return '—';
  };
  const getIssuedBy = (issue: any) => {
    if (issue.issued_by?.name) return issue.issued_by.name;
    if (typeof issue.issued_by === 'string' && issue.issued_by) return issue.issued_by;
    if (issue.created_by) return issue.created_by;
    return 'Store Admin';
  };

  // Live paginated query for dashboard table view
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-issue', page, departmentId, fromDate, toDate, status, search],
    queryFn: async () => {
      let query = supabase
        .from('stock_issues')
        .select(
          `*,
          department:departments(id, name_en),
          project:projects(id, name_en),
          customer:customers(id, name),
          warehouse:warehouses(id, name_en),
          items:stock_issue_items(
            id,
            quantity,
            remarks,
            item:items(id, name_en, code, unit:units(symbol, name_en))
          )`,
          { count: 'exact' }
        );

      if (departmentId) query = query.eq('department_id', departmentId);
      if (status) query = query.eq('status', status);
      if (fromDate) query = query.gte('issue_date', fromDate);
      if (toDate) query = query.lte('issue_date', toDate);
      if (search.trim()) {
        query = query.or(`issue_number.ilike.%${search.trim()}%,purpose.ilike.%${search.trim()}%,remarks.ilike.%${search.trim()}%`);
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: rawIssues, error, count } = await query;
      if (error) throw error;

      return {
        data: {
          data: (rawIssues || []) as unknown as IssueRecordForPdf[],
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
      const { data, error } = await supabase.from('departments').select('*').order('name_en');
      if (error) throw error;
      return data || [];
    },
  });

  const issues = data?.data?.data || [];
  const meta = data?.data;

  // Selected department label
  const selectedDepartment = departments?.find((d: any) => String(d.id) === String(departmentId));
  const departmentName = selectedDepartment?.name_en;

  // Real-time Summary Metrics for On-Screen Cards
  const onScreenMetrics = useMemo(() => {
    let units = 0;
    const recipients = new Set<string>();
    let issued = 0;
    let approved = 0;
    let draft = 0;

    issues.forEach(iss => {
      const r = getRecipientDetails(iss).split('\n')[0].trim();
      if (r && r !== '—') recipients.add(r);

      const st = (iss.status || 'draft').toLowerCase();
      if (st === 'issued') issued++;
      else if (st === 'approved') approved++;
      else draft++;

      units += calculateTotalQty(iss.items);
    });

    return {
      totalRecords: meta?.total || issues.length,
      pageUnits: units,
      recipientsCount: recipients.size,
      statusStr: `${issued} Issued • ${approved} Appr • ${draft} Draft`
    };
  }, [issues, meta]);

  // Fetch ALL matching records for PDF/CSV export (no pagination limit)
  const fetchAllMatchingIssues = async (): Promise<IssueRecordForPdf[]> => {
    let query = supabase
      .from('stock_issues')
      .select(`
        *,
        department:departments(id, name_en),
        project:projects(id, name_en),
        customer:customers(id, name),
        warehouse:warehouses(id, name_en),
        items:stock_issue_items(
          id,
          quantity,
          remarks,
          item:items(
            id,
            name_en,
            code,
            unit:units(symbol, name_en)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (departmentId) query = query.eq('department_id', departmentId);
    if (status) query = query.eq('status', status);
    if (fromDate) query = query.gte('issue_date', fromDate);
    if (toDate) query = query.lte('issue_date', toDate);
    if (search.trim()) {
      query = query.or(`issue_number.ilike.%${search.trim()}%,purpose.ilike.%${search.trim()}%,remarks.ilike.%${search.trim()}%`);
    }

    const { data: allRecords, error } = await query;
    if (error) throw error;
    return (allRecords || []) as unknown as IssueRecordForPdf[];
  };

  // Helper to build PDF document
  const buildPdf = (records: IssueRecordForPdf[], orientation: 'landscape' | 'portrait') => {
    const generatedBy = user?.name || user?.email || 'Store Administration';
    return generateIssueReportPdf({
      issues: records,
      filters: {
        departmentName,
        status: status || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: search.trim() || undefined,
      },
      generatedBy,
      orientation,
    });
  };

  // Handle Download PDF
  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportAction('download');
    const toastId = toast.loading('Preparing high-resolution PDF document...');

    try {
      const records = cachedExportIssues || (await fetchAllMatchingIssues());
      setCachedExportIssues(records);

      if (records.length === 0) {
        toast.error('No stock issue records match the selected filters.', { id: toastId });
        return;
      }

      const doc = buildPdf(records, previewOrientation);
      const todayStr = new Date().toISOString().slice(0, 10);
      const filename = `NPS_Inventory_Issue_Report_${todayStr}.pdf`;

      doc.save(filename);
      toast.success(`Official PDF downloaded successfully (${records.length} records)`, { id: toastId });
    } catch (err: any) {
      console.error('PDF generation error:', err);
      toast.error(err.message || 'Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  // Handle Preview PDF Modal
  const handlePreviewPdf = async (targetOrientation?: 'landscape' | 'portrait') => {
    const orientation = targetOrientation || previewOrientation;
    if (targetOrientation && targetOrientation !== previewOrientation) {
      setPreviewOrientation(targetOrientation);
    }

    setIsExporting(true);
    setExportAction('preview');
    const toastId = toast.loading('Rendering print-ready preview...');

    try {
      const records = cachedExportIssues || (await fetchAllMatchingIssues());
      setCachedExportIssues(records);

      const doc = buildPdf(records, orientation);
      const blob = doc.output('blob');

      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }

      const newBlobUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(newBlobUrl);
      setPreviewModalOpen(true);
      toast.success('Document preview ready', { id: toastId });
    } catch (err: any) {
      console.error('PDF preview error:', err);
      toast.error(err.message || 'Failed to open preview.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  // Handle Direct Vector PDF Print
  const handlePrintReport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportAction('print');
    const toastId = toast.loading('Preparing print-ready document...');

    try {
      const records = cachedExportIssues || (await fetchAllMatchingIssues());
      setCachedExportIssues(records);

      if (records.length === 0) {
        toast.error('No stock issues found to print.', { id: toastId });
        return;
      }

      const doc = buildPdf(records, previewOrientation);
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      // Create hidden iframe for direct vector printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;

      document.body.appendChild(iframe);
      iframe.onload = () => {
        toast.success('Opening print dialog...', { id: toastId });
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('Direct print fallback to window.print():', printErr);
          window.print();
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      };
    } catch (err: any) {
      console.error('Print error:', err);
      toast.error(err.message || 'Failed to prepare print view.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  // Close Preview Modal and cleanup memory
  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
  };

  // Reset filter cache when filter parameters change
  useEffect(() => {
    setCachedExportIssues(null);
  }, [departmentId, status, fromDate, toDate, search]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  // Handle Export CSV
  const handleExportCsv = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportAction('csv');
    const toastId = toast.loading('Exporting CSV data...');

    try {
      const records = cachedExportIssues || (await fetchAllMatchingIssues());
      setCachedExportIssues(records);

      if (!records || records.length === 0) {
        toast.error('No stock issues found to export.', { id: toastId });
        return;
      }

      const headers = [
        '#',
        'Issue Number',
        'Issue Date',
        'Recipient / Officer',
        'Department / Project',
        'Warehouse',
        'Total Items Count',
        'Total Units Quantity',
        'Items Details',
        'Issued By',
        'Status'
      ];

      const rows = records.map((row: any, idx: number) => {
        const issueNum = getIssueNumber(row);
        const dateStr = row.issue_date || '';
        const recipient = getRecipientDetails(row).replace(/\n/g, ' ');
        const dept = getDepartmentName(row).replace(/\n/g, ' ');
        const warehouse = row.warehouse?.name_en || '—';
        const itemCount = row.items?.length || 0;
        const totalQty = calculateTotalQty(row.items);
        const itemsDetail = (row.items || [])
          .map((i: any) => `${i.item?.name_en || 'Item'} (${i.quantity || 0})`)
          .join('; ');
        const issuedBy = getIssuedBy(row);
        const st = row.status || 'draft';

        return [
          idx + 1,
          `"${issueNum}"`,
          `"${dateStr}"`,
          `"${recipient.replace(/"/g, '""')}"`,
          `"${dept.replace(/"/g, '""')}"`,
          `"${warehouse.replace(/"/g, '""')}"`,
          itemCount,
          totalQty,
          `"${itemsDetail.replace(/"/g, '""')}"`,
          `"${issuedBy.replace(/"/g, '""')}"`,
          `"${st}"`
        ];
      });

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const todayStr = new Date().toISOString().slice(0, 10);

      link.setAttribute('href', url);
      link.setAttribute('download', `NPS_Inventory_Issue_Report_${todayStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${records.length} records to CSV`, { id: toastId });
    } catch (err: any) {
      console.error('CSV export error:', err);
      toast.error(err.message || 'Failed to export CSV.', { id: toastId });
    } finally {
      setIsExporting(false);
      setExportAction(null);
    }
  };

  const resetFilters = () => {
    setDepartmentId('');
    setStatus('');
    setFromDate('');
    setToDate('');
    setSearch('');
    setPage(1);
    setCachedExportIssues(null);
  };

  const hasActiveFilters = Boolean(departmentId || status || fromDate || toDate || search.trim());

  return (
    <div className="space-y-6 max-w-[1600px] pb-10">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#701a2b]">
            <Building2 size={14} /> Nikaweratiya Pradeshiya Sabha
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-0.5">
            Stock Issue Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official government inventory issue documentation, stock audit records & print-ready reports
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preview PDF */}
          <button
            onClick={() => handlePreviewPdf()}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#701a2b]/30 bg-card hover:bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50"
            title="Inspect formatted A4 document before printing or saving"
          >
            {isExporting && exportAction === 'preview' ? (
              <Loader2 size={16} className="animate-spin text-[#701a2b]" />
            ) : (
              <Eye size={16} className="text-[#701a2b] dark:text-rose-300" />
            )}
            <span>Preview PDF</span>
            <span className="hidden sm:inline-block text-[10px] bg-[#701a2b]/15 text-[#701a2b] dark:text-rose-200 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
              A4
            </span>
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#701a2b] to-[#8d2238] hover:from-[#5d1624] hover:to-[#701a2b] text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            title="Download official PDF report (A4)"
          >
            {isExporting && exportAction === 'download' ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <Download size={16} />
            )}
            <span>Download PDF</span>
          </button>

          {/* Print Report */}
          <button
            onClick={handlePrintReport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-all shadow-sm disabled:opacity-50"
            title="Print report directly with high-resolution vector layout"
          >
            {isExporting && exportAction === 'print' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Printer size={16} />
            )}
            <span>Print</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground text-sm font-medium hover:bg-muted transition-all shadow-sm disabled:opacity-50"
            title="Export raw data as spreadsheet CSV"
          >
            {isExporting && exportAction === 'csv' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* On-Screen Executive KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 print:hidden">
        {/* Total Records */}
        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Issues</span>
            <FileCheck2 size={16} className="text-[#701a2b]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {onScreenMetrics.totalRecords}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">orders</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Matched filter scope
          </div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#701a2b]" />
        </div>

        {/* Units Dispatched */}
        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Dispatched Units</span>
            <Package size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {onScreenMetrics.pageUnits.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">units</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Items issued in view
          </div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
        </div>

        {/* Unique Recipients */}
        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Recipients</span>
            <Users size={16} className="text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {onScreenMetrics.recipientsCount}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">officers/depts</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Unique consignees
          </div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Status Overview</span>
            <Layers size={16} className="text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm font-bold text-foreground">
              {onScreenMetrics.statusStr}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Audit workflow lifecycle
          </div>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by issue no, purpose, remarks..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <select
              value={departmentId}
              onChange={e => { setDepartmentId(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            >
              <option value="">All Departments</option>
              {departments?.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name_en}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
            >
              <option value="">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="approved">Approved</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Date Range: From */}
          <div className="relative">
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
              title="Issue Date From"
            />
          </div>

          {/* Date Range: To */}
          <div className="relative flex gap-2">
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#701a2b]/30"
              title="Issue Date To"
            />
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors flex-shrink-0"
              title="Refresh Report Data"
            >
              <RefreshCw size={15} className={`text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Active Filters Summary & Reset */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
              <span className="font-semibold text-foreground">Filtered Scope:</span>
              {departmentName && (
                <span className="bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 px-2 py-0.5 rounded-full font-medium">
                  Dept: {departmentName}
                </span>
              )}
              {status && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  Status: {status.toUpperCase()}
                </span>
              )}
              {fromDate && (
                <span className="bg-muted px-2 py-0.5 rounded-full">
                  From: {fromDate}
                </span>
              )}
              {toDate && (
                <span className="bg-muted px-2 py-0.5 rounded-full">
                  To: {toDate}
                </span>
              )}
              {search && (
                <span className="bg-muted px-2 py-0.5 rounded-full font-mono">
                  &ldquo;{search}&rdquo;
                </span>
              )}
            </div>

            <button
              onClick={resetFilters}
              className="text-[#701a2b] dark:text-rose-400 hover:underline font-medium text-xs ml-auto"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Report Records Table */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        {/* Table summary bar */}
        <div className="px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#701a2b]" />
            <span className="text-sm font-semibold">Stock Issue Records</span>
            <span className="text-xs bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 px-2.5 py-0.5 rounded-full font-bold">
              {meta?.total || 0} Records
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            {meta?.total ? (
              <span>Showing <strong>{meta.from}–{meta.to}</strong> of <strong>{meta.total}</strong> records</span>
            ) : (
              <span>No matching records</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm data-table">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground border-b border-border uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Issue No.</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Recipient / Officer</th>
                <th className="py-3 px-4">Department / Purpose</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Dispatched Items</th>
                <th className="py-3 px-4 text-right">Total Qty</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-muted/60 animate-pulse rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={32} className="text-muted-foreground/60" />
                      <p className="font-medium text-foreground">No stock issues match the selected criteria.</p>
                      <p className="text-xs max-w-sm">Try adjusting your date range, department selection, or search query.</p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="mt-2 text-xs text-[#701a2b] font-medium underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                issues.map((issue: any, idx: number) => {
                  const serial = (meta?.from || 1) + idx;
                  const totalUnits = calculateTotalQty(issue.items);
                  const itemsCount = issue.items?.length || 0;

                  return (
                    <tr key={issue.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground font-mono">
                        {serial}
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-muted/80 text-foreground px-2 py-0.5 rounded font-mono font-medium border border-border">
                          {getIssueNumber(issue)}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {issue.issue_date ? new Date(issue.issue_date).toLocaleDateString('en-LK') : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        <div className="line-clamp-2">{getOfficerName(issue)}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">{issue.department?.name_en || issue.project?.name_en || '—'}</div>
                        {issue.purpose && <div className="text-[11px] text-muted-foreground line-clamp-1 italic">{issue.purpose}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {issue.warehouse?.name_en || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {itemsCount > 0 ? (
                          <div className="space-y-0.5 max-w-xs">
                            <span className="font-medium text-foreground">
                              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                            </span>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">
                              {issue.items.map((i: any) => i.item?.name_en).filter(Boolean).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-right text-foreground font-mono">
                        {totalUnits.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                            issue.status === 'issued'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : issue.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : issue.status === 'approved'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {issue.status || 'draft'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && Boolean(meta && meta.last_page > 1) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-border bg-muted/10 print:hidden">
            <p className="text-xs text-muted-foreground">
              Showing <strong className="text-foreground">{meta?.from || 0}</strong> to <strong className="text-foreground">{meta?.to || 0}</strong> of <strong className="text-foreground">{meta?.total || 0}</strong> records
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 transition-colors font-medium"
              >
                Previous
              </button>
              <div className="px-3 py-1 text-xs font-semibold bg-[#701a2b] text-white rounded-lg">
                Page {page} of {meta?.last_page || 1}
              </div>
              <button
                onClick={() => setPage(p => Math.min(meta?.last_page || 1, p + 1))}
                disabled={page === (meta?.last_page || 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PDF PREVIEW MODAL */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 print:hidden">
          <div className="bg-card w-full max-w-6xl h-[92vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#701a2b] text-white flex items-center justify-center shadow-sm">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-foreground">
                      Document Preview — Official Inventory Issue Report
                    </h3>
                    <span className="text-[10px] bg-[#701a2b]/15 text-[#701a2b] dark:text-rose-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Official A4
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nikaweratiya Pradeshiya Sabha • Print-ready vector audit record
                  </p>
                </div>
              </div>

              {/* Toolbar Controls in Modal */}
              <div className="flex items-center gap-2">
                {/* Orientation Switcher */}
                <div className="flex items-center bg-muted rounded-xl p-1 border border-border text-xs">
                  <button
                    onClick={() => handlePreviewPdf('landscape')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      previewOrientation === 'landscape'
                        ? 'bg-[#701a2b] text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => handlePreviewPdf('portrait')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      previewOrientation === 'portrait'
                        ? 'bg-[#701a2b] text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Portrait
                  </button>
                </div>

                {/* Direct Print from Modal */}
                <button
                  onClick={handlePrintReport}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-all shadow-sm"
                  title="Print this document directly"
                >
                  <Printer size={14} />
                  Print
                </button>

                {/* Direct Download from Modal */}
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#701a2b] hover:bg-[#581522] text-white text-xs font-semibold transition-all shadow-sm"
                  title="Download PDF"
                >
                  <Download size={14} />
                  Download
                </button>

                {/* Close Modal */}
                <button
                  onClick={handleClosePreviewModal}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
                  title="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF Iframe */}
            <div className="flex-1 bg-zinc-950/20 p-3 sm:p-4 overflow-hidden relative">
              {previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  title="Inventory Issue Report PDF Preview"
                  className="w-full h-full rounded-xl border border-border shadow-md bg-white"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <Loader2 size={36} className="animate-spin text-[#701a2b]" />
                  <p className="text-sm font-semibold text-muted-foreground">Rendering print-ready PDF...</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
              <span>Ready for official filing, institutional record keeping & external audits</span>
              <span className="font-mono text-[11px]">Format: A4 (297 x 210 mm) • 300 DPI Vector Output</span>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED PRINT STYLING FOR BROWSER PRINT (Ctrl+P / window.print) */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 9pt !important;
          }
          nav,
          aside,
          header,
          .print\\:hidden,
          button,
          input,
          select {
            display: none !important;
          }
          .data-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .data-table thead {
            display: table-header-group !important;
          }
          .data-table tr {
            page-break-inside: avoid !important;
          }
          .data-table th,
          .data-table td {
            border: 0.5pt solid #cbd5e1 !important;
            padding: 4pt 6pt !important;
          }
        }
      `}</style>
    </div>
  );
}
