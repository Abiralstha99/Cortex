import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function BrandMark({
  to = "/",
  className,
}: {
  to?: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center gap-2.5 rounded-control font-sans text-xl font-bold tracking-tight text-primary no-underline outline-none focus-visible:ring-3 focus-visible:ring-primary/30",
        className,
      )}
    >
      <img
        src="/assets/Cortex-logo.png"
        alt=""
        aria-hidden
        className="h-9 w-9 shrink-0 object-contain"
      />
      <span>Cortex</span>
    </Link>
  );
}
