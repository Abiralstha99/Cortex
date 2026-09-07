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
        "inline-flex min-h-11 min-w-11 items-center rounded-control font-sans text-xl font-bold tracking-tight text-primary no-underline outline-none focus-visible:ring-3 focus-visible:ring-primary/30",
        className,
      )}
    >
      Cortex
    </Link>
  );
}
