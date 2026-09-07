/* The two decorative marks the Figma scatters through this page: a four-point
   sparkle, and the little burst of strokes it puts at the corner of anything
   worth noticing. Both are decoration and both are hidden from the reader. */

/** The four-point star that sits at the end of a search field. */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 1.5c.6 5.3 3.2 8.4 10.5 10.5C15.2 14.1 12.6 17.2 12 22.5c-.6-5.3-3.2-8.4-10.5-10.5C8.8 9.9 11.4 6.8 12 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Three short strokes fanning off a corner. */
export function Burst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 34" fill="none" aria-hidden className={className}>
      <path
        d="M4.5 13.5 1 9M12 6.5 11 1M17.5 12.5l4.5-4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
