interface PageHeroProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageHero({ icon, title, subtitle, children }: PageHeroProps) {
  return (
    <div className="bg-[#0d2818] px-6 pt-9 pb-11 text-center">
      {icon && <div className="text-[2.2rem] mb-2">{icon}</div>}
      <h1 className="text-white font-extrabold text-[1.6rem] mb-1.5">{title}</h1>
      {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
      {children}
    </div>
  );
}
