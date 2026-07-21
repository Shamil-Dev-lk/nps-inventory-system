'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, AlertTriangle, DollarSign, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useOrgStore } from '@/store/org-store';

const COLORS = ['#006838','#8DC63F','#FDB913','#00a651','#2ecc71','#f39c12'];

export default function AnalyticsPage() {
  const { org } = useOrgStore();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => api.get('/v1/reports/analytics').then(r => r.data),
  });
  const fmt = (v: number) => `Rs. ${Number(v).toLocaleString('en-LK', {minimumFractionDigits:0,maximumFractionDigits:0})}`;
  const trend = data?.monthly_trend || [];
  const categories = (data?.stock_by_category || []).slice(0,6).map((c:any) => ({ name: c.category?.name_en || 'Other', count: c.count, value: Math.round(c.value) }));
  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold">Analytics & Reports</h1><p className="text-sm text-muted-foreground mt-1">Inventory performance and procurement trends</p></div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-all"><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Items', value: data?.inventory?.total_items||0, icon:Package, color:'#006838' },
          { label:'Total Value', value: fmt(data?.inventory?.total_value||0), icon:DollarSign, color:'#8DC63F' },
          { label:'Low Stock', value: data?.inventory?.low_stock_count||0, icon:AlertTriangle, color:'#FDB913' },
          { label:'Out of Stock', value: data?.inventory?.out_of_stock_count||0, icon:TrendingUp, color:'#ef4444' },
        ].map(s => (
          <div key={s.label} className="stat-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:`${s.color}15`,border:`1px solid ${s.color}25`}}>
              <s.icon size={20} style={{color:s.color}} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="rounded-xl bg-card border border-border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Monthly GRN Value Trend</h3>
          {isLoading ? <div className="shimmer h-48 rounded-lg" /> :
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}} />
              <YAxis tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}} />
              <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:8,fontSize:12}} />
              <Bar dataKey="grn_value" fill="#006838" radius={[4,4,0,0]} name="GRN Value (Rs.)" />
            </BarChart>
          </ResponsiveContainer>}
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="rounded-xl bg-card border border-border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Stock Issues Trend</h3>
          {isLoading ? <div className="shimmer h-48 rounded-lg" /> :
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}} />
              <YAxis tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}} />
              <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:8,fontSize:12}} />
              <Line type="monotone" dataKey="issues_count" stroke="#FDB913" strokeWidth={2} dot={{r:4,fill:'#FDB913'}} name="Issues Count" />
            </LineChart>
          </ResponsiveContainer>}
        </motion.div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="rounded-xl bg-card border border-border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Inventory Distribution by Category</h3>
          {isLoading || categories.length === 0 ? <div className="shimmer h-48 rounded-lg" /> :
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={categories} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" paddingAngle={3}>
                  {categories.map((_:unknown,i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:8,fontSize:12}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categories.map((c:any,i:number) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{background:COLORS[i%COLORS.length]}} />
                    <span className="text-muted-foreground truncate max-w-[100px]">{c.name}</span>
                  </div>
                  <span className="font-semibold">{c.count} items</span>
                </div>
              ))}
            </div>
          </div>}
        </motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="rounded-xl bg-card border border-border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Category Value Comparison</h3>
          {isLoading || categories.length === 0 ? <div className="shimmer h-48 rounded-lg" /> :
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} />
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}} width={90} />
              <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:8,fontSize:12}} />
              <Bar dataKey="value" fill="#8DC63F" radius={[0,4,4,0]} name="Value (Rs.)" />
            </BarChart>
          </ResponsiveContainer>}
        </motion.div>
      </div>
    </div>
  );
}