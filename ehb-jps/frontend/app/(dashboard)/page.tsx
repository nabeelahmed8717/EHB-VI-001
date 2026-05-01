import { redirect } from 'next/navigation';

// (dashboard)/page.tsx handles "/" — redirect to /dashboard
export default function DashboardRootPage() {
  redirect('/dashboard');
}
