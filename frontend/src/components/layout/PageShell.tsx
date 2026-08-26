import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import { cn } from "@/lib/utils";

const widths = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
} as const;

export default function PageShell({
  children,
  maxWidth = "5xl",
  className,
}: {
  children: ReactNode;
  maxWidth?: keyof typeof widths;
  className?: string;
}) {
  return (
    <div className="min-h-[100dvh] bg-cream">
      <AppHeader />
      <main className={cn("mx-auto px-6 py-10", widths[maxWidth], className)}>
        {children}
      </main>
    </div>
  );
}
