"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("easypos-theme") : null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("easypos-theme", theme);
  }, [theme]);

  if (loading || !user) {
    return <div className="p-6">Cargando...</div>;
  }

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen ${isDark ? "bg-neutral-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-64 border-r p-4 hidden md:block ${isDark ? "border-neutral-800" : "border-slate-200 bg-slate-100"}`}>
          <div className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>EasyPOS</div>
          <div className={`text-xs mt-1 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>{user.email}</div>

          <nav className="mt-6 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 text-sm border ${
                    active
                      ? isDark
                        ? "bg-neutral-800 border-neutral-700"
                        : "bg-slate-200 border-slate-300"
                      : isDark
                      ? "border-transparent hover:bg-neutral-900"
                      : "border-transparent hover:bg-slate-200"
                  } ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`mt-6 w-full rounded-xl border px-3 py-2 text-sm ${isDark ? "border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800" : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"}`}
          >
            {isDark ? "Modo claro" : "Modo oscuro"}
          </button>

          <button
            onClick={() => signOut(auth)}
            className={`mt-3 w-full rounded-xl border px-3 py-2 text-sm ${isDark ? "border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800" : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"}`}
          >
            Cerrar sesión
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <header className={`sticky top-0 z-10 border-b px-4 py-3 backdrop-blur ${isDark ? "border-neutral-800 bg-neutral-950/80" : "border-slate-200 bg-white/80"}`}>
            <div className={isDark ? "text-sm text-neutral-300" : "text-sm text-slate-600"}>
              {nav.find((x) => x.href === pathname)?.label ?? "EasyPOS"}
            </div>
          </header>

          <div className="p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
