const steps = [
  "Ask your host for the room code.",
  "Enter the six letters or numbers.",
  "Join the lobby and get ready to play.",
];

export default function HowJoiningWorks() {
  return (
    <aside className="sticky top-24 overflow-hidden rounded-[1.75rem] border-[5px] border-white bg-white p-1.5 shadow-[0_6px_0_0_rgb(0_0_0/0.06)]">
      <div className="rounded-[1.25rem] bg-gradient-to-b from-[#222222] to-[#111111] p-7">
        <p className="font-mono text-xs font-semibold text-[#f5d76e]">
          How joining works
        </p>

        <ul className="mt-6 space-y-0">
          {steps.map((step, i) => (
            <li
              key={step}
              className={`py-5 text-[15px] leading-relaxed text-white/75 ${
                i < steps.length - 1 ? "border-b border-white/8" : ""
              }`}
            >
              {step}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
