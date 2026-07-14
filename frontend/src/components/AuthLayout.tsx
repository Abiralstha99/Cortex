import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./AuthLayout.css";

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
    <div className="auth-layout">
      <Link to="/" className="auth-layout__wordmark">
        CAPITAL<span className="auth-layout__wordmark--accent">RUSH</span>
      </Link>

      <div className="auth-layout__intro">
        <p className="eyebrow">GEOGRAPHY &middot; REAL-TIME &middot; MULTIPLAYER</p>
        <h1 className="auth-layout__heading">{heading}</h1>
        <p className="auth-layout__subtitle">{subtitle}</p>
      </div>

      <div className="auth-layout__form">{children}</div>
    </div>
  );
}
