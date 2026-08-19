'use client';

/**
 * Utility helper to manage featured / starred items
 */

export function getFeaturedItemIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('nps_featured_item_ids');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function isItemFeatured(item: any): boolean {
  if (!item) return false;
  const isDescFeatured = Boolean(item.description && item.description.includes('[Featured]'));
  const featuredIds = getFeaturedItemIds();
  const isIdFeatured = featuredIds.includes(String(item.id));
  return isDescFeatured || isIdFeatured;
}

export function toggleItemFeatured(itemId: string | number): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const strId = String(itemId);
    const current = getFeaturedItemIds();
    let updated: string[];
    let newState = false;

    if (current.includes(strId)) {
      updated = current.filter((id) => id !== strId);
      newState = false;
    } else {
      updated = [...current, strId];
      newState = true;
    }
    localStorage.setItem('nps_featured_item_ids', JSON.stringify(updated));
    window.dispatchEvent(new Event('featured-items-changed'));
    return newState;
  } catch {
    return false;
  }
}
