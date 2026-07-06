interface Props {
  size?: number;
  className?: string;
  showGroup?: boolean;
}

/**
 * Sika logo: red upward triangle, yellow "Sika" italic script inside,
 * red ® outside to the right. Transparent background.
 * Proportions match the official Sika brand mark.
 * Font: Lobster (Google Fonts) — closest freely available match
 *       to Sika's proprietary script wordmark.
 */
export function SikaLogo({ size = 44, className = '', showGroup = false }: Props) {
  // viewBox 160 × 130 — triangle occupies left ~82%, ® occupies remaining right
  return (
    <div
      className={`inline-flex flex-col items-center ${className}`}
      role="img"
      aria-label="Sika"
    >
      <svg
        width={size}
        height={Math.round(size * 0.81)}   /* 130/160 aspect ratio */
        viewBox="0 0 160 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Red triangle — apex top-centre, base at bottom */}
        <polygon points="66,5 129,124 3,124" fill="#C8102E" />

        {/* "Sika" — yellow, Lobster italic script, centred inside triangle */}
        <text
          x="66"
          y="96"
          textAnchor="middle"
          fill="#ffc510"
          fontFamily="'Lobster', 'Brush Script MT', cursive"
          fontSize="42"
          fontStyle="italic"
        >
          Sika
        </text>

        {/* ® — red, small, positioned outside triangle to the right */}
        <text
          x="137"
          y="72"
          fill="#C8102E"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="16"
          fontWeight="normal"
        >
          ®
        </text>
      </svg>

      {/* Optional "GROUP" label below the mark */}
      {showGroup && (
        <span
          style={{
            fontFamily: '"Barlow", Arial, sans-serif',
            fontWeight: 500,
            fontSize: Math.round(size * 0.16),
            color: '#616161',
            letterSpacing: Math.round(size * 0.05),
            paddingLeft: Math.round(size * 0.05),
            marginTop: 4,
            textTransform: 'uppercase' as const,
          }}
        >
          Group
        </span>
      )}
    </div>
  );
}
