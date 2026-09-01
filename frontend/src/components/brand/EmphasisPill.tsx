import { cn } from "@/lib/utils";

const tones = {
  gloss: "border-primary/30 bg-primary-soft text-primary",
  forest: "border-primary bg-primary text-primary-foreground",
  pink: "border-danger/20 bg-danger-soft text-ink",
  yellow: "border-warning/25 bg-primary-soft text-ink",
  sky: "border-border bg-subtle text-ink",
} as const;

export function EmphasisPill({
  children,
  tone = "gloss",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control border px-3 py-1 font-display text-[0.95em] font-bold leading-none",
        tones[tone],
        className,
      )}
    >
      <span className="relative z-[1]">{children}</span>
    </span>
  );
}
