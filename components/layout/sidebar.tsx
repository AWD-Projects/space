"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Package, FolderOpen, Palette, Eye, LogOut, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SpaceLogo } from "@/brand/space/SpaceLogo";
import { useClerk } from "@clerk/nextjs";

const navigation = [
  { name: "Dashboard", href: "/app/home", icon: Home },
  { name: "Productos", href: "/app/products", icon: Package },
  { name: "Catálogos", href: "/app/catalogs", icon: FolderOpen },
  { name: "Branding", href: "/app/branding", icon: Palette },
  { name: "Preview", href: "/app/preview", icon: Eye },
  { name: "Planes", href: "/app/billing", icon: CreditCard },
];

interface DockItemProps {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

function DockItem({ icon: Icon, label, href, onClick, active }: DockItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 ease-out",
        "hover:bg-spaceMist/80 active:bg-spaceMist",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spaceBlue/40 focus-visible:ring-offset-0",
        active ? "bg-spaceBlue/10 text-spaceBlue" : "text-slate"
      )}
      aria-label={label}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] transition-all duration-150 ease-out",
          active
            ? "text-spaceBlue"
            : "text-slate group-hover:text-ink group-hover:scale-105"
        )}
      />

      {/* Tooltip */}
      <div className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        <div className="rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg">
          {label}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
            <div className="h-0 w-0 border-y-[5px] border-r-[5px] border-y-transparent border-r-foreground" />
          </div>
        </div>
      </div>
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop floating dock */}
      <aside className="fixed left-6 top-1/2 z-50 hidden -translate-y-1/2 md:block">
        <div className="flex flex-col items-center gap-8 rounded-3xl border border-spaceMist bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <SpaceLogo variant="mark" size={36} ariaLabel="SPACE admin mark" />

          {/* Separator */}
          <div className="h-px w-6 bg-border/50" />

          {/* Main Navigation */}
          <nav className="flex flex-col items-center gap-1.5">
            {navigation.map((item) => (
              <DockItem
                key={item.href}
                icon={item.icon}
                label={item.name}
                href={item.href}
                active={pathname === item.href}
              />
            ))}
          </nav>

          {/* Separator */}
          <div className="h-px w-6 bg-border/50" />

          {/* Bottom Actions */}
          <div className="flex flex-col items-center">
            <DockItem icon={LogOut} label="Cerrar sesión" onClick={handleLogout} />
          </div>
        </div>
      </aside>

      {/* Mobile floating dock - Matches desktop style */}
      <aside className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-3 px-3">
        <div className="mx-auto max-w-md rounded-3xl border border-spaceMist bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <nav className="flex items-center justify-around px-2 py-2.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200",
                      active
                        ? "bg-spaceMist text-ink"
                        : "text-slate active:bg-cloud"
                    )}
                    aria-label={item.name}
                  >
                    {active && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                    <Icon className={cn("h-5 w-5 transition-all", active && "scale-110")} />
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>
        {/* Safe area for notched devices */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </aside>
    </>
  );
}
