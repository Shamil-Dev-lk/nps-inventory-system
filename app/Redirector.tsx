'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Redirector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const p = searchParams.get('p');
    if (p) {
      let target = p;
      while (target.includes('/nps-inventory-system')) {
        target = target.replace('/nps-inventory-system', '');
      }
      while (target.includes('/government-stock-system')) {
        target = target.replace('/government-stock-system', '');
      }
      if (!target.startsWith('/')) {
        target = '/' + target;
      }
      if (!target || target === '/') {
        target = '/dashboard/';
      }
      if (!target.includes('?') && !target.endsWith('/')) {
        target += '/';
      }
      router.replace(target);
    } else {
      router.replace('/dashboard/');
    }
  }, [searchParams, router]);

  return null;
}
