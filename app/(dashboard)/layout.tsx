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
    <div className="h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="h-screen pb-28 md:pb-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
