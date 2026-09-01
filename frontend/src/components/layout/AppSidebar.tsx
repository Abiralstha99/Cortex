import { NavLink } from "react-router-dom";
import AccountMenu from "@/components/AccountMenu";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";
import { APP_NAV_ITEMS } from "./app-navigation";

export default function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[88px] flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center justify-center border-b border-border px-2">
        <BrandMark to="/dashboard" className="text-base" />
      </div>
      <nav aria-label="Primary" className="flex flex-1 flex-col items-center gap-2 px-3 py-6">
        {APP_NAV_ITEMS.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                "group relative inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] text-muted outline-none transition-[color,box-shadow] duration-150 hover:bg-primary-soft hover:text-primary focus-visible:ring-[3px] focus-visible:ring-primary/30",
                isActive && "bg-primary-soft text-primary",
              )
            }
          >
            <Icon aria-hidden="true" className="size-[22px]" strokeWidth={2} />
            <span className="pointer-events-none absolute left-[calc(100%+0.75rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-[0_8px_24px_rgb(32_43_72/0.06)] group-hover:block group-focus-visible:block">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <AccountMenu placement="navigation" />
      </div>
    </aside>
  );
}
