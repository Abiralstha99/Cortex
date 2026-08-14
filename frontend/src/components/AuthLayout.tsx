import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

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
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-12">
      {/* Wordmark */}
      <Link
        to="/"
        className="mb-12 flex items-center gap-1.5 self-start text-ink no-underline"
      >
        <Zap size={18} className="text-rose" />
        <span className="text-lg font-semibold tracking-tight">QuizRush</span>
      </Link>

      {/* Intro */}
      <div className="mb-6 w-full max-w-sm text-center">
        <p className="label-caps mb-3 text-muted">NOTES → QUIZ → COMPETE</p>
        <h1 className="text-3xl font-bold text-ink">{heading}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>

      {/* Clerk form */}
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
