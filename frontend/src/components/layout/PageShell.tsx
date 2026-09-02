import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
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

function isLiveGamePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  return (
    segments.length === 2 &&
    segments[0] === "game" &&
    segments[1] !== "create" &&
    segments[1] !== "join"
  );
}

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
  const { pathname } = useLocation();
  const hasDashboardChrome = !isLiveGamePath(pathname);

  return (
    <div className="min-h-dvh bg-background">
      {hasDashboardChrome && <AppSidebar />}
      <div className={cn("min-h-dvh", hasDashboardChrome && "md:pl-22")}>
        {hasDashboardChrome && <AppHeader />}
        <main
          className={cn(
            "mx-auto px-4 py-8 sm:px-6 md:px-8 md:py-10",
            hasDashboardChrome && "pb-28 md:pb-10",
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
      {hasDashboardChrome && <MobileBottomNav />}
    </div>
  );
}
