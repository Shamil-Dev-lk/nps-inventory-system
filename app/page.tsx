import { Suspense } from 'react';
import Redirector from './Redirector';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Redirector />
    </Suspense>
  );
}