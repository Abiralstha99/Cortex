import LandingHeader from "@/components/home/LandingHeader";
import LandingDiagram from "@/components/home/LandingDiagram";
import OrbitalHero from "@/components/home/OrbitalHero";
import CreateStage from "@/components/home/CreateStage";
import JoinRail from "@/components/home/JoinRail";
import useAuthCommit from "@/components/home/useAuthCommit";
import useJoinResume from "@/components/home/useJoinResume";
import { useHomeIntentStore } from "@/stores/homeIntentStore";
import { BrandMark } from "@/components/brand/BrandMark";
import { useAuth } from "@clerk/react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import QuizRows from "@/components/home/QuizRows";
import LiveRoomRows from "@/components/home/LiveRoomRows";
import { scrollToLandingSection } from "@/components/home/scrollToLandingSection";
import "@fontsource/league-spartan/latin-900.css";
import "@fontsource/dm-serif-display/latin-400.css";
import "@fontsource/dm-serif-display/latin-400-italic.css";
import "@fontsource/jost/latin-400.css";
import "@fontsource/jost/latin-600.css";
import "@fontsource/jost/latin-700.css";
import "./homeEditorial.css";

const ease = [0.22, 1, 0.36, 1] as const;
const line = {
  hidden: { y: "110%" },
  visible: { y: "0%", transition: { duration: 0.76, ease } },
};
const lineGroup = {
  visible: { transition: { staggerChildren: 0.13 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.66, ease } },
};
const revealGroup = {
  visible: { transition: { staggerChildren: 0.16, delayChildren: 0.18 } },
};
const viewport = { once: true, amount: 0.2 } as const;
const buttonHover = { y: -2, scale: 1.012, transition: { duration: 0.16 } };
const buttonTap = { scale: 0.985, transition: { duration: 0.12 } };
const arrowVariants = { rest: { x: 0, y: 0 }, hover: { x: 3, y: -3 } };

