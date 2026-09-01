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
        "font-sans text-xl font-bold tracking-tight text-primary no-underline",
        className,
      )}
    >
      Cortex.
    </Link>
  );
}
