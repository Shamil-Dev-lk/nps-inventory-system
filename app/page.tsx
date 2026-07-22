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
      
      // Since trailingSlash is true, make sure target ends with /
      if (!target.endsWith('/')) {
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