import { NavLink, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { ArrowRight, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/game/create", label: "Create" },
  { to: "/game/join", label: "Join" },
] as const;

export default function AppHeader() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const initials = (
    user?.firstName?.[0] ||
    user?.username?.[0] ||
    user?.primaryEmailAddress?.emailAddress?.[0] ||
    "U"
  ).toUpperCase();

  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Account";

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left wordmark */}
        <BrandMark to="/dashboard" className="justify-self-start" />

        {/* Center nav links */}
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium text-ink/70 transition-colors duration-200",
                  "hover:text-ink",
                  isActive && "text-ink",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: CTA pill + avatar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/game/create")}
            className="inline-flex items-center gap-3 rounded-full border border-ink/10 bg-white py-2 pl-3 pr-5 text-sm font-semibold text-ink shadow-sm transition-all duration-200 hover:border-ink/20 hover:shadow-md"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-forest text-white">
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </span>
            Create quiz
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open account menu"
              className={cn(
                "flex size-9 items-center justify-center overflow-hidden rounded-full",
                "border border-ink/10 bg-white text-xs font-semibold text-ink",
                "transition-all duration-200",
                "hover:border-ink/20 hover:shadow-sm",
                "outline-none focus-visible:ring-2 focus-visible:ring-forest/30",
              )}
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                initials
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>
                <span className="block truncate text-ink">{displayName}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => signOut({ redirectUrl: "/" })}
                className="text-muted focus:text-ink data-highlighted:text-ink"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
