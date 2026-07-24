'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Redirector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const p = searchParams.get('p');
    if (p) {
      let target = p;
      // Strip out the base path to avoid double base paths
      while (target.includes('/nps-inventory-system')) {
        target = target.replace('/nps-inventory-system', '');
      }
      
      if (!target || target === '/') {
        target = '/dashboard';
      }

      // Convert legacy [id] URL paths into query param routes for GitHub Pages compatibility
      target = target.replace(/\/dashboard\/items\/([^/]+)\/edit\/?$/, '/dashboard/items/edit?id=$1');
      target = target.replace(/\/dashboard\/items\/([^/]+)\/?$/, '/dashboard/items/view?id=$1');

      target = target.replace(/\/dashboard\/store\/suppliers\/([^/]+)\/edit\/?$/, '/dashboard/store/suppliers/edit?id=$1');
      target = target.replace(/\/dashboard\/store\/suppliers\/([^/]+)\/view\/?$/, '/dashboard/store/suppliers/view?id=$1');

      target = target.replace(/\/dashboard\/purchase\/orders\/([^/]+)\/edit\/?$/, '/dashboard/purchase/orders/edit?id=$1');
      target = target.replace(/\/dashboard\/purchase\/orders\/([^/]+)\/?$/, '/dashboard/purchase/orders/view?id=$1');

      target = target.replace(/\/dashboard\/purchase\/requests\/([^/]+)\/edit\/?$/, '/dashboard/purchase/requests/edit?id=$1');
      target = target.replace(/\/dashboard\/purchase\/requests\/([^/]+)\/?$/, '/dashboard/purchase/requests/view?id=$1');

      target = target.replace(/\/dashboard\/stock\/grn\/([^/]+)\/?$/, '/dashboard/stock/grn/view?id=$1');
      target = target.replace(/\/dashboard\/stock\/issue\/([^/]+)\/edit\/?$/, '/dashboard/stock/issue/edit?id=$1');
      target = target.replace(/\/dashboard\/stock\/issue\/([^/]+)\/?$/, '/dashboard/stock/issue/view?id=$1');
      target = target.replace(/\/dashboard\/stock\/return\/([^/]+)\/?$/, '/dashboard/stock/return/view?id=$1');
      target = target.replace(/\/dashboard\/stock\/adjustment\/([^/]+)\/?$/, '/dashboard/stock/adjustment/view?id=$1');
      target = target.replace(/\/dashboard\/stock\/taking\/([^/]+)\/?$/, '/dashboard/stock/taking/view?id=$1');
      target = target.replace(/\/dashboard\/stock\/transfer\/([^/]+)\/?$/, '/dashboard/stock/transfer/view?id=$1');
      target = target.replace(/\/dashboard\/store\/sub-categories\/([^/]+)\/?$/, '/dashboard/store/sub-categories/view?id=$1');
      target = target.replace(/\/dashboard\/settings\/users\/([^/]+)\/edit\/?$/, '/dashboard/settings/users/edit?id=$1');
      
      // Ensure trailing slash for non-query URLs, or keep query params intact
      if (!target.includes('?') && !target.endsWith('/')) {
        target += '/';
      }
      
      router.replace(target);
      return;
    }
    router.replace('/dashboard');
  }, [router, searchParams]);

  return null;
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Redirector />
    </Suspense>
  );
}