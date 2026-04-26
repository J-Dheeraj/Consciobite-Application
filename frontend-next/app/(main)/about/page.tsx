const TeamMember = ({ name, emoji }: { name: string; emoji: string }) => (
  <div className="text-center p-4">
    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-200 to-brand-300 text-2xl dark:from-brand-100 dark:to-[#2d4a35]">
      {emoji}
    </div>
    <div className="text-sm font-semibold text-ink">{name}</div>
  </div>
);

const InfoCard = ({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl bg-card p-6 shadow-md animate-[fadeInUp_0.4s_ease_both]">
    <div className="mb-3 flex items-center gap-2.5">
      <span className="text-[1.3rem]">{icon}</span>
      <h3 className="text-base font-bold">{title}</h3>
    </div>
    {children}
  </div>
);

const GradeRow = ({
  bg,
  badge,
  badgeBg,
  badgeColor,
  label,
  labelColor,
  desc,
}: {
  bg: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  label: string;
  labelColor: string;
  desc: string;
}) => (
  <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 ${bg}`}>
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ background: badgeBg, color: badgeColor }}
    >
      {badge}
    </div>
    <div>
      <strong style={{ color: labelColor }}>{label}</strong>{" "}
      <span className="text-sm text-ink-muted">— {desc}</span>
    </div>
  </div>
);

export default function AboutPage() {
  return (
    <div className="animate-[fadeIn_0.4s_ease]">
      <div className="relative overflow-hidden bg-[#0d2818] px-6 py-12 text-center">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)",
            backgroundSize: "50px 50px, 35px 35px",
          }}
        />
        <div className="relative z-[1]">
          <div className="mb-3 text-4xl animate-[float_3s_ease-in-out_infinite]">🌍</div>
          <h1 className="mb-2 text-3xl font-extrabold text-white">About Consciobite</h1>
          <p className="mx-auto max-w-[500px] text-sm text-white/80">
            Empowering sustainable food choices through transparent environmental data.
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-5 pb-12 pt-6">
        <InfoCard icon="🌱" title="Our Mission">
          <p className="text-sm leading-relaxed text-ink-secondary">
            We empower consumers to make informed, sustainable food choices by providing transparent
            environmental impact data through our proprietary GreenGrade scoring system.
          </p>
        </InfoCard>

        <InfoCard icon="📊" title="How GreenGrade Works">
          <p className="mb-3.5 text-sm leading-relaxed text-ink-secondary">
            Our algorithm evaluates carbon emissions across seven categories of the food supply
            chain: Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, and Retail.
          </p>
          <div className="flex flex-col gap-2">
            <GradeRow
              bg="bg-brand-100 dark:bg-[#1c2e22]"
              badge="7+"
              badgeBg="#2d6a4f"
              badgeColor="#fff"
              label="Green (7-10)"
              labelColor="#2d6a4f"
              desc="Low environmental impact"
            />
            <GradeRow
              bg="bg-[#fff8e1] dark:bg-[#2a2517]"
              badge="4+"
              badgeBg="#e9c46a"
              badgeColor="#1a1a2e"
              label="Yellow (4-6.9)"
              labelColor="#8a6d00"
              desc="Moderate impact"
            />
            <GradeRow
              bg="bg-[#fef2f2] dark:bg-[#2a1519]"
              badge="0+"
              badgeBg="#e63946"
              badgeColor="#fff"
              label="Red (0-3.9)"
              labelColor="#c5303c"
              desc="High impact"
            />
          </div>
        </InfoCard>

        <InfoCard icon="⚠️" title="The Problem We Solve">
          <p className="text-sm leading-relaxed text-ink-secondary">
            Nearly 45% of consumers are uninformed about the environmental practices of the brands
            they support. With Gen Z poised to become the dominant workforce, two-thirds of whom
            advocate for sustainable food production, the demand for transparency has never been
            greater.
          </p>
        </InfoCard>

        <InfoCard icon="🚀" title="Market Opportunity">
          <p className="text-sm leading-relaxed text-ink-secondary">
            The ethical labelling market is projected to grow at a CAGR of 6.51%, reaching a
            potential market value of USD 372.7 billion by 2026. Consciobite is positioned to be a
            key player in this space.
          </p>
        </InfoCard>

        <InfoCard icon="👥" title="Our Team">
          <p className="mb-4 text-sm leading-relaxed text-ink-secondary">
            Founded by five university friends from different academic fields, bringing an
            interdisciplinary edge to sustainable food technology.
          </p>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))" }}
          >
            <TeamMember name="Adrin" emoji="👨‍💻" />
            <TeamMember name="Sanjay" emoji="👨‍🔬" />
            <TeamMember name="Karthikraj" emoji="👨‍🎨" />
            <TeamMember name="Shanthosh" emoji="👨‍🎓" />
            <TeamMember name="Dheeraj" emoji="👨‍💼" />
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
