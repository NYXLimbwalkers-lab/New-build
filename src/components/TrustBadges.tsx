import { cn } from "@/lib/cn";

/*
  Values surfaced as FACTS, not slogans (the "what women want" research: 73% of
  women-owned-business buyers weigh values; 70% prefer veteran-owned; small-batch
  signals premium). Tasteful, never pink-and-shrink.
*/
const BADGES = [
  { icon: "★", label: "Veteran-founded" },
  { icon: "❀", label: "Mom-owned" },
  { icon: "✦", label: "Hand-poured" },
  { icon: "◷", label: "Made to order" },
  { icon: "♺", label: "Soy & clean wax" },
];

export function TrustBadges({
  compact,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-5 gap-y-2",
        className,
      )}
    >
      {BADGES.map((b) => (
        <li
          key={b.label}
          className={cn(
            "flex items-center gap-1.5 text-cocoa",
            compact ? "label-caps !tracking-[0.16em]" : "text-sm",
          )}
        >
          <span className="text-gold" aria-hidden>
            {b.icon}
          </span>
          <span className={compact ? "" : "tracking-wide"}>{b.label}</span>
        </li>
      ))}
    </ul>
  );
}
