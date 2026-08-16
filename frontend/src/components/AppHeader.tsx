import { Link, NavLink, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { LogOut, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/game/create", label: "My Quizzes" },
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
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6">
        {/* Left — logo badge */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 justify-self-start text-ink no-underline transition-opacity hover:opacity-90"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-rose text-white shadow-sm ring-1 ring-rose/20">
            <Zap className="size-4 fill-white" strokeWidth={2.25} />
          </span>
          <span className="text-base font-bold tracking-tight">QuizRush</span>
        </Link>

        {/* Center — primary nav */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors duration-150",
                  "hover:bg-background hover:text-ink",
                  isActive && "bg-background text-ink",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right — CTA + avatar menu */}
        <div className="flex items-center justify-self-end gap-3">
          <Button
            variant="rose"
            size="sm"
            className="gap-1.5 shadow-sm"
            onClick={() => navigate("/game/create")}
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Create quiz
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open account menu"
              className={cn(
                "flex size-9 items-center justify-center overflow-hidden rounded-full",
                "border border-border bg-background text-xs font-semibold text-ink",
                "ring-2 ring-transparent transition-all duration-150",
                "hover:border-muted hover:ring-border",
                "outline-none focus-visible:ring-2 focus-visible:ring-rose/40",
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
