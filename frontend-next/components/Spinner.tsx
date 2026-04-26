interface SpinnerProps {
  message?: string;
}

export default function Spinner({ message = "Loading..." }: SpinnerProps) {
  return (
    <div className="p-12 text-center text-ink-muted">
      <div className="mx-auto mb-3 h-9 w-9 rounded-full border-[3px] border-brand-200 border-t-brand-800 animate-[spin_0.8s_linear_infinite]" />
      {message}
    </div>
  );
}
