'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart,
  PackageMinus, ArrowRight, DollarSign, RefreshCw, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { DashboardAnalytics } from '@/types';
import { useOrgStore } from '@/store/org-store';

const COLORS = ['#006838', '#8DC63F', '#FDB913', '#00a651', '#2ecc71', '#f39c12'];

function StatCard({
  title, value, subtitle, icon: Icon, color, trend, trendValue,
}: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; trend?: 'up' | 'down' | 'neutral'; trendValue?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
      </div>
      {trendValue && (
        <div className="flex items-center gap-1.5 text-xs">
          {trend === 'up' ? (
            <TrendingUp size={14} className="text-green-500" />
          ) : trend === 'down' ? (
            <TrendingDown size={14} className="text-red-500" />
          ) : (
            <Activity size={14} className="text-muted-foreground" />
          )}
          <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}>
            {trendValue}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="shimmer h-4 w-28 rounded mb-3" />
      <div className="shimmer h-7 w-20 rounded mb-2" />
      <div className="shimmer h-3 w-24 rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const { org } = useOrgStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      // Dummy data to prevent 401 redirect while analytics query is rebuilt
      return {
        inventory: { total_value: 0, total_items: 0 },
        monthly_grn: { this_month: 0, last_month: 0, count: 0 },
        monthly_issues: { this_month: 0, last_month: 0, count: 0 },
        low_stock_count: 0,
        stock_by_category: [],
        monthly_trend: [],
        recent_activity: [],
      } as DashboardAnalytics;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const formatCurrency = (v: number) =>
    `${org?.currency_symbol || 'Rs.'} ${Number(v).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const grnTrend = data?.monthly_grn
    ? ((data.monthly_grn.this_month - data.monthly_grn.last_month) / Math.max(data.monthly_grn.last_month, 1)) * 100
    : 0;

  const issueTrend = data?.monthly_issues
    ? ((data.monthly_issues.this_month - data.monthly_issues.last_month) / Math.max(data.monthly_issues.last_month, 1)) * 100
    : 0;

  const stockCategoryData = (data?.stock_by_category || [])
    .slice(0, 6)
    .map((c: { category?: { name_en?: string }; count: number; value: number }) => ({
      name: c.category?.name_en || 'Uncategorized',
      count: c.count,
      value: c.value,
    }));

  const monthlyTrend = data?.monthly_trend || [];

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {org?.name_en || 'Government Store'} — Real-time inventory overview
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Inventory Value"
              value={formatCurrency(data?.inventory?.total_value || 0)}
              subtitle={`${data?.inventory?.total_items || 0} active items`}
              icon={DollarSign}
              color="#006838"
            />
            <StatCard
              title="GRN This Month"
              value={formatCurrency(data?.monthly_grn?.this_month || 0)}
              subtitle={`${data?.monthly_grn?.count || 0} deliveries received`}
              icon={ShoppingCart}
              color="#8DC63F"
              trend={grnTrend >= 0 ? 'up' : 'down'}
              trendValue={`${Math.abs(grnTrend).toFixed(1)}%`}
            />
            <StatCard
              title="Issues This Month"
              value={data?.monthly_issues?.this_month || 0}
              subtitle="Items dispatched"
              icon={PackageMinus}
              color="#FDB913"
              trend={issueTrend >= 0 ? 'up' : 'down'}
              trendValue={`${Math.abs(issueTrend).toFixed(1)}%`}
            />
            <StatCard
              title="Low Stock Alerts"
              value={data?.inventory?.low_stock_count || 0}
              subtitle={`${data?.inventory?.out_of_stock_count || 0} out of stock`}
              icon={AlertTriangle}
              color="#ef4444"
            />
          </>
        )}
      </div>

      {/* ── Alert banners ────────────────────────────────────────── */}
      {!isLoading && (data?.inventory?.out_of_stock_count || 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        >
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">
            <strong>{data?.inventory?.out_of_stock_count} items</strong> are out of stock and need urgent replenishment.
          </p>
          <Link
            href="/dashboard/reports/low-stock"
            className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </Link>
        </motion.div>
      )}

      {/* ── Charts Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2 rounded-xl bg-card border border-border p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Monthly Overview</h3>
              <p className="text-xs text-muted-foreground mt-0.5">GRN value vs stock issues — 6 months</p>
            </div>
          </div>
          {isLoading ? (
            <div className="shimmer h-48 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorGrn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006838" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#006838" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FDB913" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FDB913" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="grn_value" stroke="#006838" fill="url(#colorGrn)" name="GRN Value (Rs.)" strokeWidth={2} />
                <Area type="monotone" dataKey="issues_count" stroke="#FDB913" fill="url(#colorIssues)" name="Issues Count" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Category distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-card border border-border p-6 shadow-sm"
        >
          <h3 className="font-semibold text-foreground mb-1">Stock by Category</h3>
          <p className="text-xs text-muted-foreground mb-4">Value distribution</p>
          {isLoading || stockCategoryData.length === 0 ? (
            <div className="shimmer h-48 rounded-lg" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stockCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    paddingAngle={3}
                  >
                    {stockCategoryData.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {stockCategoryData.slice(0, 4).map((c: { name: string; count: number }, i: number) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground truncate flex-1">{c.name}</span>
                    <span className="font-medium">{c.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Recent activity tables ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent GRNs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-card border border-border shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Recent GRNs</h3>
            <Link href="/dashboard/stock/grn" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex gap-3 items-center">
                    <div className="shimmer h-3 w-24 rounded" />
                    <div className="shimmer h-3 w-16 rounded ml-auto" />
                  </div>
                ))
              : (data?.recent_grns || []).map((grn: { id: number; grn_number: string; supplier?: { company_name?: string }; total_amount: number; status: string }) => (
                  <div key={grn.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{grn.grn_number}</p>
                      <p className="text-xs text-muted-foreground">{grn.supplier?.company_name || 'Unknown supplier'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(grn.total_amount)}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        grn.status === 'approved' ? 'badge-success' : grn.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {grn.status}
                      </span>
                    </div>
                  </div>
                ))}
            {!isLoading && (data?.recent_grns || []).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No recent GRNs</p>
            )}
          </div>
        </motion.div>

        {/* Recent Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl bg-card border border-border shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Recent Stock Issues</h3>
            <Link href="/dashboard/stock/issue" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex gap-3 items-center">
                    <div className="shimmer h-3 w-24 rounded" />
                    <div className="shimmer h-3 w-16 rounded ml-auto" />
                  </div>
                ))
              : (data?.recent_issues || []).map((issue: { id: number; issue_number: string; department?: { name_en?: string }; status: string; issue_date: string }) => (
                  <div key={issue.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{issue.issue_number}</p>
                      <p className="text-xs text-muted-foreground">{issue.department?.name_en || 'Unknown dept.'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{new Date(issue.issue_date).toLocaleDateString('en-LK')}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${
                        issue.status === 'issued' ? 'badge-success' : issue.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {issue.status}
                      </span>
                    </div>
                  </div>
                ))}
            {!isLoading && (data?.recent_issues || []).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No recent issues</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl bg-card border border-border p-5 shadow-sm"
      >
        <h3 className="font-semibold text-sm text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'New GRN', href: '/dashboard/stock/grn/new', icon: ShoppingCart, color: '#006838' },
            { label: 'Issue Stock', href: '/dashboard/stock/issue/new', icon: PackageMinus, color: '#8DC63F' },
            { label: 'Purchase Request', href: '/dashboard/purchase/requests/new', icon: Package, color: '#FDB913' },
            { label: 'Stock Taking', href: '/dashboard/stock/taking/new', icon: Activity, color: '#3b82f6' },
            { label: 'Low Stock', href: '/dashboard/reports/low-stock', icon: AlertTriangle, color: '#ef4444' },
            { label: 'Analytics', href: '/dashboard/reports/analytics', icon: TrendingUp, color: '#8b5cf6' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition-all duration-200 group text-center"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}
              >
                <action.icon size={18} style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
