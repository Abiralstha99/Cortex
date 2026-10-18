import type { MouseEvent } from "react";

export function scrollToLandingSection(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const section = document.getElementById(event.currentTarget.hash.slice(1));
  if (!section) return;

  event.preventDefault();
  section.scrollIntoView();
}
