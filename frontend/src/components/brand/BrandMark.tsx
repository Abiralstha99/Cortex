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
        "font-display text-xl font-extrabold tracking-tight text-forest no-underline",
        className,
      )}
    >
      Cortex.
    </Link>
  );
}
