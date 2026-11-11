/**
 * Granular Report Permissions System for NPS Inventory Management
 * 
 * Supports:
 * - Master Reports Page Access ('reports.page.access')
 * - Individual report categories: issue, stock, stock-ledger, grn, low-stock, analytics
 * - Granular action permissions per report: view, pdf, print, excel
 * - Strict isolation for Trainee users (zero default report access)
 * - Complete Super Admin bypass
 */

export const REPORT_PAGE_ACCESS_PERMISSION = 'reports.page.access';

export interface ReportCategory {
  id: string; // 'issue' | 'stock' | 'stock-ledger' | 'grn' | 'low-stock' | 'analytics'
  name: string;
  nameSi: string;
  description: string;
  path: string;
  actions: {
    view: string;
    pdf: string;
    print: string;
    excel: string;
  };
}

export const SYSTEM_REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'issue',
    name: 'Issue Reports',
    nameSi: 'නිකුත් කිරීම් වාර්තා (Issue Reports)',
    description: 'Inventory issue vouchers, department dispatches, and receiver tracking',
    path: '/dashboard/reports/issue',
    actions: {
      view: 'reports.issue.view',
      pdf: 'reports.issue.pdf',
      print: 'reports.issue.print',
      excel: 'reports.issue.excel',
    },
  },
  {
    id: 'stock',
    name: 'Current Stock Reports',
    nameSi: 'වත්මන් තොග වාර්තා (Current Stock)',
    description: 'Live item inventory balances, category levels, and warehouse stock',
    path: '/dashboard/reports/current-stock',
    actions: {
      view: 'reports.stock.view',
      pdf: 'reports.stock.pdf',
      print: 'reports.stock.print',
      excel: 'reports.stock.excel',
    },
  },
  {
    id: 'stock-ledger',
    name: 'Stock Ledger Reports',
    nameSi: 'තොග ලෙජර් වාර්තා (Stock Ledger)',
    description: 'Item bin cards, audit trails, and chronological inventory transactions',
    path: '/dashboard/reports/stock-ledger',
    actions: {
      view: 'reports.stock-ledger.view',
      pdf: 'reports.stock-ledger.pdf',
      print: 'reports.stock-ledger.print',
      excel: 'reports.stock-ledger.excel',
    },
  },
  {
    id: 'grn',
    name: 'GRN Reports (Goods Received)',
    nameSi: 'භාණ්ඩ ලැබීමේ වාර්තා (GRN)',
    description: 'Supplier deliveries, purchase receipts, and store inspection notes',
    path: '/dashboard/reports/grn',
    actions: {
      view: 'reports.grn.view',
      pdf: 'reports.grn.pdf',
      print: 'reports.grn.print',
      excel: 'reports.grn.excel',
    },
  },
  {
    id: 'low-stock',
    name: 'Low Stock & Reorder Reports',
    nameSi: 'අඩු තොග අනතුරු ඇඟවීම් වාර්තා (Low Stock)',
    description: 'Critical replenishment alerts and items below reorder threshold',
    path: '/dashboard/reports/low-stock',
    actions: {
      view: 'reports.low-stock.view',
      pdf: 'reports.low-stock.pdf',
      print: 'reports.low-stock.print',
      excel: 'reports.low-stock.excel',
    },
  },
  {
    id: 'analytics',
    name: 'Analytics & Performance Reports',
    nameSi: 'විශ්ලේෂණ සහ ප්‍රස්ථාර වාර්තා (Analytics)',
    description: 'Turnover rates, monthly movement metrics, and executive KPIs',
    path: '/dashboard/reports/analytics',
    actions: {
      view: 'reports.analytics.view',
      pdf: 'reports.analytics.pdf',
      print: 'reports.analytics.print',
      excel: 'reports.analytics.excel',
    },
  },
];

/**
 * Checks if a user is Super Admin
 */
export function isSuperAdmin(user?: any | null): boolean {
  if (!user) return false;
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
  return roles.some(r => {
    const lr = String(r).toLowerCase().replace(/_/g, '-');
    return lr === 'super-admin' || lr === 'super admin';
  });
}

/**
 * Checks if a user has a Trainee designation or role
 */
export function isTrainee(user?: any | null): boolean {
  if (!user) return false;
  const desig = String(user.designation || '').toLowerCase();
  const role = String(user.role || '').toLowerCase();
  const roles = (Array.isArray(user.roles) ? user.roles : []).map((r: any) => String(r).toLowerCase());
  return desig.includes('trainee') || role.includes('trainee') || roles.some(r => r.includes('trainee'));
}

/**
 * Checks if the user is authorized to access the Reports page / section
 */
