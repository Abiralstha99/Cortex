import { Link } from "react-router-dom";
import { CircleUserRound } from "lucide-react";
import "./AppHeader.css";

export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="app-header__wordmark">
          CAPITAL<span className="app-header__wordmark--accent">RUSH</span>
        </Link>
        <Link to="/profile" className="app-header__avatar" aria-label="View profile">
          <CircleUserRound size={22} strokeWidth={1.75} />
        </Link>
      </div>
    </header>
  );
}
