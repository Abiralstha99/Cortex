type LandingDiagramProps = { variant: "hero" | "live" };

export default function LandingDiagram({ variant }: LandingDiagramProps) {
  if (variant === "live") {
    return (
      <svg className="landing-diagram landing-diagram-live" viewBox="0 0 560 490" fill="none" aria-hidden="true">
        <circle cx="280" cy="245" r="182" stroke="currentColor" strokeOpacity=".22" />
        <circle cx="280" cy="245" r="116" stroke="currentColor" strokeOpacity=".26" />
        <path d="M280 245 118 142M280 245 443 146M280 245 124 356M280 245 438 361" stroke="currentColor" strokeOpacity=".42" strokeWidth="1.5" />
        <circle cx="280" cy="245" r="64" fill="#FCFAF5" />
        <text x="280" y="252" textAnchor="middle" className="landing-diagram-center">PLAY</text>
        <circle cx="118" cy="142" r="39" fill="#F2912F" />
        <circle cx="443" cy="146" r="45" fill="#8F44E8" />
        <circle cx="124" cy="356" r="46" fill="#2E86E0" />
        <circle cx="438" cy="361" r="38" fill="#47B72B" />
        <circle cx="118" cy="142" r="6" fill="#161410" />
        <circle cx="443" cy="146" r="6" fill="#161410" />
        <circle cx="124" cy="356" r="6" fill="#161410" />
        <circle cx="438" cy="361" r="6" fill="#161410" />
        <text x="41" y="85" className="landing-diagram-label landing-diagram-label-light">HOST</text>
        <text x="395" y="75" className="landing-diagram-label landing-diagram-label-light">FRIENDS</text>
        <text x="32" y="438" className="landing-diagram-label landing-diagram-label-light">QUESTIONS</text>
        <text x="418" y="437" className="landing-diagram-label landing-diagram-label-light">SCORES</text>
      </svg>
    );
  }

  return (
    <svg className="landing-diagram landing-diagram-hero" viewBox="0 0 560 490" fill="none" aria-hidden="true">
      <circle cx="280" cy="245" r="182" stroke="#D5D2C7" strokeWidth="1.5" />
      <circle cx="280" cy="245" r="116" stroke="#D5D2C7" strokeWidth="1.5" strokeDasharray="3 7" />
      <path d="M280 245 118 142M280 245 443 146M280 245 124 356M280 245 438 361" stroke="#817F77" strokeOpacity=".72" strokeWidth="1.5" />
      <circle cx="280" cy="245" r="64" fill="#F3EEDC" stroke="#161410" strokeWidth="1.5" />
      <text x="280" y="253" textAnchor="middle" className="landing-diagram-center">PLAY</text>
      <circle cx="118" cy="142" r="39" fill="#F2912F" />
      <circle cx="443" cy="146" r="45" fill="#8F44E8" />
      <circle cx="124" cy="356" r="46" fill="#2E86E0" />
      <circle cx="438" cy="361" r="38" fill="#47B72B" />
      <circle cx="118" cy="142" r="6" fill="#161410" />
      <circle cx="443" cy="146" r="6" fill="#161410" />
      <circle cx="124" cy="356" r="6" fill="#161410" />
      <circle cx="438" cy="361" r="6" fill="#161410" />
      <text x="41" y="85" className="landing-diagram-label">HOST</text>
      <text x="395" y="75" className="landing-diagram-label">FRIENDS</text>
      <text x="32" y="438" className="landing-diagram-label">QUESTIONS</text>
      <text x="418" y="437" className="landing-diagram-label">SCORES</text>
    </svg>
  );
}
