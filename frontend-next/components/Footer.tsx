import Link from "next/link";

const EXPLORE_LINKS = [
  { to: "/", label: "Products" },
  { to: "/scan", label: "Scan Barcode" },
  { to: "/compare", label: "Compare" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/tips", label: "Eco Tips" },
];

const RESOURCE_LINKS = [
  { to: "/about", label: "About Us" },
  { to: "/favorites", label: "My Favorites" },
];

const BADGES = [
  { label: "Carbon Neutral", color: "#52b788" },
  { label: "Open Data", color: "#74c69d" },
  { label: "Made in SG", color: "#95d5b2" },
];

const heading = "text-brand-400 font-bold text-sm mb-3 uppercase tracking-[0.05em]";
const link = "text-white/60 hover:text-white text-sm no-underline transition-colors";

export default function Footer() {
  return (
    <footer
      className="text-white/70 px-6 pt-10 pb-6"
      style={{
        background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #1b4332 100%)",
      }}
    >
      <div className="max-w-[900px] mx-auto">
        <div
          className="grid gap-8 mb-8"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
        >
          <div>
            <div className="text-white font-extrabold text-[1.3rem] mb-2 flex items-center gap-2">
              <span className="text-[1.2rem]">🌿</span> Consciobite
            </div>
            <p className="text-sm leading-relaxed">
              Empowering sustainable food choices through transparent environmental data and
              GreenGrade scoring.
            </p>
          </div>

          <div>
            <h4 className={heading}>Explore</h4>
            <div className="flex flex-col gap-2">
              {EXPLORE_LINKS.map((l) => (
                <Link key={l.to} href={l.to} className={link}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className={heading}>Resources</h4>
            <div className="flex flex-col gap-2">
              {RESOURCE_LINKS.map((l) => (
                <Link key={l.to} href={l.to} className={link}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className={heading}>Did You Know?</h4>
            <p className="text-sm leading-relaxed">
              Food systems account for about 26% of global greenhouse gas emissions. Your choices
              matter!
            </p>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-5" />

        <div className="flex justify-between items-center flex-wrap gap-3">
          <p className="text-xs">
            © {new Date().getFullYear()} Consciobite. Built for a greener tomorrow.
          </p>
          <div className="flex gap-1.5">
            {BADGES.map((b) => (
              <span
                key={b.label}
                className="px-2.5 py-1 rounded-full bg-white/8 text-[0.72rem] font-semibold"
                style={{ color: b.color }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
