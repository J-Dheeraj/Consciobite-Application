"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BOTTOM_LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/scan", label: "Scan" },
  { to: "/compare", label: "Compare" },
  { to: "/carbon", label: "Carbon" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="md:hidden h-16" aria-hidden="true" />
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-2 pt-1.5"
        role="navigation"
        aria-label="Mobile navigation"
        style={{
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
          boxShadow: "0 -2px 20px rgba(27, 67, 50, 0.3)",
          paddingBottom: "max(env(safe-area-inset-bottom, 6px), 6px)",
        }}
      >
        <div className="flex justify-around items-center max-w-[480px] mx-auto">
          {BOTTOM_LINKS.map((link) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                href={link.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl no-underline min-w-12 transition-all ${
                  active ? "text-white bg-white/12" : "text-white/50"
                }`}
              >
                <span className={`text-xs ${active ? "font-bold" : "font-normal"}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
