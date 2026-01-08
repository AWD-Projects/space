import { Sidebar } from "@/components/layout/sidebar";
import { SpaceLogo } from "@/brand/space/SpaceLogo";
import { getUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="admin-theme min-h-screen bg-cloud text-ink flex">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-spaceMist bg-white px-6 py-4">
          <SpaceLogo variant="lockup" size={28} />
          <div className="text-sm text-slate">
            {user.email ?? user.user_metadata?.email ?? "admin"}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-cloud pb-28 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
