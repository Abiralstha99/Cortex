import AccountMenu from "@/components/AccountMenu";
import { BrandMark } from "@/components/brand/BrandMark";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
        <BrandMark to="/dashboard" className="text-lg md:hidden" />
        <div className="ml-auto">
          <AccountMenu placement="header" />
        </div>
      </div>
    </header>
  );
}
