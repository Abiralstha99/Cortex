import type { MouseEvent } from "react";

export function scrollToLandingSection(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const hash = event.currentTarget.hash.slice(1);
  const section = document.getElementById(hash === "join" || hash === "create" ? "landing-play-title" : hash);
  if (!section) return;

  event.preventDefault();
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}
