import ClientPage from './ClientPage';
import { Suspense } from 'react';

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const resolvedParams = await props.params;
  return <Suspense fallback={<div>Loading...</div>}><ClientPage params={resolvedParams} /></Suspense>;
}
