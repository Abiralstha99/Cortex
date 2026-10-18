import { useState } from "react";
import { useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import AccountMenu from "@/components/AccountMenu";
import { BrandMark } from "@/components/brand/BrandMark";
import { scrollToLandingSection } from "./scrollToLandingSection";

export default function LandingHeader() {
  const { user } = useUser();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenuAfterNavigation = () => requestAnimationFrame(() => setMenuOpen(false));

  return (
    <header className="landing-header">
      <div className="landing-shell landing-header-inner">
        <BrandMark className="landing-wordmark" />

        <nav className="landing-desktop-nav" aria-label="Landing navigation">
          <a href="#how-it-works" onClick={scrollToLandingSection}>How it works</a>
          <a href="#join" onClick={scrollToLandingSection}>Join a game</a>
          {user ? <AccountMenu placement="header" /> : <Link to="/login">Sign in</Link>}
          <motion.a
            className="landing-button landing-button-dark landing-header-cta"
            href="#create"
            onClick={scrollToLandingSection}
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.012, transition: { duration: 0.16 } }}
            whileTap={reduceMotion ? undefined : { scale: 0.985, transition: { duration: 0.12 } }}
          >
            Create a quiz
          </motion.a>
        </nav>

        <button
          type="button"
          className="landing-menu-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <nav id="landing-mobile-nav" className="landing-mobile-nav" aria-label="Mobile landing navigation">
          <a href="#how-it-works" onClick={(event) => { scrollToLandingSection(event); closeMenuAfterNavigation(); }}>How it works</a>
          <a href="#create" onClick={(event) => { scrollToLandingSection(event); closeMenuAfterNavigation(); }}>Create a quiz</a>
          <a href="#join" onClick={(event) => { scrollToLandingSection(event); closeMenuAfterNavigation(); }}>Join a game</a>
          {user ? <AccountMenu placement="header" /> : <Link to="/login">Sign in</Link>}
        </nav>
      )}
    </header>
  );
}
