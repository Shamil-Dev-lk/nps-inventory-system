import ClientPage from './ClientPage';

export const metadata = {
  title: 'View Supplier - Dashboard',
};

export default function Page({ params }: { params: { id: string } }) {
  return <ClientPage params={params} />;
}
