import Link from "next/link";

const FEATURES = [
  { href: "/products", icon: "🥦", label: "Browse Products", desc: "550 products graded A–F" },
  { href: "/scan", icon: "📷", label: "Scan Barcode", desc: "Instant sustainability score" },
  { href: "/compare", icon: "⚖️", label: "Compare", desc: "Side-by-side breakdown" },
  { href: "/dashboard", icon: "📊", label: "Dashboard", desc: "Your impact at a glance" },
  { href: "/recipes", icon: "🍳", label: "Recipes", desc: "Low-emission meal ideas" },
  { href: "/carbon", icon: "🌍", label: "Carbon Tracker", desc: "Track weekly footprint" },
];

export default function HomePage() {
  return (
    <div className="animate-[fadeIn_0.4s_ease]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-[#0d2818] px-6 py-16 text-center">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)",
            backgroundSize: "50px 50px, 35px 35px",
          }}
        />
        <div className="relative z-[1] mx-auto max-w-[640px]">
          <div className="mb-4 text-5xl animate-[float_3s_ease-in-out_infinite]">🌿</div>
          <h1 className="mb-3 text-4xl font-extrabold leading-tight text-white md:text-5xl">
            Shop sustainably,
            <br />
            <em className="text-brand-400 not-italic">one bite at a time.</em>
          </h1>
          <p className="mx-auto mb-7 max-w-[480px] text-base text-white/80">
            Rate grocery products by lifecycle carbon emissions. Make informed, sustainable food
            choices backed by data.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="rounded-full bg-white px-7 py-3 font-semibold text-brand-800 shadow-lg transition-transform hover:-translate-y-px"
            >
              Browse Products
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-white/30 px-7 py-3 font-medium text-white transition-colors hover:bg-white/10"
            >
              Learn How It Works
            </Link>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="mx-auto max-w-[900px] px-6 py-12">
        <h2 className="mb-6 text-center text-2xl font-bold text-ink">Explore Consciobite</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-2xl bg-card p-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-1 text-lg font-bold text-ink group-hover:text-brand-700">
                {f.label}
              </h3>
              <p className="text-sm text-ink-muted">{f.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
