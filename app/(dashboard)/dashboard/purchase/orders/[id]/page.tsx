import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default function Page(props: any) {
  return <ClientPage {...props} />;
}
