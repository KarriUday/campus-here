import { Reveal } from "./motion";

/** Shared eyebrow + headline + lede block, centred above each section. */
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
    <div className="mx-auto max-w-2xl text-center">
      <Reveal y={16}>
        <span className="bg-surface-raised text-ink inline-flex rounded-full px-3.5 py-1.5 text-xs font-medium">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="display text-ink mt-5 text-3xl text-balance sm:text-4xl lg:text-5xl">
          {title}
        </h2>
      </Reveal>
      {body && (
        <Reveal delay={0.12}>
          <p className="text-ink-secondary mt-4 text-base leading-relaxed text-pretty sm:text-lg">
            {body}
          </p>
        </Reveal>
      )}
    </div>
  );
}
