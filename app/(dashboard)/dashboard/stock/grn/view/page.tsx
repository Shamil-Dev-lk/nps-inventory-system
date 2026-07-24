'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
