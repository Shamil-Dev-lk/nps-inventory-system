'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save, ScanLine, QrCode, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BarcodeScannerModal } from '@/components/scanner/BarcodeScannerModal';
import { Modal } from '@/components/ui/modal';

export default function NewStockIssuePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      issue_to_type: 'department',
      department_id: '',
      officer_id: '',
      project_id: '',
      warehouse_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      purpose: '',
      person_name: '',
      person_id_number: '',
      person_position: '',
      person_time: '',
      remarks: '',
      items: [{ item_id: '', quantity: 1, remarks: '' }]
    }
  });
  
  const issueToType = watch('issue_to_type');
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) throw error;
      return data || [];
    }
  });
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const handleBarcodeScan = (code: string) => {
    if (!code) return;
    const item = itemsList.find((i: any) => i.barcode === code || i.item_code === code);
    if (!item) {
      toast.error(`Item with barcode ${code} not found`);
      return;
    }

    const currentItems = watch('items');
    const existingIndex = currentItems.findIndex((i: any) => i.item_id == item.id);
    
    if (existingIndex >= 0) {
      const currentQty = parseFloat(String(currentItems[existingIndex].quantity || 0));
      // @ts-ignore
      setValue(`items.${existingIndex}.quantity`, currentQty + 1);
      toast.success(`Incremented quantity for ${item.name_en}`);
    } else {
      // If there's an empty first row, replace it
      if (currentItems.length === 1 && !currentItems[0].item_id) {
        remove(0);
      }
      append({ item_id: item.id, quantity: 1, remarks: '' });
      toast.success(`Added ${item.name_en}`);
    }
    setBarcodeInput('');
  };
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*');
      if (error) throw error;
      return data || [];
    }
  });
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*');
      if (error) throw error;
      return data || [];
    }
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data || [];
    }
  });
  const { data: itemsList = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select('*, unit:units(symbol)');
      if (error) throw error;
      return data || [];
    }
  });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { items, person_name, person_id_number, person_position, person_time, ...issueData } = formData;
      const { data: issue, error: issueErr } = await supabase.from('stock_issues').insert([{
        ...issueData,
        status: 'draft'
      }]).select().single();
      if (issueErr) throw issueErr;

      if (items && items.length > 0) {
        const issueItems = items.map((i: any) => ({
          stock_issue_id: issue.id,
          item_id: i.item_id,
          quantity: i.quantity,
          remarks: i.remarks
        }));
        const { error: itemsErr } = await supabase.from('stock_issue_items').insert(issueItems);
        if (itemsErr) throw itemsErr;
      }
      return issue;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['stock-issues'] });
      toast.success('Stock issue created successfully');
      router.push(`/dashboard/stock/issue/${data.id}?print=true`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create stock issue');
    },
  });

  const onSubmit = (data: any) => {
    if (!data.items || data.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    data.items = data.items.map((item: any) => ({
      ...item,
      quantity: parseFloat(item.quantity || 0),
    }));
    
    // Concatenate person details into remarks to avoid DB schema changes
    const pd = [
      data.person_name ? `Name: ${data.person_name}` : '',
      data.person_id_number ? `ID: ${data.person_id_number}` : '',
      data.person_position ? `Position: ${data.person_position}` : '',
      data.person_time ? `Time: ${data.person_time}` : ''
    ].filter(Boolean).join(' | ');

    if (pd) {
      data.remarks = `[Person Details] ${pd}\n${data.remarks || ''}`;
    }
    
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/stock/issue" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Stock Issue</h1>
          <p className="text-sm text-muted-foreground">Issue items from warehouse to a department, project, or officer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Issue Details */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Issue Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Issue Date *</label>
              <input type="date" {...register('issue_date', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg" />
              {errors.issue_date && <span className="text-xs text-red-500">Required</span>}
            </div>
            
            <div>
              <label className="text-sm font-medium">From Warehouse *</label>
              <select {...register('warehouse_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="">Select Warehouse</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name_en}</option>)}
              </select>
              {errors.warehouse_id && <span className="text-xs text-red-500">Required</span>}
            </div>

            <div>
              <label className="text-sm font-medium">Issue To Type *</label>
              <select {...register('issue_to_type')} className="w-full px-3 py-2 mt-1 border rounded-lg">
                <option value="department">Department</option>
                <option value="project">Project</option>
                <option value="officer">Officer</option>
                <option value="customer">Customer (CRM)</option>
              </select>
            </div>

            {issueToType === 'department' && (
              <div>
                <label className="text-sm font-medium">Select Department *</label>
                <select {...register('department_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                  <option value="">Select Department</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name_en}</option>)}
                </select>
              </div>
            )}

            {issueToType === 'project' && (
              <div>
                <label className="text-sm font-medium">Select Project *</label>
                <select {...register('project_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                  <option value="">Select Project</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name_en}</option>)}
                </select>
              </div>
            )}

            {issueToType === 'officer' && (
              <div>
                <label className="text-sm font-medium">Select Officer *</label>
                <select {...register('officer_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                  <option value="">Select Officer</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}

            {issueToType === 'customer' && (
              <div>
                <label className="text-sm font-medium">Select Customer *</label>
                <select {...register('customer_id', { required: true })} className="w-full px-3 py-2 mt-1 border rounded-lg">
                  <option value="">Select Customer</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                </select>
              </div>
            )}

            <div className="md:col-span-3">
              <label className="text-sm font-medium">Purpose</label>
              <input {...register('purpose')} placeholder="Why are these items being issued?" className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-lg font-semibold shrink-0">Items to Issue</h2>
            
            <div className="flex flex-1 max-w-md items-center gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Scan or type barcode, then press Enter..." 
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeScan(barcodeInput);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-primary/30"
                />
                <ScanLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <button 
                type="button" 
                onClick={() => setIsScannerOpen(true)}
                className="p-1.5 border rounded-md bg-background hover:bg-muted text-muted-foreground transition-colors"
                title="Scan with Camera"
              >
                <QrCode size={18} />
              </button>
            </div>

            <button 
              type="button" 
              onClick={() => append({ item_id: '', quantity: 1, remarks: '' })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors shrink-0"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
          
          <BarcodeScannerModal 
            isOpen={isScannerOpen} 
            onClose={() => setIsScannerOpen(false)} 
            onScan={handleBarcodeScan} 
          />
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Item *</th>
                  <th className="px-4 py-3 font-medium w-32">Qty to Issue *</th>
                  <th className="px-4 py-3 font-medium w-48">Remarks</th>
                  <th className="px-4 py-3 font-medium w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((field, index) => {
                  // Find the selected item to display its available stock
                  const selectedItemId = watch(`items.${index}.item_id`);
                  const selectedItem = itemsList.find((i: any) => i.id == selectedItemId);
                  
                  return (
                    <tr key={field.id}>
                      <td className="px-4 py-3">
                        <select {...register(`items.${index}.item_id`, { required: true })} className="w-full px-2 py-1.5 border rounded-md bg-background">
                          <option value="">Select Item</option>
                          {itemsList.map((item: any) => <option key={item.id} value={item.id}>{item.item_code} - {item.name_en} ({item.available_quantity} available)</option>)}
                        </select>
                        {selectedItem && (
                          <div className="text-xs text-muted-foreground mt-1 px-1">
                            Stock: {selectedItem.available_quantity} {selectedItem.unit?.symbol}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top pt-3">
                        <input type="number" step="0.001" min="0.001" {...register(`items.${index}.quantity`, { required: true })} className="w-full px-2 py-1.5 border rounded-md bg-background" />
                      </td>
                      <td className="px-4 py-3 align-top pt-3">
                        <input {...register(`items.${index}.remarks`)} placeholder="Details..." className="w-full px-2 py-1.5 border rounded-md bg-background" />
                      </td>
                      <td className="px-4 py-3 text-center align-top pt-3">
                        <button 
                          type="button" 
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30 mt-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold">Person Details (Recipient)</h2>
            <div className="w-full sm:w-auto flex items-center gap-2">
              <select 
                className="w-full sm:w-64 px-3 py-1.5 text-sm border rounded-lg bg-muted/30 focus:ring-2 focus:ring-primary/30"
                onChange={(e) => {
                  const cId = e.target.value;
                  if (cId) {
                    const customer = customers.find((c: any) => c.id == cId);
                    if (customer) {
                      setValue('person_name', customer.name || '');
                      setValue('person_id_number', customer.nic || customer.phone || '');
                      setValue('person_position', customer.designation || 'Customer');
                    }
                  } else {
                    setValue('person_name', '');
                    setValue('person_id_number', '');
                    setValue('person_position', '');
                  }
                }}
              >
                <option value="">Select Customer</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
              </select>
              <button 
                type="button"
                onClick={() => setIsCustomerSearchOpen(true)}
                className="p-1.5 border rounded-lg bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shrink-0" 
                title="Search Customers"
              >
                <Search size={16} />
              </button>
              <button 
                type="button"
                onClick={() => router.push('/dashboard/customers/new')}
                className="p-1.5 border rounded-lg bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shrink-0" 
                title="Add New Customer"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input {...register('person_name')} placeholder="Full Name" className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">ID Number</label>
              <input {...register('person_id_number')} placeholder="NIC / Emp ID" className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Job Position</label>
              <input {...register('person_position')} placeholder="e.g. Technician" className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <input type="time" {...register('person_time')} className="w-full px-3 py-2 mt-1 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Additional Remarks</label>
            <textarea {...register('remarks')} rows={1} placeholder="Any other details..." className="w-full px-3 py-2 mt-1 border rounded-lg"></textarea>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/stock/issue" className="px-6 py-2 border rounded-lg hover:bg-muted font-medium transition-colors">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
            <Save size={18} />
            {createMutation.isPending ? 'Saving...' : 'Issue Stock'}
          </button>
        </div>
      </form>

      <Modal isOpen={isCustomerSearchOpen} onClose={() => setIsCustomerSearchOpen(false)} title="Search Customer" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <input 
            type="search" 
            placeholder="Search by ID, Name, or Job Role..." 
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/30"
          />
          <div className="max-h-60 overflow-y-auto divide-y border rounded-lg">
            {customers.filter((c: any) => 
              c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || 
              c.nic?.toLowerCase().includes(customerSearch.toLowerCase()) ||
              c.designation?.toLowerCase().includes(customerSearch.toLowerCase())
            ).map((c: any) => (
              <button
                key={c.id}
                type="button"
                className="w-full flex items-center justify-between p-3 hover:bg-muted text-left transition-colors"
                onClick={() => {
                  setValue('person_name', c.name || '');
                  setValue('person_id_number', c.nic || c.phone || '');
                  setValue('person_position', c.designation || 'Customer');
                  setIsCustomerSearchOpen(false);
                }}
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.designation || 'No Role'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{c.nic || 'No ID'}</p>
                </div>
              </button>
            ))}
            {customers.length === 0 && <p className="p-4 text-center text-muted-foreground">No customers found.</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
