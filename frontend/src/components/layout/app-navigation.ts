import { House, LogIn, PlusCircle, type LucideIcon } from "lucide-react";

export type AppNavItem = {
  to: "/dashboard" | "/game/create" | "/game/join";
  label: "Home" | "Create" | "Join";
  icon: LucideIcon;
};

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { to: "/dashboard", label: "Home", icon: House },
  { to: "/game/create", label: "Create", icon: PlusCircle },
  { to: "/game/join", label: "Join", icon: LogIn },
];
