interface Props {
  width?: number;
  className?: string;
  showGroup?: boolean;
}

export function SikaLogo({ width = 72, className = '', showGroup = false }: Props) {
  const h  = Math.round(width * 0.40);
  const fs = Math.round(h * 0.65);
  const px = Math.round(h * 0.38);
  const py = Math.round(h * 0.18);

  return (
    <div
      className={`inline-flex flex-col items-center ${className}`}
      role="img"
      aria-label="Sika"
    >
      {/* Red wordmark box */}
      <div
        style={{
          background: '#C8102E',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: px,
          paddingRight: px,
          paddingTop: py,
          paddingBottom: py,
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily: '"Barlow", "Arial Black", Arial, sans-serif',
            fontWeight: 900,
            fontSize: fs,
            color: '#ffffff',
            letterSpacing: Math.round(fs * 0.08),
            lineHeight: 1,
            display: 'block',
          }}
        >
          Sika
        </span>
      </div>

      {/* Optional GROUP label below */}
      {showGroup && (
        <span
          style={{
            fontFamily: '"Barlow", Arial, sans-serif',
            fontWeight: 500,
            fontSize: Math.round(fs * 0.40),
            color: '#616161',
            letterSpacing: Math.round(fs * 0.30),
            paddingLeft: Math.round(fs * 0.30),
            marginTop: 3,
          }}
        >
          GROUP
        </span>
      )}
    </div>
  );
}
