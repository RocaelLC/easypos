"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { useAuth } from "@/lib/useAuth";

const nav = [
  { href: "/pos", label: "POS" },
  { href: "/catalogo/productos", label: "Productos" },
  { href: "/catalogo/modificadores", label: "Modificadores" },
  { href: "/cartera", label: "Cartera" },
  { href: "/reportes/diario", label: "Reporte diario" },
    { href: "/compras", label: "Compras" },
    { href: "/insumos", label: "Insumos" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-neutral-800 p-4 hidden md:block">
          <div className="text-xl font-semibold">EasyPOS</div>
          <div className="text-xs text-neutral-400 mt-1">{user.email}</div>

          <nav className="mt-6 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 text-sm border ${
                    active
                      ? "bg-neutral-800 border-neutral-700"
                      : "border-transparent hover:bg-neutral-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => signOut(auth)}
            className="mt-6 w-full rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900"
          >
            Cerrar sesión
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur px-4 py-3">
            <div className="text-sm text-neutral-300">
              {nav.find((x) => x.href === pathname)?.label ?? "EasyPOS"}
            </div>
          </header>

          <div className="p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
