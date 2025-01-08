
import Table from '@/app/ui/customers/table';
import { fetchFilteredCustomers } from '@/app/lib/data'

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const customers = await fetchFilteredCustomers(query);
  return <Table customers={customers} />
}