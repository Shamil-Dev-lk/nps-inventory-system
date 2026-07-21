import ClientPage from './ClientPage';
import { Suspense } from 'react';

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default function Page(props: any) {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage {...props} /></Suspense>;
}
