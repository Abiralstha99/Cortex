import { cn } from "@/lib/utils";

const tones = {
  gloss: "bg-gloss text-candy-pink",
  forest: "bg-forest text-primary-foreground",
  pink: "bg-candy-pink text-ink",
  yellow: "bg-candy-yellow text-ink",
  sky: "bg-candy-sky text-ink",
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
        "gloss-sheen inline-flex items-center rounded-full px-3 py-1 font-display text-[0.95em] font-extrabold leading-none shadow-[0_4px_0_0_rgb(0_0_0/0.18)]",
        tones[tone],
        className,
      )}
    >
      <span className="relative z-[1]">{children}</span>
    </span>
  );
}
