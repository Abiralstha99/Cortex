import { NavLink } from "react-router-dom";
import AccountMenu from "@/components/AccountMenu";
import { cn } from "@/lib/utils";
import { APP_NAV_ITEMS } from "./app-navigation";

export default function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-sm md:hidden"
    >
      <div className="grid grid-cols-4 gap-1">
        {APP_NAV_ITEMS.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-control)] px-1 text-xs font-semibold text-muted outline-none transition-[color,box-shadow] duration-150 hover:bg-primary-soft hover:text-primary focus-visible:ring-[3px] focus-visible:ring-primary/30",
                isActive && "bg-primary-soft text-primary",
              )
            }
          >
            <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
        <AccountMenu placement="navigation" />
      </div>
    </nav>
  );
}
