import { supabase } from '@/lib/supabase';

export function normalizeSearchText(s?: string | null): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/bundle/g, 'bundel')
    .replace(/\s+/g, ' ')
    .trim();
}

export function itemMatchesProductSearch(
  item?: {
    id?: number;
    name_en?: string | null;
    name_si?: string | null;
    code?: string | null;
    item_code?: string | null;
  } | null,
  search?: string | null
): boolean {
  if (!item || !search || !search.trim()) return false;
  const sRaw = search.trim().toLowerCase();
  const sNorm = normalizeSearchText(search);
  const tokens = sNorm.split(' ').filter(Boolean);

  const nameEn = (item.name_en || '').toLowerCase().trim();
  const nameEnNorm = normalizeSearchText(item.name_en || '');
  const nameSi = (item.name_si || '').trim();
  const code = (item.code || item.item_code || '').toLowerCase().trim();

  // Direct substring in English name, Sinhala name, or code
  if (nameEn.includes(sRaw) || nameEnNorm.includes(sNorm) || nameSi.includes(sRaw) || code.includes(sRaw)) {
    return true;
  }

  // Multi-token check (all tokens appear in combined item descriptor)
  const combined = `${nameEnNorm} ${nameSi.toLowerCase()} ${code}`;
  if (tokens.length > 1 && tokens.every(t => combined.includes(t))) {
    return true;
  }

  return false;
}

export interface MatchedSearchResult {
  matchedIssueIds: number[];
  isProductSearch: boolean;
  matchedItemIds: number[];
  matchedItems: Array<{
    id: number;
    name_en?: string | null;
    name_si?: string | null;
    code?: string | null;
    unit?: { symbol?: string; name_en?: string } | null;
  }>;
}

/**
 * Resolves stock_issue IDs that match the search term across:
 * - Product Name (Sinhala & English, with bundle/bundel tolerance)
 * - Product Code (ITM-...)
 * - Receiver / Customer Name
 * - Village / Address
 * - NIC / Phone / Designation
 * - Department / Project
 */
export async function resolveMatchingIssueIds(searchTerm: string): Promise<MatchedSearchResult> {
  if (!searchTerm || !searchTerm.trim()) {
    return {
      matchedIssueIds: [],
      isProductSearch: false,
      matchedItemIds: [],
      matchedItems: []
    };
  }

  const term = searchTerm.trim();
  const matchedIssueIds = new Set<number>();

  // 1. Check Items (Product Name & Code)
  const { data: allItems } = await supabase
    .from('items')
    .select('id, name_en, name_si, code, unit:units(symbol, name_en)');

  const matchedItems = (allItems || []).filter(item => itemMatchesProductSearch(item, term));
  const matchedItemIds = matchedItems.map(i => i.id);
  const isProductSearch = matchedItemIds.length > 0;

  if (matchedItemIds.length > 0) {
    const { data: issueItems } = await supabase
      .from('stock_issue_items')
      .select('stock_issue_id')
      .in('item_id', matchedItemIds);

    (issueItems || []).forEach(ii => {
      if (ii.stock_issue_id) matchedIssueIds.add(ii.stock_issue_id);
    });
  }

  // 2. Check Customers (Receiver Name, Village/Address, NIC, Phone, Designation)
  const { data: matchedCustomers } = await supabase
    .from('customers')
    .select('id')
    .or(`name.ilike.%${term}%,address.ilike.%${term}%,nic.ilike.%${term}%,phone.ilike.%${term}%,designation.ilike.%${term}%`);

  if (matchedCustomers && matchedCustomers.length > 0) {
    const custIds = matchedCustomers.map(c => c.id);
    const { data: issuesWithCust } = await supabase
      .from('stock_issues')
      .select('id')
      .in('customer_id', custIds);

    (issuesWithCust || []).forEach(iss => matchedIssueIds.add(iss.id));
  }

  // 3. Check Departments (Department Name EN & SI)
  const { data: matchedDepts } = await supabase
    .from('departments')
    .select('id')
    .or(`name_en.ilike.%${term}%,name_si.ilike.%${term}%`);

  if (matchedDepts && matchedDepts.length > 0) {
    const deptIds = matchedDepts.map(d => d.id);
    const { data: issuesWithDept } = await supabase
      .from('stock_issues')
      .select('id')
      .in('department_id', deptIds);

    (issuesWithDept || []).forEach(iss => matchedIssueIds.add(iss.id));
  }

  // 4. Check Projects (Project Name)
  const { data: matchedProjects } = await supabase
    .from('projects')
    .select('id')
    .ilike('name_en', `%${term}%`);

  if (matchedProjects && matchedProjects.length > 0) {
    const projIds = matchedProjects.map(p => p.id);
    const { data: issuesWithProj } = await supabase
      .from('stock_issues')
      .select('id')
      .in('project_id', projIds);

    (issuesWithProj || []).forEach(iss => matchedIssueIds.add(iss.id));
  }

  return {
    matchedIssueIds: Array.from(matchedIssueIds),
    isProductSearch,
    matchedItemIds,
    matchedItems
  };
}
