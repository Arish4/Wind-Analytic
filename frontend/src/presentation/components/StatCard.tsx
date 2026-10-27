interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  tone?: "over" | "under";
}

export function StatCard({ label, value, hint, tone }: StatCardProps) {
  return (
    <div className={`stat ${tone ? `stat--${tone}` : ""}`}>
      <span className="stat__label">{label}</span>
      <strong>{value}</strong>
      <span className="stat__hint">{hint}</span>
    </div>
  );
}
