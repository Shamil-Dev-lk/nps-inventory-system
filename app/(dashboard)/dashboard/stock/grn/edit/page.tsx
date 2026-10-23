'use client';
import { Suspense } from 'react';
import EditGrnClientPage from './ClientPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading GRN Editor...</div>}>
      <EditGrnClientPage />
    </Suspense>
  );
}
