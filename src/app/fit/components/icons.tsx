/* Line icons for the fit page, matched to the Figma's set. Drawn here rather
   than exported because the Figma bakes them into flattened slide artwork —
   as markup they inherit colour from the chip they sit in and stay sharp. */

type IconProps = { className?: string };

const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      {children}
    </svg>
  );
}

/** A growing catalogue. */
export function CubeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7z" {...STROKE} />
      <path d="M3.5 7 12 11.4 20.5 7M12 11.4v9.8" {...STROKE} />
    </Svg>
  );
}

/** Search that matters. */
export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="6.7" {...STROKE} />
      <path d="m15.4 15.4 5 5" {...STROKE} />
    </Svg>
  );
}

/** AI without the setup cost. */
export function BoltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.4 2.5 5.2 13.2h5.6l-.4 8.3 8.3-10.7h-5.7z" {...STROKE} />
    </Svg>
  );
}

/* The two trend arrows are drawn as a line and an arrowhead rather than as
   bars with a marker beside them: at the 32px these render at, bars plus an
   arrow turn into a smudge, and the direction is the only thing either icon
   has to say. */

/** Insights, trending up. */
export function ChartUpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 16.75 9.25 11l3.5 3.5L20.5 6.75" {...STROKE} />
      <path d="M14.75 6.75h5.75v5.75" {...STROKE} />
    </Svg>
  );
}

/** Discovery that is not this quarter&rsquo;s problem. */
export function ChartDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 7.25 9.25 13l3.5-3.5 7.75 7.75" {...STROKE} />
      <path d="M14.75 17.25h5.75V11.5" {...STROKE} />
    </Svg>
  );
}

/** A catalogue small enough to browse: a bag with two things in it. */
export function SmallBagIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.6 7.6h14.8l-1.1 12a1.6 1.6 0 0 1-1.6 1.5H7.3a1.6 1.6 0 0 1-1.6-1.5z" {...STROKE} />
      <path d="M8.6 9.5V6.7a3.4 3.4 0 0 1 6.8 0v2.8" {...STROKE} />
      <circle cx="10.2" cy="14.6" r="1.15" fill="currentColor" />
      <circle cx="13.8" cy="14.6" r="1.15" fill="currentColor" />
    </Svg>
  );
}

/** Search that is not where the sales come from. */
export function SearchOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="10.5" r="6.8" {...STROKE} />
      <path d="m15.9 15.4 4.5 4.5" {...STROKE} />
      <path d="m8.9 8.4 4.2 4.2m0-4.2-4.2 4.2" {...STROKE} />
    </Svg>
  );
}

/** A general-purpose AI tool, which this is not. */
export function GearsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Teeth first, so the rim draws over their inner ends. */}
      <path
        d="M17.4 11h2M15.5 15.5l1.4 1.4M11 17.4v2M6.5 15.5l-1.4 1.4M4.6 11h-2M6.5 6.5 5.1 5.1M11 4.6v-2M15.5 6.5l1.4-1.4"
        {...STROKE}
      />
      <circle cx="11" cy="11" r="6.4" {...STROKE} />
      <circle cx="11" cy="11" r="2.5" {...STROKE} />
      {/* The small cog is the "one more tool" the card is warning about. */}
      <circle cx="18.6" cy="18.6" r="3.1" {...STROKE} />
      <path d="M18.6 14.3v-1M18.6 23v-1M22.9 18.6h1M14.3 18.6h-1" {...STROKE} />
    </Svg>
  );
}
