interface Props {
  size?: number;
  className?: string;
  showGroup?: boolean;
}

export function SikaLogo({ size = 44, className = '', showGroup = false }: Props) {
  return (
    <div
      className={`inline-flex flex-col items-center ${className}`}
      role="img"
      aria-label="Sika"
    >
      {/* Yellow square → red triangle → Sika italic text inside */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sika yellow background */}
        <rect width="120" height="120" fill="#ffc510" />

        {/* Sika red triangle (pointing up) */}
        <polygon points="60,11 113,105 7,105" fill="#C8102E" />

        {/* "Sika" wordmark — bold italic serif, white, inside triangle */}
        <text
          x="60"
          y="81"
          textAnchor="middle"
          fill="white"
          fontFamily="Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif"
          fontStyle="italic"
          fontWeight="bold"
          fontSize="29"
          letterSpacing="1"
        >
          Sika
        </text>

        {/* Registered trademark ® */}
        <text
          x="88"
          y="38"
          fill="white"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="10"
          fontWeight="normal"
        >
          ®
        </text>
      </svg>

      {/* Optional "GROUP" label below */}
      {showGroup && (
        <span
          style={{
            fontFamily: '"Barlow", Arial, sans-serif',
            fontWeight: 500,
            fontSize: Math.round(size * 0.19),
            color: '#616161',
            letterSpacing: Math.round(size * 0.06),
            paddingLeft: Math.round(size * 0.06),
            marginTop: 3,
          }}
        >
          GROUP
        </span>
      )}
    </div>
  );
}
