'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, TruckIcon, ArrowRightLeft,
  ClipboardList, BarChart3, Settings, Users, Building2, LogOut,
  ChevronDown, Bell, Search, Sun, Moon, Globe, Bot, FileText,
  Boxes, Tags, Ruler, Bookmark, MapPin, Briefcase, AlertTriangle,
  ClipboardCheck, ArrowLeftRight, PackageMinus, PackagePlus,
  Warehouse as WarehouseIcon, Receipt, CreditCard, ScanLine,
  ShieldCheck, QrCode, Monitor, Layers, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useOrgStore } from '@/store/org-store';
import type { Organization } from '@/types';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
  permission?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Store Setup',
    icon: Building2,
    children: [
      { label: 'Categories', href: '/dashboard/store/categories', icon: Tags, permission: 'manage-categories' },
      { label: 'Sub Categories', href: '/dashboard/store/sub-categories', icon: Tags, permission: 'manage-categories' },
      { label: 'Units', href: '/dashboard/store/units', icon: Ruler, permission: 'manage-units' },
      { label: 'Brands', href: '/dashboard/store/brands', icon: Bookmark, permission: 'manage-brands' },
      { label: 'Suppliers', href: '/dashboard/store/suppliers', icon: TruckIcon, permission: 'manage-suppliers' },
      { label: 'Customers', href: '/dashboard/customers', icon: Users, permission: 'manage-customers' },
      { label: 'Warehouses', href: '/dashboard/store/warehouses', icon: WarehouseIcon, permission: 'manage-warehouses' },
      { label: 'Departments', href: '/dashboard/store/departments', icon: Briefcase, permission: 'manage-departments' },
      { label: 'Projects', href: '/dashboard/store/projects', icon: MapPin, permission: 'manage-projects' },
    ],
  },
  { label: 'Items', href: '/dashboard/items', icon: Package, permission: 'view-items' },
  { label: 'Assets', href: '/dashboard/assets', icon: Monitor, permission: 'view-assets' },
  {
    label: 'Purchase',
    icon: ShoppingCart,
    children: [
      { label: 'Purchase Requests', href: '/dashboard/purchase/requests', icon: ClipboardList, permission: 'view-purchase-requests' },
      { label: 'Purchase Orders', href: '/dashboard/purchase/orders', icon: FileText, permission: 'view-purchase-orders' },
    ],
  },
  {
    label: 'Stock',
    icon: Boxes,
    children: [
      { label: 'GRN', href: '/dashboard/stock/grn', icon: PackagePlus, permission: 'view-grn' },
      { label: 'Issue', href: '/dashboard/stock/issue', icon: PackageMinus, permission: 'view-stock-issues' },
      { label: 'Return', href: '/dashboard/stock/return', icon: ArrowLeftRight, permission: 'view-stock-returns' },
      { label: 'Transfer', href: '/dashboard/stock/transfer', icon: ArrowRightLeft, permission: 'view-stock-transfers' },
      { label: 'Adjustment', href: '/dashboard/stock/adjustment', icon: ClipboardCheck, permission: 'view-stock-adjustments' },
      { label: 'Stock Taking', href: '/dashboard/stock/taking', icon: ScanLine, permission: 'view-stock-taking' },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    permission: 'view-reports',
    children: [
      { label: 'Current Stock', href: '/dashboard/reports/current-stock', icon: Package },
      { label: 'Stock Ledger', href: '/dashboard/reports/stock-ledger', icon: FileText },
      { label: 'GRN Report', href: '/dashboard/reports/grn', icon: Receipt },
      { label: 'Issue Report', href: '/dashboard/reports/issue', icon: PackageMinus },
      { label: 'Low Stock Alert', href: '/dashboard/reports/low-stock', icon: AlertTriangle },
      { label: 'Analytics', href: '/dashboard/reports/analytics', icon: BarChart3 },
    ],
  },
  { label: 'Print Center', href: '/dashboard/print', icon: Printer },
  { label: 'AI Assistant', href: '/dashboard/ai', icon: Bot, permission: 'use-ai-features' },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'Organization', href: '/dashboard/settings/organization', icon: Building2, permission: 'manage-settings' },
      { label: 'Users', href: '/dashboard/settings/users', icon: Users, permission: 'manage-users' },
      { label: 'Roles', href: '/dashboard/settings/roles', icon: ShieldCheck, permission: 'manage-roles' },
      { label: 'Audit Log', href: '/dashboard/settings/audit-log', icon: ClipboardList, permission: 'view-audit-log' },
    ],
  },
];

