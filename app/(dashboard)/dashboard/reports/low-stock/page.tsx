'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, XCircle, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export default function LowStockPage() {
  const { hasPermission } = useAuthStore();
  const [tab, setTab] = useState<'low'|'zero'>('low');
  const { data: lowData, isLoading: lowLoading, refetch: refetchLow } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, category:categories(name_en), unit:units(symbol, name_en)');
      if (error) throw error;
      const filtered = (data || []).filter((item: any) => Number(item.current_quantity || 0) <= Number(item.reorder_level || 0) && Number(item.current_quantity || 0) > 0);
      return {
        data: { data: filtered },
        count: filtered.length,
      };
    },
  });
  const { data: zeroData, isLoading: zeroLoading } = useQuery({
    queryKey: ['zero-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, category:categories(name_en), unit:units(symbol, name_en)');
      if (error) throw error;
      const filtered = (data || []).filter((item: any) => Number(item.current_quantity || 0) <= 0);
      return {
        data: { data: filtered },
        count: filtered.length,
      };
    },
  });
  const items = tab === 'low' ? (lowData?.data?.data || []) : (zeroData?.data?.data || []);
  const count = tab === 'low' ? (lowData?.count || 0) : (zeroData?.count || 0);
  const isLoading = tab === 'low' ? lowLoading : zeroLoading;
  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold">Stock Alerts</h1><p className="text-sm text-muted-foreground mt-1">Items requiring urgent attention and replenishment</p></div>
        <div className="flex gap-2">
          {hasPermission('export-reports') && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-all"><Download size={14} /> Export CSV</button>
          )}
          <button onClick={() => refetchLow()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-all"><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{background:'#FDB91315',border:'1px solid #FDB91325'}}>
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <div><p className="text-xs text-muted-foreground">Low Stock Items</p><p className="text-2xl font-bold mt-0.5">{lowData?.count||0}</p></div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{background:'#ef444415',border:'1px solid #ef444425'}}>
            <XCircle size={20} className="text-red-500" />
          </div>
          <div><p className="text-xs text-muted-foreground">Out of Stock Items</p><p className="text-2xl font-bold mt-0.5">{zeroData?.count||0}</p></div>
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="border-b border-border flex">
          {[{key:'low',label:'Low Stock',icon:AlertTriangle},{key:'zero',label:'Out of Stock',icon:XCircle}].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'low'|'zero')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab===t.key?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <t.icon size={14} />{t.label}
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-muted">{t.key==='low'?lowData?.count||0:zeroData?.count||0}</span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Code</th><th>Item Name</th><th>Category</th><th>Current Stock</th><th>Min Stock</th><th>Reorder Level</th><th>Max Stock</th><th>Unit</th></tr></thead>
            <tbody>
              {isLoading ? Array.from({length:6}).map((_,i) => <tr key={i}>{Array.from({length:8}).map((_,j) => <td key={j}><div className="shimmer h-3.5 rounded w-full max-w-[80px]" /></td>)}</tr>) :
              items.map((item:any) => (
                <tr key={item.id}>
                  <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{item.item_code}</code></td>
                  <td><p className="font-medium text-sm">{item.name_en}</p>{item.name_si && <p className="text-xs text-muted-foreground">{item.name_si}</p>}</td>
                  <td className="text-sm text-muted-foreground">{item.category?.name_en||'—'}</td>
                  <td><span className={`font-bold text-sm ${Number(item.current_quantity)===0?'text-red-500':'text-amber-500'}`}>{Number(item.current_quantity).toLocaleString()}</span></td>
                  <td className="text-sm text-muted-foreground">{Number(item.minimum_stock).toLocaleString()}</td>
                  <td className="text-sm text-muted-foreground">{Number(item.reorder_level).toLocaleString()}</td>
                  <td className="text-sm text-muted-foreground">{Number(item.maximum_stock).toLocaleString()}</td>
                  <td className="text-sm text-muted-foreground">{item.unit?.symbol||item.unit?.name_en||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && items.length === 0 && <div className="text-center py-16"><p className="text-green-600 font-medium">✓ All items are well stocked!</p></div>}
      </div>
    </div>
  );
}