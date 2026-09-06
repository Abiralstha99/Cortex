import { Link } from "react-router-dom";
import { useUser } from "@clerk/react";
import AccountMenu from "@/components/AccountMenu";
import { BrandMark } from "@/components/brand/BrandMark";

export default function HomeChrome() {
  const { user } = useUser();

  return (
    <header className="border-b border-border bg-surface/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <BrandMark to="/" />
        <div>
          {user ? (
            <AccountMenu placement="header" />
          ) : (
            <Link
              to="/login"
              className="rounded-control px-3 py-2 text-sm font-semibold no-underline text-primary hover:text-ink"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

