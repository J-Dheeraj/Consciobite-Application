import Link from "next/link";

export default function NotFound() {
  return (
    <div className="animate-[fadeIn_0.4s_ease]">
      <div className="bg-[#0d2818] px-6 py-20 text-center">
        <div className="text-6xl mb-4 opacity-90 animate-[float_3s_ease-in-out_infinite]">🍃</div>
        <div className="font-extrabold text-6xl text-white/20 mb-2">404</div>
        <h1 className="text-white font-bold text-2xl mb-2">Page Not Found</h1>
        <p className="text-white/70 mb-7 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-7 py-3 bg-white text-brand-800 rounded-xl font-bold shadow-md hover:-translate-y-px transition-transform"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
