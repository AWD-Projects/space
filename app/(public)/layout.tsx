import { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--catalog-bg, #ffffff)",
        color: "var(--catalog-text, #111111)",
      }}
    >
      {children}
    </div>
  );
}
