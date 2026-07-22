import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/nps-inventory-system/dashboard');
}