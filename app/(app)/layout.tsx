import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { SideNav, TopNav } from "@/app/nav";
import { Toast } from "./toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen">
      <SideNav userEmail={user.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav userEmail={user.email} />
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 lg:px-8">{children}</main>
      </div>
      <Suspense fallback={null}>
        <Toast />
      </Suspense>
    </div>
  );
}
