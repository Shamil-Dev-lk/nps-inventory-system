// ============================================================
// ANTIGRAVITY — Global TypeScript Type Definitions
// Government Store & Inventory Management System
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface Organization {
  id: number;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  short_name: string;
  district: string;
  province: string;
  address?: string;
  telephone?: string;
  fax?: string;
  mobile?: string;
  email?: string;
  website?: string;
  chairman_name?: string;
  secretary_name?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  official_logo_url?: string;
  government_logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  system_name: string;
  system_subtitle?: string;
  footer_text?: string;
  copyright?: string;
  currency: string;
  currency_symbol: string;
  date_format: string;
  timezone: string;
  default_language: 'en' | 'si' | 'ta';
  enable_sms: boolean;
  enable_email_notifications: boolean;
  enable_push_notifications: boolean;
  enable_ai_features: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  employee_id?: string;
  name: string;
  name_sinhala?: string;
  name_tamil?: string;
  email: string;
  email_verified_at?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  joining_date?: string;
  designation?: string;
  department_id?: number;
  department?: Department;
  avatar_url: string;
  preferred_language: 'en' | 'si' | 'ta';
  dark_mode: boolean;
  is_active: boolean;
  google2fa_enabled: boolean;
  roles: string[];
  permissions: string[];
  last_login_at?: string;
  last_login_ip?: string;
  created_at: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  code: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  description?: string;
  head_officer_id?: number;
  head_officer?: User;
  is_active: boolean;
  created_at?: string;
}

export interface Project {
  id: number;
  project_code: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  description?: string;
  department_id?: number;
  department?: Department;
  start_date?: string;
  end_date?: string;
  budget: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  is_active: boolean;
}

export interface ItemCategory {
  id: number;
  code: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  description?: string;
  parent_id?: number;
  parent?: ItemCategory;
  children?: ItemCategory[];
  icon?: string;
  color?: string;
  is_active: boolean;
}

export interface Unit {
  id: number;
  code: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  symbol?: string;
  description?: string;
  is_active: boolean;
}

export interface Brand {
  id: number;
  code: string;
  name: string;
  logo?: string;
  country?: string;
  description?: string;
  is_active: boolean;
}

export interface Supplier {
  id: number;
  supplier_code: string;
  company_name: string;
  contact_person?: string;
  address?: string;
  district?: string;
  province?: string;
  telephone?: string;
  fax?: string;
  mobile?: string;
  email?: string;
  website?: string;
  vat_number?: string;
  br_number?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  credit_limit?: number;
  credit_period?: number;
  status: 'active' | 'inactive' | 'blacklisted';
  remarks?: string;
  created_at?: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  address?: string;
  telephone?: string;
  manager_id?: number;
  manager?: User;
  capacity?: number;
  is_main: boolean;
  is_active: boolean;
}