export function canAccessReportsPage(user?: any | null): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  if (isTrainee(user)) {
    // Trainees MUST have explicitly granted reports.page.access
    return perms.includes(REPORT_PAGE_ACCESS_PERMISSION);
  }

  // Non-trainees: explicit reports.page.access or legacy view-reports
  return perms.includes(REPORT_PAGE_ACCESS_PERMISSION) || perms.includes('view-reports');
}

/**
 * Checks if the user is authorized to view a specific report category
 */
export function canViewReport(user: any | null, categoryId: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (!canAccessReportsPage(user)) return false;

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  const cat = SYSTEM_REPORT_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return false;

  if (isTrainee(user)) {
    return perms.includes(cat.actions.view) || perms.includes(`reports.${cat.id}`);
  }

  return perms.includes(cat.actions.view) || perms.includes(`reports.${cat.id}`) || perms.includes('view-reports');
}

/**
 * Checks if the user is authorized to download a PDF for a specific report category
 */
export function canDownloadPdf(user: any | null, categoryId: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (!canViewReport(user, categoryId)) return false;

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  const cat = SYSTEM_REPORT_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return false;

  if (isTrainee(user)) {
    return perms.includes(cat.actions.pdf);
  }

  return perms.includes(cat.actions.pdf) || perms.includes('view-reports');
}

/**
 * Checks if the user is authorized to print a report category
 */
export function canPrintReport(user: any | null, categoryId: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (!canViewReport(user, categoryId)) return false;

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  const cat = SYSTEM_REPORT_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return false;

  if (isTrainee(user)) {
    return perms.includes(cat.actions.print);
  }

  return perms.includes(cat.actions.print) || perms.includes('view-reports');
}

/**
 * Checks if the user is authorized to export Excel/CSV for a report category
 */
export function canExportExcel(user: any | null, categoryId: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (!canViewReport(user, categoryId)) return false;

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  const cat = SYSTEM_REPORT_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return false;

  if (isTrainee(user)) {
    return perms.includes(cat.actions.excel);
  }

  return perms.includes(cat.actions.excel) || perms.includes('view-reports');
}

/**
 * Helper to parse a user's permissions array into structured report permissions state
 */
export function parseUserReportPermissions(permissions: string[] = []): {
  pageAccess: boolean;
  categories: Record<string, { view: boolean; pdf: boolean; print: boolean; excel: boolean }>;
} {
  const perms = Array.isArray(permissions) ? permissions : [];
  const pageAccess = perms.includes(REPORT_PAGE_ACCESS_PERMISSION);

  const categories: Record<string, { view: boolean; pdf: boolean; print: boolean; excel: boolean }> = {};

  for (const cat of SYSTEM_REPORT_CATEGORIES) {
    categories[cat.id] = {
      view: perms.includes(cat.actions.view) || perms.includes(`reports.${cat.id}`),
      pdf: perms.includes(cat.actions.pdf),
      print: perms.includes(cat.actions.print),
      excel: perms.includes(cat.actions.excel),
    };
  }

  return { pageAccess, categories };
}

/**
 * Helper to build the final permissions array when saving user report permissions,
 * preserving all existing non-report permissions.
 */
export function buildUpdatedPermissions(
  existingPermissions: string[] = [],
  pageAccess: boolean,
  categories: Record<string, { view: boolean; pdf: boolean; print: boolean; excel: boolean }>
): string[] {
  // Filter out existing report permissions
  const reportActionPerms = new Set<string>();
  reportActionPerms.add(REPORT_PAGE_ACCESS_PERMISSION);
  for (const cat of SYSTEM_REPORT_CATEGORIES) {
    reportActionPerms.add(`reports.${cat.id}`);
    reportActionPerms.add(cat.actions.view);
    reportActionPerms.add(cat.actions.pdf);
    reportActionPerms.add(cat.actions.print);
    reportActionPerms.add(cat.actions.excel);
  }

  const basePermissions = (existingPermissions || []).filter(p => !reportActionPerms.has(p));
  const newPermissions: string[] = [...basePermissions];

  if (pageAccess) {
    newPermissions.push(REPORT_PAGE_ACCESS_PERMISSION);

    for (const cat of SYSTEM_REPORT_CATEGORIES) {
      const state = categories[cat.id];
      if (state) {
        if (state.view) newPermissions.push(cat.actions.view);
        if (state.pdf) newPermissions.push(cat.actions.pdf);
        if (state.print) newPermissions.push(cat.actions.print);
        if (state.excel) newPermissions.push(cat.actions.excel);
      }
    }
  }

  return Array.from(new Set(newPermissions));
}
