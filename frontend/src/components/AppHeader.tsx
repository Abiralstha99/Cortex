import AccountMenu from "@/components/AccountMenu";
import { BrandMark } from "@/components/brand/BrandMark";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 md:px-8">
        <BrandMark to="/dashboard" className="gap-1.5 text-[23px] leading-none" />
        <div className="ml-auto">
          <AccountMenu placement="header" />
        </div>
      </div>
    </header>
  );
}
