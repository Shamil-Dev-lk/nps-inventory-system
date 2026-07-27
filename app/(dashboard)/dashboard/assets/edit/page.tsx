import ClientPage from '../[id]/ClientPage';
import { Suspense } from 'react';

export default function EditAssetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground shimmer h-32 rounded-xl max-w-2xl mx-auto" />}>
      <ClientPage />
    </Suspense>
  );
}
