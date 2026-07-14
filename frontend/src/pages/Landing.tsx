import { useCallback, useRef, useState, type SubmitEvent } from "react";
import { useAuth } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

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
    <div className="landing">
      <Navbar onPlayNow={() => goToApp()} onHowItWorksClick={scrollToHowItWorks} />
      <Hero onPlayNow={() => goToApp()} onJoinRoom={(code) => goToApp({ joinRoomCode: code })} />
      <HowItWorks ref={howItWorksRef} />
    </div>
  );
}

function Navbar({
  onPlayNow,
  onHowItWorksClick,
}: {
  onPlayNow: () => void;
  onHowItWorksClick: (e: React.MouseEvent) => void;
}) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <span className="navbar__wordmark">
          CAPITAL<span className="navbar__wordmark--accent">RUSH</span>
        </span>
        <nav className="navbar__nav" aria-label="Primary">
          <a href="#how-it-works" className="navbar__link" onClick={onHowItWorksClick}>
            HOW IT WORKS
          </a>
        </nav>
        <button type="button" className="btn btn--primary btn--sm" onClick={onPlayNow}>
          Play now
        </button>
      </div>
    </header>
  );
}

function Hero({
  onPlayNow,
  onJoinRoom,
}: {
  onPlayNow: () => void;
  onJoinRoom: (code: string) => void;
}) {
  return (
    <section className="hero">
      <div className="hero__copy">
        <p className="eyebrow">GEOGRAPHY &middot; REAL-TIME &middot; MULTIPLAYER</p>
        <h1 className="hero__headline">
          OUTTHINK.
          <br />
          OUTSPEED.
          <br />
          OUTRANK.
        </h1>
        <p className="hero__desc">
          Real-time multiplayer geography. 10 rounds. 5 minutes. Skill matters.
        </p>
        <div className="hero__actions">
          <button type="button" className="btn btn--primary" onClick={onPlayNow}>
            Play now
          </button>
        </div>
      </div>
      <JoinRoomPanel onJoinRoom={onJoinRoom} onCreateInstead={onPlayNow} />
    </section>
  );
}

function JoinRoomPanel({
  onJoinRoom,
  onCreateInstead,
}: {
  onJoinRoom: (code: string) => void;
  onCreateInstead: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!ROOM_CODE_PATTERN.test(normalized)) {
      setError("Enter the 6-character code exactly as shown to your host.");
      return;
    }
    setError(null);
    onJoinRoom(normalized);
  };

  return (
    <div className="join-panel" role="complementary" aria-label="Join a room">
      <div className="join-panel__header">
        <span className="label">JOIN A ROOM</span>
      </div>

      <form className="join-panel__form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="room-code" className="join-panel__prompt">
          HAVE A CODE?
        </label>
        <input
          id="room-code"
          name="roomCode"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={6}
          placeholder="ABC123"
          className="room-code-input"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "room-code-error" : undefined}
        />
        {error && (
          <p id="room-code-error" className="join-panel__error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary btn--block">
          Join room
        </button>
      </form>

      <button type="button" className="join-panel__alt-link" onClick={onCreateInstead}>
        Create a private match instead
      </button>
    </div>
  );
}

function HowItWorks({ ref }: { ref: React.RefObject<HTMLElement | null> }) {
  const steps = [
    {
      title: "Create or join a room",
      desc: "Host a room and share the code, or drop in with one from a friend.",
    },
    {
      title: "Race through 10 capital questions",
      desc: "Every player sees the same country, at the same time, on the clock.",
    },
    {
      title: "See your score and rating",
      desc: "Placement decides your points. Your rating moves with every match.",
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className="how">
      <p className="eyebrow">HOW IT WORKS</p>
      <div className="how__steps">
        {steps.map((step, i) => (
          <div className="how__step" key={step.title}>
            <span className="how__step-index">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="how__step-title">{step.title}</h3>
            <p className="how__step-desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
