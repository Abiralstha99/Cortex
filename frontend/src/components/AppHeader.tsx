import { Link, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const initials = (user?.firstName?.[0] || user?.username?.[0] || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-1.5 text-ink no-underline">
          <Zap size={20} className="text-rose" />
          <span className="text-lg font-semibold tracking-tight">QuizRush</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            Sign out
          </button>

          <Button
            variant="rose"
            size="sm"
            onClick={() => navigate("/game/create")}
          >
            Create quiz
          </Button>

          <Link
            to="/profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-medium text-white"
          >
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
