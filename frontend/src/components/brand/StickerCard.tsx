import { cn } from "@/lib/utils";

const tones = {
  pink: "bg-candy-pink",
  yellow: "bg-candy-yellow",
  sky: "bg-candy-sky",
  forest: "bg-forest text-primary-foreground",
} as const;

export function StickerCard({
  title,
  subtitle,
  tone,
  icon,
  imageSrc,
  rotate = 0,
  className,
}: {
  title: string;
  subtitle?: string;
  tone: keyof typeof tones;
  icon?: React.ReactNode;
  imageSrc?: string;
  rotate?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "gloss-sheen relative w-44 rounded-[var(--radius-sticker)] border-[6px] border-white p-4 shadow-[0_10px_0_0_rgb(0_0_0/0.12)]",
        tones[tone],
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="relative z-[1] flex flex-col items-center gap-2 text-center">
        {imageSrc ? (
          <img src={imageSrc} alt="" className="h-20 w-20 object-contain" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center text-ink">
            {icon}
          </div>
        )}
        <p className="font-display text-sm font-extrabold uppercase tracking-wide">
          {title}
        </p>
        {subtitle ? (
          <p className="text-xs font-medium opacity-80">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