export interface Item {
  id: number;
  item_code: string;
  barcode?: string;
  qr_code?: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  description?: string;
  specification?: string;
  category_id?: number;
  category?: ItemCategory;
  brand_id?: number;
  brand?: Brand;
  unit_id?: number;
  unit?: Unit;
  warehouse_id?: number;
  warehouse?: Warehouse;
  purchase_price: number;
  average_cost: number;
  selling_price: number;
  current_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_level: number;
  batch_number?: string;
  expiry_date?: string;
  manufacturing_date?: string;
  warranty_period?: string;
  shelf_life?: number;
  location_code?: string;
  thumbnail_url?: string;
  is_consumable: boolean;
  is_serialized: boolean;
  track_expiry: boolean;
  is_active: boolean;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GrnItem {
  id: number;
  grn_id: number;
  item_id: number;
  item?: Item;
  ordered_quantity: number;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  unit_price: number;
  total_price: number;
  batch_number?: string;
  expiry_date?: string;
  remarks?: string;
}

export interface GoodsReceivedNote {
  id: number;
  grn_number: string;
  purchase_order_id?: number;
  supplier_id?: number;
  supplier?: Supplier;
  warehouse_id?: number;
  warehouse?: Warehouse;
  invoice_number?: string;
  invoice_date?: string;
  received_date: string;
  delivery_note?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  other_charges: number;
  total_amount: number;
  status: 'draft' | 'approved' | 'rejected';
  received_by?: number;
  receivedBy?: User;
  approved_by?: number;
  approvedBy?: User;
  approved_at?: string;
  rejection_reason?: string;
  remarks?: string;
  items?: GrnItem[];
  created_at?: string;
}

export interface StockIssueItem {
  id: number;
  stock_issue_id: number;
  item_id: number;
  item?: Item;
  quantity: number;
  unit_price: number;
  total_price: number;
  remarks?: string;
}

export interface StockIssue {
  id: number;
  issue_number: string;
  issue_to_type: 'department' | 'officer' | 'project';
  department_id?: number;
  department?: Department;
  officer_id?: number;
  officer?: User;
  project_id?: number;
  project?: Project;
  warehouse_id?: number;
  warehouse?: Warehouse;
  issue_date: string;
  status: 'draft' | 'approved' | 'rejected' | 'issued';
  issued_by_id?: number;
  issued_by?: User;
  approved_by_id?: number;
  approved_by?: User;
  approved_at?: string;
  purpose?: string;
  remarks?: string;
  items?: StockIssueItem[];
  created_at?: string;
}

export interface PurchaseRequestItem {
  id: number;
  purchase_request_id: number;
  item_id: number;
  item?: Item;
  quantity: number;
  estimated_unit_price?: number;
  specification?: string;
  remarks?: string;
}

export interface PurchaseRequest {
  id: number;
  pr_number: string;
  department_id?: number;
  department?: Department;
  project_id?: number;
  requested_by?: number;
  requestedBy?: User;
  required_date?: string;
  purpose?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'po_created' | 'cancelled';
  approved_by?: number;
  approvedBy?: User;
  approved_at?: string;
  approval_remarks?: string;
  remarks?: string;
  items?: PurchaseRequestItem[];
  created_at?: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  item_id: number;
  item?: Item;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  total_price: number;
  specification?: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  purchase_request_id?: number;
  supplier_id?: number;
  supplier?: Supplier;
  order_date: string;
  expected_delivery_date?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'acknowledged' | 'partially_received' | 'completed' | 'cancelled';
  created_by?: number;
  createdBy?: User;
  approved_by?: number;
  approved_at?: string;
  terms_conditions?: string;
  remarks?: string;
  items?: PurchaseOrderItem[];
  created_at?: string;
}

export interface StockLedgerEntry {
  id: number;
  item_id: number;
  item?: Item;
  warehouse_id?: number;
  warehouse?: Warehouse;
  transaction_type: string;
  reference_number: string;
  reference_type: string;
  reference_id: number;
  quantity_in: number;
  quantity_out: number;
  balance: number;
  unit_cost: number;
  total_value: number;
  transaction_date: string;
  created_by?: number;
  remarks?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user?: User;
  user_name?: string;
  action: string;
  model_type?: string;
  model_id?: number;
  description: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  url?: string;
  method?: string;
  created_at: string;
}

export interface DashboardAnalytics {
  inventory: {
    total_items: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    expiring_soon_count: number;
  };
  monthly_grn: {
    this_month: number;
    last_month: number;
    count: number;
  };
  monthly_issues: {
    this_month: number;
    last_month: number;
  };
  recent_grns: GoodsReceivedNote[];
  recent_issues: StockIssue[];
  monthly_trend: MonthlyTrend[];
  stock_by_category: CategoryStock[];
}

export interface MonthlyTrend {
  month: string;
  grn_value: number;
  issues_count: number;
}

export interface CategoryStock {
  category_id: number;
  category?: ItemCategory;
  count: number;
  value: number;
}

export interface StockAdjustment {
  id: number;
  adjustment_number: string;
  adjustment_type: 'increase' | 'decrease';
  item_id: number;
  item?: Item;
  warehouse_id: number;
  warehouse?: Warehouse;
  quantity: number;
  unit_cost?: number;
  reason: string;
  description?: string;
  adjusted_by?: number;
  adjustedBy?: User;
  approved_by?: number;
  approved_at?: string;
  status: 'draft' | 'approved' | 'rejected';
  adjustment_date: string;
  reference_number?: string;
}

export interface StockTransfer {
  id: number;
  transfer_number: string;
  transfer_type: 'warehouse_to_warehouse' | 'warehouse_to_department' | 'department_to_warehouse';
  from_warehouse_id?: number;
  from_warehouse?: Warehouse;
  to_warehouse_id?: number;
  to_warehouse?: Warehouse;
  transfer_date: string;
  initiated_by?: number;
  initiatedBy?: User;
  approved_by?: number;
  approved_at?: string;
  status: 'draft' | 'approved' | 'completed' | 'cancelled';
  reason?: string;
  remarks?: string;
}

export interface StockTaking {
  id: number;
  st_number: string;
  title: string;
  warehouse_id: number;
  warehouse?: Warehouse;
  count_date: string;
  initiated_by?: number;
  initiatedBy?: User;
  approved_by?: number;
  approved_at?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'approved';
  remarks?: string;
  items?: StockTakingItem[];
}

export interface StockTakingItem {
  id: number;
  stock_taking_id: number;
  item_id: number;
  item?: Item;
  system_quantity: number;
  physical_quantity?: number;
  variance?: number;
  unit_cost: number;
  variance_reason?: string;
  is_adjusted: boolean;
}

export interface SriLankaDistrict {
  name: string;
  province: string;
}

export const SRI_LANKA_DISTRICTS: SriLankaDistrict[] = [
  { name: 'Colombo', province: 'Western' },
  { name: 'Gampaha', province: 'Western' },
  { name: 'Kalutara', province: 'Western' },
  { name: 'Kandy', province: 'Central' },
  { name: 'Matale', province: 'Central' },
  { name: 'Nuwara Eliya', province: 'Central' },
  { name: 'Galle', province: 'Southern' },
  { name: 'Matara', province: 'Southern' },
  { name: 'Hambantota', province: 'Southern' },
  { name: 'Jaffna', province: 'Northern' },
  { name: 'Kilinochchi', province: 'Northern' },
  { name: 'Mannar', province: 'Northern' },
  { name: 'Mullaitivu', province: 'Northern' },
  { name: 'Vavuniya', province: 'Northern' },
  { name: 'Trincomalee', province: 'Eastern' },
  { name: 'Batticaloa', province: 'Eastern' },
  { name: 'Ampara', province: 'Eastern' },
  { name: 'Kurunegala', province: 'North Western' },
  { name: 'Puttalam', province: 'North Western' },
  { name: 'Anuradhapura', province: 'North Central' },
  { name: 'Polonnaruwa', province: 'North Central' },
  { name: 'Badulla', province: 'Uva' },
  { name: 'Monaragala', province: 'Uva' },
  { name: 'Ratnapura', province: 'Sabaragamuwa' },
  { name: 'Kegalle', province: 'Sabaragamuwa' },
];
