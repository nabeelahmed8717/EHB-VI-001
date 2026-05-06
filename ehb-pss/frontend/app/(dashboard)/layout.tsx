import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { NavigationLoader } from '@/components/layout/navigation-loader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <Breadcrumb />
        {/*
          `relative` is required so NavigationLoader's `absolute inset-0`
          is scoped to this content area — not the full viewport.
        */}
        <main className="relative flex-1 overflow-y-auto">
          <NavigationLoader />
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
