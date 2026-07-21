import { redirect } from 'next/navigation';

export default function HomePage({ searchParams }: { searchParams: { p?: string } }) {
  if (searchParams.p) {
    redirect(searchParams.p.replace('/government-stock-system', '') || '/dashboard');
  }
  redirect('/dashboard');
}