import { useCallback, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useNavigate } from "react-router-dom";

import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Coverage } from "@/components/landing/Coverage";
import { FinalCta } from "@/components/landing/FinalCta";

export default function Landing() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const howItWorksRef = useRef<HTMLElement>(null);

  const goToApp = useCallback(
    (state?: Record<string, unknown>) => {
      if (isLoaded && isSignedIn) {
        navigate("/dashboard", { state });
      } else {
        navigate("/login", { state });
      }
    },
    [isLoaded, isSignedIn, navigate]
  );

  const scrollToHowItWorks = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <LandingNav
        onPlayNow={() => goToApp()}
        onHowItWorksClick={scrollToHowItWorks}
      />
      <Hero
        onCreateQuiz={() => goToApp()}
        onHowItWorksClick={scrollToHowItWorks}
        onJoinRoom={(code) => goToApp({ joinRoomCode: code })}
      />
      <Features />
      <HowItWorks ref={howItWorksRef} />
      <Coverage />
      <FinalCta onStart={() => goToApp()} />
    </div>
  );
}
