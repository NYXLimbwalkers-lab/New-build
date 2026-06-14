import { cn } from "@/lib/cn";

/** Five-star display with partial fill. */
export function RatingStars({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      className={cn("relative inline-block leading-none", className)}
      style={{ fontSize: size }}
      aria-label={`${value.toFixed(1)} out of 5 stars`}
      role="img"
    >
      <span className="text-mauve/40">★★★★★</span>
      <span
        className="absolute inset-0 overflow-hidden whitespace-nowrap text-gold"
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        ★★★★★
      </span>
    </span>
  );
}
