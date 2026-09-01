import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import { cn } from "@/lib/utils";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";

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
  aside,
}: {
  children: ReactNode;
  maxWidth?: keyof typeof widths;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <AppSidebar />
      <div className="min-h-[100dvh] md:pl-[88px]">
        <AppHeader />
        <main
          className={cn(
            "mx-auto px-4 py-8 pb-28 sm:px-6 md:px-8 md:py-10 md:pb-10",
            widths[maxWidth],
            className,
          )}
        >
          {aside ? (
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">{children}</div>
              <aside className="min-w-0">{aside}</aside>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
