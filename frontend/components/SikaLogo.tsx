interface Props {
  width?: number;
  className?: string;
  showGroup?: boolean;
}

export function SikaLogo({ width = 72, className = '', showGroup = false }: Props) {
  const h = Math.round(width * (showGroup ? 0.5 : 0.4));
  return (
    <svg
      width={width}
      height={h}
      viewBox={showGroup ? '0 0 90 45' : '0 0 90 36'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Sika"
      role="img"
    >
      <rect width="90" height="36" fill="#C8102E" />
      <text
        x="45"
        y="26.5"
        textAnchor="middle"
        fill="white"
        fontFamily="'Arial Black', 'Franklin Gothic Heavy', Arial, sans-serif"
        fontWeight="900"
        fontSize="22"
        letterSpacing="3"
      >
        Sika
      </text>
      {showGroup && (
        <text
          x="45"
          y="42"
          textAnchor="middle"
          fill="#C8102E"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="400"
          fontSize="9"
          letterSpacing="3"
        >
          GROUP
        </text>
      )}
    </svg>
  );
}
