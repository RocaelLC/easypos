"use client";

export const dynamic = "force-dynamic";
import { auth } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
async function handleLogout(router: ReturnType<typeof useRouter>) {
  try {
    await signOut(auth);
    router.replace("/login");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
}

type Tile = {
  title: string;
  desc: string;
  href: string;
  gradient: string;
  icon: React.ReactNode;
};

const tiles: Tile[] = [
  {
    title: "Cobrar",
    desc: "Nueva venta y checkout",
    href: "/pos",
    gradient: "from-emerald-500 to-emerald-700",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="opacity-95">
        <path d="M12 1v22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M17 5.5c0-1.93-2.24-3.5-5-3.5S7 3.57 7 5.5 9.24 9 12 9s5 1.57 5 3.5S14.76 16 12 16s-5-1.57-5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Productos",
    desc: "Catálogo y categorías",
    href: "/catalogo/productos",
    gradient: "from-indigo-500 to-indigo-700",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="opacity-95">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z" stroke="currentColor" strokeWidth="2" />
        <path d="M3.3 7.3 12 12l8.7-4.7" stroke="currentColor" strokeWidth="2" />
        <path d="M12 22V12" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "Modificar / Agregar",
    desc: "Altas, precios y modificadores",
    href: "/catalogo/modificadores",
    gradient: "from-fuchsia-500 to-pink-600",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="opacity-95">
        <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "Cartera",
    desc: "Entradas / salidas",
    href: "/cartera",
    gradient: "from-amber-500 to-orange-600",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="opacity-95">
        <path d="M3 7h18v14H3V7Z" stroke="currentColor" strokeWidth="2" />
        <path d="M17 11h4v6h-4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
        <path d="M3 7l2-4h14l2 4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "Reporte Diario",
    desc: "Ventas y cierres",
    href: "/reportes/diario",
    gradient: "from-cyan-500 to-teal-600",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="opacity-95">
        <path d="M7 3h10v18H7V3Z" stroke="currentColor" strokeWidth="2" />
        <path d="M9 7h6M9 11h6M9 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Compras ",
    desc: "Inventario y proveedores",
    href: "/compras",
    gradient: "from-rose-500 to-red-600",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="opacity-95">
        <path d="M6 6h15l-1.5 9h-12L6 6Z" stroke="currentColor" strokeWidth="2" />
        <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "Insumos",
    desc: "Inventario y proveedores",
    href: "/insumos",
    gradient: "from-rose-500 to-red-600",
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="opacity-95">
        <path d="M6 6h15l-1.5 9h-12L6 6Z" stroke="currentColor" strokeWidth="2" />
        <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

function TileCard({ t }: { t: Tile }) {
  return (
    <Link
      href={t.href}
      className={[
        "group relative overflow-hidden rounded-2xl shadow-sm",
        "border border-white/10 bg-gradient-to-br text-white",
        t.gradient,
        "transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-white/40",
        // ✅ CUADRADA y compacta en móvil
        "aspect-square sm:aspect-auto sm:h-44",
      ].join(" ")}
    >
      {/* overlay suave */}
      <div className="pointer-events-none absolute inset-0 bg-black/15" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

      {/* contenido */}
      <div className="relative flex h-full flex-col items-center justify-center text-center p-3 sm:p-6">
        <div className="mb-2 sm:mb-3 flex items-center justify-center rounded-2xl bg-white/10 h-11 w-11 sm:h-14 sm:w-14">
          {t.icon}
        </div>

        <h3 className="text-base sm:text-lg font-semibold tracking-tight">
          {t.title}
        </h3>

        {/* ✅ descripción solo desde sm (tablet en adelante) */}
        <p className="mt-1 hidden sm:block text-sm text-white/85">
          {t.desc}
        </p>
      </div>
    </Link>
  );
}


export default function DashboardHome() {
  const router = useRouter();

  return (
<div className="min-h-screen bg-slate-900 text-slate-100 py-10">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">

        
        {/* HEADER */}
<div className="mb-8 flex flex-col items-center gap-4 relative">

  {/* Botón cerrar sesión (arriba derecha) */}
  <button
  onClick={() => handleLogout(router)}
  aria-label="Cerrar sesión"
  className="
    absolute right-0 top-0
    inline-flex items-center justify-center
    rounded-xl border border-white/10
    bg-slate-800/80 backdrop-blur
    text-slate-100 shadow-sm transition
    hover:bg-slate-700/80
    focus:outline-none focus:ring-2 focus:ring-slate-500
    h-10 w-10 sm:h-auto sm:w-auto
    sm:px-4 sm:py-2 sm:gap-2
  "
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 17l5-5-5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M15 12H3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>

  {/* ✅ Texto solo en sm+ */}
  <span className="hidden sm:inline text-sm font-medium">
    Cerrar sesión
  </span>
</button>
  {/* Texto centrado */}
  <div className="text-center">
    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
      easyPOS
    </h1>
    <p className="mt-1 text-sm text-slate-400">
      Selecciona un módulo para comenzar
    </p>
  </div>
</div>


        {/* GRID */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {tiles.map((t) => (
            <TileCard key={t.title} t={t} />
          ))}
        </div>

      </div>
    </div>
  );
}


 