import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productos · SPACE",
  description: "Gestiona y publica tus productos en minutos.",
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
