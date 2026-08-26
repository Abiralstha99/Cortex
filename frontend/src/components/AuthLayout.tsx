import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/BrandMark";

export default function AuthLayout({
  heading,
  subtitle,
  children,
}: {
  heading: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-background px-6 py-12">
      {/* Wordmark */}
      <BrandMark to="/" className="mb-12 self-start" />

      {/* Intro */}
      <div className="mb-6 w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-ink">{heading}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>

      {/* Clerk form */}
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
