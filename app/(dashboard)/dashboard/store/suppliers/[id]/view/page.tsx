import ClientPage from './ClientPage';

export const metadata = {
  title: 'View Supplier - Dashboard',
};

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <ClientPage params={params} />;
}
