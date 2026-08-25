import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function BrandMark({
  to = "/",
  size = "md",
  className,
}: {
  to?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center text-ink no-underline tracking-tight",
        size === "md" ? "text-lg font-semibold" : "text-base font-semibold",
        className,
      )}
    >
      Cortex
    </Link>
  );
}
