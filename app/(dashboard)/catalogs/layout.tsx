import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogos · SPACE",
  description: "Organiza tus productos en colecciones claras.",
};

export default function CatalogsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
