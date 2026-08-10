import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server';
import MarketingPage, { metadata } from './(marketing)/page';

export { metadata };

export default async function HomePage() {
  const session = await getServerSession().catch(() => null);
  if (session) {
    redirect('/dashboard');
  }
  return <MarketingPage />;
}