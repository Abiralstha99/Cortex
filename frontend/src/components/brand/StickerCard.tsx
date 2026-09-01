import { cn } from "@/lib/utils";

const tones = {
  pink: "bg-surface",
  yellow: "bg-primary-soft",
  sky: "bg-subtle",
  forest: "border-primary bg-primary text-primary-foreground",
} as const;

interface StickerCardProps {
  title: string;
  subtitle?: string;
  tone: keyof typeof tones;
  icon?: React.ReactNode;
  imageSrc?: string;
  rotate?: number;
  className?: string;
}

export function StickerCard({
  title,
  subtitle,
  tone,
  icon,
  imageSrc,
  className,
}: StickerCardProps) {
  return (
    <div
      className={cn(
        "relative w-44 rounded-panel border border-border p-4 shadow-card",
        tones[tone],
        className,
      )}
    >
      <div className="flex flex-col items-start gap-3 text-left">
        {imageSrc ? (
          <img src={imageSrc} alt="" className="h-20 w-20 object-contain" />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-control border border-current/10 bg-surface/70 text-current">
            {icon}
          </div>
        )}
        <p className="font-display text-base font-bold">
          {title}
        </p>
        {subtitle ? (
          <p className="text-sm leading-relaxed opacity-75">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
