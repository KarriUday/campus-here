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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7B88D6]/40 bg-[#161D42]/90 px-4 py-1.5 text-xs font-semibold text-[#C8D1F8] backdrop-blur-md shadow-[0_0_15px_rgba(75,99,246,0.15)]">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl text-balance">
          {title}
        </h2>
      </Reveal>
      {body && (
        <Reveal delay={0.12}>
          <p className="mt-4 text-base leading-relaxed text-[#C8CFE6] text-pretty sm:text-lg">
            {body}
          </p>
        </Reveal>
      )}
    </div>
  );
}