export default function HomeWorkspace() {
  const liveRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: liveRef, offset: ["start end", "end start"] });
  const diagramY = useTransform(scrollYProgress, [0, 1], [18, -18]);
  const navigate = useNavigate();
  const location = useLocation();
  const { ensureSignedIn } = useAuthCommit();
  const { isLoaded, isSignedIn } = useAuth();
  const reduceMotion = useReducedMotion();

  // auto-resume pending intents when Clerk finishes loading / user signs in
  useJoinResume();

  const setPendingFile = useHomeIntentStore((s) => s.setPendingFile);
  const requestCreateResume = useHomeIntentStore((s) => s.requestCreateResume);
  const setPendingJoinCode = useHomeIntentStore((s) => s.setPendingJoinCode);

  async function handleContinue(file: File) {
    setPendingFile(file);
    requestCreateResume();
    const result = await ensureSignedIn();
    if (result === "already-signed-in") {
      // consume intent then navigate
      useHomeIntentStore.getState().takeCreateResume();
      navigate("/game/create");
      return;
    }
    if (result === "fallback-required") {
      // fallback to full-page login; leave intent in store for resume
      navigate("/login", { state: { from: location } });
      return;
    }
    // modal-opened: clerk modal is visible, do nothing — resume happens via useJoinResume
  }

  async function handleJoin(code: string) {
    const normalized = code;
    if (!isLoaded || !isSignedIn) {
      // store intent then prompt sign-in
      setPendingJoinCode(normalized);
      const result = await ensureSignedIn();
      if (result === "fallback-required") {
        navigate("/login", { state: { from: location } });
        return;
      }
      if (result === "modal-opened") {
        // wait for useJoinResume to resume when modal flow completes
        return;
      }
      // already-signed-in case: consume then navigate
      const taken = useHomeIntentStore.getState().takePendingJoinCode();
      if (taken) navigate(`/game/lobby/${taken}`);
      return;
    }
    // already signed in
    navigate(`/game/lobby/${normalized}`);
  }

  return (
    <div data-theme="editorial-landing" className="editorial-landing">
      <LandingHeader />
      <main>
        <section className="landing-hero landing-shell" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <motion.p className="landing-eyebrow" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.8, ease }}>Study together · play smarter</motion.p>
            <motion.h1 id="landing-title" aria-label="Your notes. Game night." variants={lineGroup} initial={reduceMotion ? false : "hidden"} animate="visible">
              <span className="landing-line-mask"><motion.span variants={line}>Your notes.</motion.span></span>
              <span className="landing-line-mask"><motion.span className="landing-hero-accent" variants={line}>Game night.<motion.span className="landing-accent-stroke" aria-hidden="true" initial={reduceMotion ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.62, delay: 0.74, ease }} /></motion.span></span>
            </motion.h1>
            <motion.p className="landing-hero-description" initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62, delay: 0.94, ease }}>Turn your notes into a live quiz. Invite your friends, race the clock, and see what sticks.</motion.p>
            <motion.div className="landing-hero-actions" initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62, delay: 1.08, ease }}>
              <motion.a
                className="landing-button landing-button-dark"
                href="#create"
                onClick={scrollToLandingSection}
                whileHover={reduceMotion ? undefined : buttonHover}
                whileTap={reduceMotion ? undefined : buttonTap}
              >Create a quiz</motion.a>
              <motion.a
                className="landing-text-link"
                href="#join"
                onClick={scrollToLandingSection}
                initial="rest"
                whileHover={reduceMotion ? undefined : "hover"}
              >Join a game <motion.span aria-hidden="true" variants={arrowVariants} transition={{ duration: 0.16 }}>↗</motion.span></motion.a>
            </motion.div>
          </div>
          <motion.div
            className="landing-hero-art"
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.72, delay: 0.38, ease }}
          ><OrbitalHero /></motion.div>
        </section>

        <section id="how-it-works" className="landing-how" aria-labelledby="landing-how-title">
          <div className="landing-shell">
            <motion.h2
              id="landing-how-title"
              aria-label="From notes to game night."
              variants={lineGroup}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={viewport}
            ><span className="landing-line-mask"><motion.span variants={line}>From notes to</motion.span></span><span className="landing-line-mask"><motion.span variants={line}><em>game night.</em></motion.span></span></motion.h2>
            <motion.div className="landing-steps" variants={revealGroup} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={viewport}>
              <motion.article variants={revealItem}>
                <motion.span className="landing-step-rule" aria-hidden="true" variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.7, ease } } }} />
                <span className="landing-step-number">01</span><h3>Upload notes</h3><p>Bring a PDF or text file, or choose a quiz you already made.</p>
              </motion.article>
              <motion.article variants={revealItem}>
                <motion.span className="landing-step-rule" aria-hidden="true" variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.7, ease } } }} />
                <span className="landing-step-number">02</span><h3>Make the quiz</h3><p>Cortex turns your material into multiple-choice questions.</p>
              </motion.article>
              <motion.article variants={revealItem}>
                <motion.span className="landing-step-rule" aria-hidden="true" variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.7, ease } } }} />
                <span className="landing-step-number">03</span><h3>Play live</h3><p>Share the room code. Answer against the clock and follow the leaderboard.</p>
              </motion.article>
            </motion.div>
          </div>
        </section>

        <section ref={liveRef} className="landing-live" aria-labelledby="landing-live-title">
          <div className="landing-shell landing-live-grid">
            <motion.div
              className="landing-live-copy"
              variants={revealGroup}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={viewport}
            >
              <motion.p variants={revealItem} className="landing-eyebrow">Made for a room full of minds</motion.p>
              <motion.h2 id="landing-live-title" aria-label="Learning sticks better when everyone plays." variants={lineGroup}><span className="landing-line-mask"><motion.span variants={line}>Learning sticks better</motion.span></span><span className="landing-line-mask"><motion.span variants={line}>when <em>everyone plays.</em></motion.span></span></motion.h2>
              <motion.p variants={revealItem}>A room code brings everyone together. Once the players are ready, timed rounds put every answer in motion.</motion.p>
              <motion.a variants={revealItem} className="landing-button landing-button-light" href="#join" onClick={scrollToLandingSection} whileHover={reduceMotion ? undefined : buttonHover} whileTap={reduceMotion ? undefined : buttonTap}>Join a game</motion.a>
            </motion.div>
            <motion.div variants={revealItem} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={viewport}>
              <motion.div className="landing-live-art" style={{ y: reduceMotion ? 0 : diagramY }}>
                <LandingDiagram variant="live" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="create" className="landing-play" aria-labelledby="landing-play-title">
          <div className="landing-shell">
            <motion.div className="landing-play-heading" variants={revealGroup} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={viewport}>
              <motion.h2 id="landing-play-title" aria-label="Ready to make some noise?" variants={lineGroup}><span className="landing-line-mask"><motion.span variants={line}>Ready to make</motion.span></span><span className="landing-line-mask"><motion.span variants={line}><em>some noise?</em></motion.span></span></motion.h2>
              <motion.p variants={revealItem}>Start with your notes, or jump into a room with a code.</motion.p>
            </motion.div>
            <motion.div className="landing-play-grid" variants={revealGroup} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={viewport}>
              <motion.div className="landing-create" variants={revealItem}>
                <CreateStage onContinue={handleContinue} />
                <QuizRows />
              </motion.div>
              <motion.div id="join" className="landing-join" variants={revealItem}>
                <JoinRail onJoin={handleJoin} />
                <LiveRoomRows />
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="landing-final" aria-labelledby="landing-final-title">
          <motion.div className="landing-shell landing-final-inner" variants={revealGroup} initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={viewport}>
            <motion.h2 id="landing-final-title" aria-label="The best study session is the one you play." variants={lineGroup}><span className="landing-line-mask"><motion.span variants={line}>The best study session</motion.span></span><span className="landing-line-mask"><motion.span variants={line}>is the one you <em>play.</em></motion.span></span></motion.h2>
            <motion.a variants={revealItem} className="landing-button landing-button-dark" href="#create" onClick={scrollToLandingSection} whileHover={reduceMotion ? undefined : buttonHover} whileTap={reduceMotion ? undefined : buttonTap}>Create a quiz</motion.a>
          </motion.div>
        </section>
      </main>
      <footer className="landing-footer"><div className="landing-shell"><BrandMark className="landing-wordmark" /><a href="#how-it-works" onClick={scrollToLandingSection}>How it works</a></div></footer>
    </div>
  );
}
