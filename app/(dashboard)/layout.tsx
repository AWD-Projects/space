import { Sidebar } from "@/components/layout/sidebar";
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
      <main className="flex-1 overflow-y-auto bg-cloud pb-28 md:pb-0">{children}</main>
    </div>
  );
}