function NavItemComp({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const { hasPermission } = useAuthStore();
  const [open, setOpen] = React.useState(false);

  if (item.permission && !hasPermission(item.permission)) return null;

  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false;
  const childActive = item.children?.some((c) => c.href && (pathname === c.href || pathname.startsWith(c.href + '/')));

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`nav-item w-full justify-between ${childActive ? 'text-sidebar-foreground bg-sidebar-accent' : ''}`}
        >
          <span className="flex items-center gap-3">
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </span>
          {!collapsed && (
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${open || childActive ? 'rotate-180' : ''}`}
            />
          )}
        </button>
        <AnimatePresence>
          {(open || childActive) && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border/50 pl-3">
                {item.children.map((child) => (
                  <NavItemComp key={child.label} item={child} collapsed={false} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={`nav-item ${isActive ? 'active' : ''}`}
    >
      <item.icon size={18} className="shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

import { GlobalScanner } from '@/components/scanner/GlobalScanner';
import { CommandPalette } from '@/components/scanner/CommandPalette';
import React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { setOrg, org } = useOrgStore();
  const { theme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const [isHydrated, setIsHydrated] = React.useState(false);

  const { data: orgData } = useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get('/v1/organization').then((r) => r.data.data as Organization),
    staleTime: Infinity,
  });

  useEffect(() => { if (orgData) setOrg(orgData); }, [orgData, setOrg]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isHydrated, router]);

  // Hardware Scanner Integration
  useEffect(() => {
    let barcode = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const currentTime = Date.now();
      
      // If typing speed is slower than 30ms, it's a human typing, reset.
      if (currentTime - lastKeyTime > 30 && barcode.length > 0) {
        barcode = '';
      }
      
      lastKeyTime = currentTime;

      if (e.key === 'Enter' && barcode.length > 3) {
        // Scanner finished
        toast.loading(`Processing scanned code: ${barcode}`);
        api.post('/v1/search/scan', { code: barcode })
          .then(res => {
            const { type, id } = res.data.data;
            toast.dismiss();
            toast.success(`Scanned: ${type}`);
            if (type === 'item') router.push(`/dashboard/items/${id}`);
            else if (type === 'asset') router.push(`/dashboard/assets/${id}`);
            else if (type === 'grn') router.push(`/dashboard/stock/grn/${id}`);
            else if (type === 'po') router.push(`/dashboard/purchase/orders/${id}`);
          })
          .catch(() => {
            toast.dismiss();
            toast.error(`Unknown barcode: ${barcode}`);
          });
        barcode = '';
        e.preventDefault();
      } else if (e.key.length === 1) { // Normal char
        barcode += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post('/v1/auth/logout');
    } catch {
      // ignore
    } finally {
      logout();
      toast.success('Logged out successfully');
      router.replace('/login');
    }
  };

  const pathname = usePathname();

  if (!isHydrated) return null; // Wait for Zustand hydration
  if (!isAuthenticated || !user) return null;

  if (pathname?.includes('/receipts/print')) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible bg-background">
      <GlobalScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
      <CommandPalette />

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-full overflow-hidden flex-shrink-0 print:hidden"
        style={{ background: 'hsl(var(--sidebar-background))' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border/50">
          <div className="w-10 h-10 shrink-0 bg-white rounded-full p-1 border border-sidebar-border shadow-sm flex items-center justify-center overflow-hidden">
            <img src={org?.official_logo_url || '/logo.png'} alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sidebar-foreground font-bold text-sm leading-tight truncate max-w-[160px]">
                {org?.system_name || 'ANTIGRAVITY'}
              </p>
              <p className="text-sidebar-foreground/50 text-[10px] truncate max-w-[160px]">
                {org?.short_name || 'Gov. Store'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => (
            <NavItemComp key={item.label} item={item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {/* User + collapse */}
        <div className="border-t border-sidebar-border/50 p-3 space-y-2">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sidebar-foreground text-xs font-medium truncate">{user.name}</p>
                <p className="text-sidebar-foreground/50 text-[10px] truncate">{user.roles?.[0]}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 gap-3 shrink-0 sticky top-0 z-10 print:hidden">
          {/* Search trigger */}
          <div className="flex-1 max-w-md">
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-lg border border-input bg-muted/50 hover:bg-muted text-muted-foreground transition-all"
            >
              <div className="flex items-center gap-2">
                <Search size={15} />
                <span>Search items, actions...</span>
              </div>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* QR Scanner */}
            <button
              onClick={() => setScannerOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              title="Scan QR Code"
            >
              <QrCode size={18} />
              <span className="hidden md:block text-xs font-medium">Scan QR</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            </button>

            {/* User avatar */}
            <button className="flex items-center gap-2 ml-1 pl-2 border-l border-border">
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-foreground leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user.roles?.[0]?.replace(/-/g, ' ')}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 flex flex-col overflow-y-auto print:overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 flex-1 print:p-0 print:m-0"
          >
            {children}
          </motion.div>
          <footer className={`py-3 text-center print:hidden mt-auto w-full ${org?.footer_size || 'text-xs'} ${org?.footer_font || ''} ${org?.footer_color || 'text-muted-foreground/50'}`}>
            {org?.footer_text || 'Shamil - Dev'}
          </footer>
        </main>
      </div>
    </div>
  );
}
