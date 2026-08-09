import { Reveal } from "./motion";

export function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-3xl">
      <Reveal y={12}>
        <span className="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-[#b9272f] uppercase">
          <span className="h-px w-8 bg-[#b9272f]" aria-hidden="true" />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.04} y={18}>
        <h2 className="mt-5 text-3xl leading-[1.1] font-semibold tracking-[-0.045em] text-[var(--landing-text)] text-balance sm:text-4xl lg:text-[3.25rem]">
          {title}
        </h2>
      </Reveal>
      {body && (
        <Reveal delay={0.08} y={18}>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--landing-muted)] sm:text-lg">
            {body}
          </p>
        </Reveal>
      )}
    </div>
  );
}
