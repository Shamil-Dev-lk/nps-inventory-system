'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Redirector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const p = searchParams.get('p');
    if (p) {
      router.replace(p.replace('/government-stock-system', '') || '/dashboard');
    } else {
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  return null;
}
