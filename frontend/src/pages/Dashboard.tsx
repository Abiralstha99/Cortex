import { useUser } from "@clerk/react";
import PageShell from "@/components/layout/PageShell";
import DashboardHero from "@/components/dashboard/DashboardHero";
import LiveRoomsSection from "@/components/dashboard/LiveRoomsSection";
import QuizRows from "@/components/home/QuizRows";
import { motion, useReducedMotion } from "motion/react";

export default function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName ?? null;
  const reduceMotion = useReducedMotion();

  return (
    <PageShell maxWidth="6xl" className="editorial-dashboard" aside={<div className="editorial-live-rooms"><LiveRoomsSection /></div>}>
      <DashboardHero firstName={firstName} />
      <motion.div
        className="editorial-dashboard-library"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        <QuizRows showEmptyState />
      </motion.div>
    </PageShell>
  );
}
