import { useClerk, useUser } from "@clerk/react";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AccountMenuProps = {
  placement?: "header" | "navigation";
};

export default function AccountMenu({
  placement = "header",
}: AccountMenuProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

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
  const isNavigation = placement === "navigation";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center outline-none transition-[color,box-shadow] duration-150 focus-visible:ring-3 focus-visible:ring-primary/30",
          isNavigation
            ? "w-full gap-2 rounded-[var(--radius-control)] px-3 text-sm font-semibold text-muted-foreground hover:bg-primary-soft hover:text-ink"
            : "size-11 overflow-hidden rounded-full border border-border bg-surface text-sm font-semibold text-ink hover:border-primary/40",
        )}
      >
        {isNavigation ? (
          <span>Account</span>
        ) : user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          initials
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={isNavigation ? "right" : "bottom"}>
        <DropdownMenuLabel>
          <span className="block truncate text-ink">{displayName}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => signOut({ redirectUrl: "/" })}
          className="min-h-11 text-muted-foreground focus:text-ink data-highlighted:text-ink"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
