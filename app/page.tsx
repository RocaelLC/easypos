import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:28px_28px] opacity-30" />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-green-500/15 border border-green-500/25 flex items-center justify-center">
            <span className="text-green-400 font-bold">EP</span>
          </div>
          <div className="leading-tight">
            <div className="font-semibold">EasyPOS</div>
            <div className="text-xs text-neutral-400">Punto de venta para negocios que empiezan</div>
          </div>
        </Link>

        {/* Top right buttons */}
        <nav className="flex items-center gap-2">
          <Link
            href="/login?as=cajero"
            className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-2 text-sm hover:bg-neutral-900"
          >
            Acceso Cajero
          </Link>
          <Link
            href="/login?as=admin"
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            Acceso Admin
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-10 pb-8">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-300">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              PWA • Offline • Inventario • Cartera diaria
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Cobra rápido, controla tu inventario y mira tus ganancias{" "}
              <span className="text-green-400">en tiempo real</span>.
            </h1>

            <p className="mt-4 text-neutral-300">
              EasyPOS está pensado para cafeterías, postres, frappes y negocios como fresas con crema:
              productos personalizables, compras de insumos, stock y una cartera para ver ventas vs gastos.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login?as=admin"
                className="rounded-2xl bg-green-500 px-5 py-3 text-center font-semibold text-black hover:opacity-90"
              >
                Empezar como Admin
              </Link>
              <Link
                href="/pos"
                className="rounded-2xl border border-neutral-800 bg-neutral-900/50 px-5 py-3 text-center hover:bg-neutral-900"
              >
                Ir directo al POS
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs text-neutral-400">
              <Badge>✅ Multi-dispositivo</Badge>
              <Badge>✅ Funciona offline</Badge>
              <Badge>✅ Modificadores por producto</Badge>
              <Badge>✅ Reporte diario</Badge>
            </div>
          </div>

          {/* Mock UI card */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Vista rápida</div>
              <div className="text-xs text-neutral-400">Hoy</div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat title="Ventas" value="$3,420" />
              <Stat title="Gastos" value="$980" />
              <Stat title="Saldo" value="$2,440" highlight />
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-3">
              <div className="text-xs text-neutral-400">Pedido</div>
              <div className="mt-2 space-y-2">
                <LineItem name="Fresas con crema" meta="Base + Topping" price="$75" />
                <LineItem name="Extra: Nutella" meta="Modificador" price="+$15" />
                <div className="mt-3 flex items-center justify-between border-t border-neutral-800 pt-3 text-sm">
                  <span className="text-neutral-300">Total</span>
                  <span className="font-semibold">$90</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-3">
                <div className="text-xs text-neutral-400">Inventario</div>
                <div className="mt-2 text-sm">Leche: 8</div>
                <div className="text-sm">Fresa: 12</div>
                <div className="text-sm">Crema: 6</div>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-3">
                <div className="text-xs text-neutral-400">Offline</div>
                <div className="mt-2 text-sm">Ventas en cola</div>
                <div className="mt-1 text-2xl font-semibold text-green-400">3</div>
                <div className="mt-2 text-xs text-neutral-400">
                  Se sincroniza cuando regresa internet
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-semibold">Todo lo esencial desde el día 1</h2>
        <p className="mt-2 text-neutral-300">
          Lo mínimo para operar y lo suficiente para crecer sin perder el control.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Feature
            title="Ventas + Modificadores"
            desc="Productos personalizables (toppings, tamaños, extras). El cajero cobra rápido sin confusiones."
          />
          <Feature
            title="Compras e insumos"
            desc="Registra compras de insumos y costos. Mantén control de gastos reales."
          />
          <Feature
            title="Inventario (stock)"
            desc="Stock por insumo y movimientos. Ideal para negocios con ingredientes."
          />
          <Feature
            title="Cartera diaria"
            desc="Ventas vs gastos → saldo del día. Útil para saber cuánto queda realmente."
          />
          <Feature
            title="PWA (instalable)"
            desc="Se instala como app en celular/tablet. Experiencia rápida y tipo “caja”."
          />
          <Feature
            title="Offline + sincronización"
            desc="Si se cae el internet, el POS sigue cobrando y sincroniza después."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-14">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">¿Listo para empezar?</h3>
              <p className="mt-1 text-neutral-300">
                Entra como Admin para configurar productos, modificadores e insumos.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/login?as=cajero"
                className="rounded-2xl border border-neutral-800 bg-neutral-950/40 px-5 py-3 text-sm hover:bg-neutral-900"
              >
                Acceso Cajero
              </Link>
              <Link
                href="/login?as=admin"
                className="rounded-2xl bg-green-500 px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                Acceso Admin
              </Link>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} EasyPOS — diseñado para negocios que empiezan.
        </footer>
      </section>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1">
      {children}
    </span>
  );
}

function Stat({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-3">
      <div className="text-xs text-neutral-400">{title}</div>
      <div className={`mt-1 text-lg font-semibold ${highlight ? "text-green-400" : ""}`}>{value}</div>
    </div>
  );
}

function LineItem({ name, meta, price }: { name: string; meta: string; price: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-neutral-500">{meta}</div>
      </div>
      <div className="text-sm text-neutral-200">{price}</div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-5">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-neutral-300">{desc}</div>
    </div>
  );
}
