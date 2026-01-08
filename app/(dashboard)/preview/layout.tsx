import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preview · SPACE",
  description: "Visualiza tu catálogo público antes de compartirlo.",
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
