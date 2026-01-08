import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Branding · SPACE",
  description: "Personaliza colores, CTA y presencia de tu catálogo.",
};

export default function BrandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
