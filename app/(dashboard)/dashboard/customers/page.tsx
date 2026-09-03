'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Eye, Printer, Download, Upload, FileText, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  nic?: string;
  designation?: string;
}

interface ParsedCustomerRow {
  rowIndex: number;
  name: string;
  email: string;
  phone: string;
  nic: string;
  designation: string;
  address: string;
  status: 'valid' | 'duplicate' | 'invalid';
  reason?: string;
}

// Normalization Helpers for Duplicate Checking
function normalizeNIC(nic?: string | null): string {
  if (!nic) return '';
  return String(nic).trim().toUpperCase().replace(/[\s-]/g, '');
}

function normalizeName(name?: string | null): string {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^(mr|mrs|ms|dr|prof|rev)\.?\s+/i, '')
    .replace(/\s+/g, '');
}

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  // Import Modal States
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCustomerRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ total: number; added: number; skipped: number } | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully.');
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to delete customer.'),
  });

  const handleDelete = (customer: Customer) => {
    if (confirm(`Delete "${customer.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  // ============================================================
  // Excel File Parser & CRITICAL DUPLICATE PREVENTION ENGINE
  // Priority 1: NIC / ID Number
  // Priority 2: Name (if NIC empty)
  // Intra-file duplicates check
  // ============================================================
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setIsParsing(true);
    setImportSummary(null);

    try {
      // 1. Fetch current database records for pre-import duplicate check
      const { data: dbCustomers } = await supabase.from('customers').select('name, nic');
      
      const dbNICs = new Set<string>();
      const dbNames = new Set<string>();

      (dbCustomers || []).forEach((c: any) => {
        const n = normalizeNIC(c.nic);
        if (n) dbNICs.add(n);
        const nameNorm = normalizeName(c.name);
        if (nameNorm) dbNames.add(nameNorm);
      });

      // 2. Read uploaded file via XLSX
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

      const seenNICsInFile = new Set<string>();
      const seenNamesInFile = new Set<string>();

      const rows: ParsedCustomerRow[] = [];

      rawJson.forEach((row, idx) => {
        // Map columns flexible with Sinhala / English headers
        let name = String(row['name'] || row['Name'] || row['Full Name'] || row['නම'] || row['Member Name'] || '').trim();
        let nic = String(row['nic'] || row['NIC'] || row['ID Number'] || row['ජා.හැ.ප. අංකය'] || row['National ID'] || '').trim();
        let email = String(row['email'] || row['Email'] || row['විද්‍යුත් තැපෑල'] || '').trim();
        let phone = String(row['phone'] || row['Phone'] || row['Mobile'] || row['දුරකථනය'] || '').trim();
        let designation = String(row['designation'] || row['Designation'] || row['Job Role'] || row['තනතුර'] || '').trim();
        let address = String(row['address'] || row['Address'] || row['ලිපිනය'] || '').trim();

        if (!name) return; // Skip entirely blank name rows

        const normNic = normalizeNIC(nic);
        const normName = normalizeName(name);

        let isDuplicate = false;
        let reason = '';

        // Priority 1: Check NIC (if present)
        if (normNic) {
          if (dbNICs.has(normNic) || seenNICsInFile.has(normNic)) {
            isDuplicate = true;
            reason = 'ALREADY EXISTS (NIC matched)';
          }
        }

        // Priority 2: Check Name (if NIC is empty)
        if (!isDuplicate && !normNic && normName) {
          if (dbNames.has(normName) || seenNamesInFile.has(normName)) {
            isDuplicate = true;
            reason = 'ALREADY EXISTS (Name matched)';
          }
        }

        if (isDuplicate) {
          rows.push({
            rowIndex: idx + 1,
            name, email, phone, nic, designation, address,
            status: 'duplicate',
            reason
          });
        } else {
          // Valid new record
          if (normNic) seenNICsInFile.add(normNic);
          if (normName) seenNamesInFile.add(normName);
          rows.push({
            rowIndex: idx + 1,
            name, email, phone, nic, designation, address,
            status: 'valid'
          });
        }
      });

      setParsedRows(rows);
    } catch (err: any) {
      toast.error('Failed to parse Excel file: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  // ============================================================
  // Execute Import with FINAL DATABASE SAFETY CHECK
  // ============================================================
  const executeImport = async () => {
    const validRows = parsedRows.filter((r) => r.status === 'valid');

    // Rule: If ALL records already exist, DO NOT INSERT
    if (validRows.length === 0) {
      toast.error('All members already exist. Nothing new to import.');
      setImportSummary({
        total: parsedRows.length,
        added: 0,
        skipped: parsedRows.length
      });
      return;
    }

    setIsImporting(true);
    let addedCount = 0;
    let skippedCount = 0;

    try {
      for (const row of validRows) {
        const normNic = normalizeNIC(row.nic);
        const normName = normalizeName(row.name);

        // FINAL DATABASE SAFETY CHECK immediately before creating each member record
        let isDbDuplicate = false;

        // 1. Check NIC if present
        if (normNic) {
          const { data: existingNic } = await supabase
            .from('customers')
            .select('id')
            .ilike('nic', normNic)
            .limit(1);
          if (existingNic && existingNic.length > 0) isDbDuplicate = true;
        }

        // 2. Check Name if NIC is empty
        if (!isDbDuplicate && !normNic && normName) {
          const { data: existingName } = await supabase
            .from('customers')
            .select('id')
            .ilike('name', row.name.trim())
            .limit(1);
          if (existingName && existingName.length > 0) isDbDuplicate = true;
        }

        if (isDbDuplicate) {
          // DO NOT INSERT, DO NOT UPDATE, DO NOT OVERWRITE
          skippedCount++;
          continue;
        }

        // Insert new record into database
        const { error } = await supabase.from('customers').insert([{
          name: row.name,
          email: row.email,
          phone: row.phone,
          nic: row.nic,
          designation: row.designation,
          address: row.address
        }]);

        if (!error) addedCount++;
        else skippedCount++;
      }

      const totalDuplicates = parsedRows.filter((r) => r.status === 'duplicate').length + skippedCount;
      setImportSummary({
        total: parsedRows.length,
        added: addedCount,
        skipped: totalDuplicates
      });

      qc.invalidateQueries({ queryKey: ['customers'] });

      if (addedCount > 0) {
        toast.success(`Imported ${addedCount} new members successfully! (${totalDuplicates} skipped)`);
      } else {
        toast.error('All members already exist. Nothing new to import.');
      }
    } catch (err: any) {
      toast.error('Import failed: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredCustomers = customers.filter((c: Customer) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase()) ||
    c.nic?.toLowerCase().includes(search.toLowerCase())
  );

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const dupCount = parsedRows.filter((r) => r.status === 'duplicate').length;

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setImportOpen(true);
              setParsedRows([]);
              setImportFile(null);
              setImportSummary(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted transition-all shadow-sm"
          >
            <Upload size={15} />
            Import Excel
          </button>
          <Link
            href="/dashboard/customers/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={15} />
            Add Customer
          </Link>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <input
          type="search"
          placeholder="Search by name, email, phone, or ID Number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>ID Number</th>
                <th>Job Role</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}><div className="shimmer h-4 rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <Users size={32} className="mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer: Customer) => (
                  <tr key={customer.id}>
                    <td className="font-medium">
                      <Link 
                        href={`/dashboard/customers/view/?id=${customer.id}`} 
                        className="hover:underline hover:text-primary transition-colors text-foreground font-semibold"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td>{customer.email || '—'}</td>
                    <td>{customer.phone || '—'}</td>
                    <td>{customer.nic || '—'}</td>
                    <td>{customer.designation || '—'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/customers/view/?id=${customer.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-green-500" title="View Customer">
                          <Eye size={15} />
                        </Link>
                        <button onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=customer&id=${customer.id}`, '_blank')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-purple-500" title="Print Receipt">
                          <Printer size={15} />
                        </button>
                        <button 
                          onClick={() => window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/receipts/print/?type=customer&id=${customer.id}&action=download`, '_blank')}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-indigo-500" title="Download Receipt"
                        >
                          <Download size={15} />
                        </button>
                        <Link href={`/dashboard/customers/edit/?id=${customer.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-500" title="Edit Customer">
                          <Edit size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
                          title="Delete Customer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EXCEL IMPORT MODAL WITH CRITICAL DUPLICATE PREVENTION        */}
      {/* ============================================================ */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">Import Members / Customers</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Upload CSV or XLSX file — Automatic duplicate prevention active</p>
              </div>
              <button onClick={() => setImportOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            {!importSummary ? (
              <>
                {/* File Upload Box */}
                <div className="border-2 border-dashed border-border hover:border-primary rounded-xl p-8 text-center cursor-pointer relative bg-muted/20">
                  <input
                    type="file"
                    accept=".csv, .xls, .xlsx"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload size={36} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-semibold">{importFile ? importFile.name : 'Click to select or drag & drop Excel / CSV file'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Columns: Name, NIC / ID Number, Phone, Email, Designation, Address</p>
                </div>

                {isParsing && (
                  <div className="flex items-center justify-center gap-2 text-sm py-4">
                    <Loader2 size={18} className="animate-spin text-primary" />
                    <span>Parsing file & checking duplicates against database...</span>
                  </div>
                )}

                {/* Parsed Results Preview */}
                {parsedRows.length > 0 && !isParsing && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-muted/40 p-3 rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground">Total Rows</p>
                        <p className="text-lg font-bold">{parsedRows.length}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 text-center">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Genuinely New</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{validCount}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 text-center col-span-2 sm:col-span-1">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Already Exists (Skip)</p>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{dupCount}</p>
                      </div>
                    </div>

                    {validCount === 0 && (
                      <div className="p-4 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 rounded-xl text-amber-800 dark:text-amber-300 text-sm font-semibold flex items-center gap-2">
                        <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                        <span>All members already exist. Nothing new to import.</span>
                      </div>
                    )}

                    {/* Preview Table */}
                    <div className="max-h-60 overflow-y-auto border rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2">Row</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Name</th>
                            <th className="p-2">NIC / ID</th>
                            <th className="p-2">Phone</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {parsedRows.slice(0, 100).map((row) => (
                            <tr key={row.rowIndex} className={row.status === 'duplicate' ? 'bg-amber-500/10' : ''}>
                              <td className="p-2">{row.rowIndex}</td>
                              <td className="p-2 font-semibold">
                                {row.status === 'valid' ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> NEW</span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle size={12} /> ALREADY EXISTS</span>
                                )}
                              </td>
                              <td className="p-2 font-medium">{row.name}</td>
                              <td className="p-2 font-mono">{row.nic || '—'}</td>
                              <td className="p-2">{row.phone || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Summary Result */
              <div className="text-center py-6 space-y-4">
                {importSummary.added > 0 ? (
                  <>
                    <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
                    <h3 className="text-xl font-bold">Import Completed Successfully</h3>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={48} className="mx-auto text-amber-500" />
                    <h3 className="text-xl font-bold text-amber-600">All members already exist. Nothing new to import.</h3>
                  </>
                )}

                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{importSummary.total}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium">Added</p>
                    <p className="text-lg font-bold text-emerald-600">{importSummary.added}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium">Skipped</p>
                    <p className="text-lg font-bold text-amber-600">{importSummary.skipped}</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={() => setImportOpen(false)}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {!importSummary && (
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => setImportOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={executeImport}
                  disabled={validCount === 0 || isImporting || isParsing}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                >
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isImporting ? 'Importing...' : `Import ${validCount} New Members`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

