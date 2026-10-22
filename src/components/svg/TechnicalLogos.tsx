import React from 'react';

interface LogoProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  bgColor?: string;
  showText?: boolean;
}

/**
 * Vector Dolby System Double-D Logo (authentic 1970s/80s cassette geometry)
 */
export const DolbyVectorLogo: React.FC<LogoProps> = ({
  x = 0,
  y = 0,
  width = 12,
  height = 5.2,
  color = '#161615',
  showText = true,
}) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <svg viewBox="0 0 120 52" width={width} height={height} overflow="visible">
        {/* Double-D Box */}
        <rect
          x="2"
          y="2"
          width="56"
          height="34"
          fill="none"
          stroke={color}
          strokeWidth="3.2"
        />
        <line x1="30" y1="2" x2="30" y2="36" stroke={color} strokeWidth="2.8" />
        {/* Left D */}
        <path
          d="M 7 7.5 L 15 7.5 C 23 7.5, 26.5 12, 26.5 19 C 26.5 26, 23 30.5, 15 30.5 L 7 30.5 Z"
          fill={color}
        />
        {/* Right D (mirrored) */}
        <path
          d="M 53 7.5 L 45 7.5 C 37 7.5, 33.5 12, 33.5 19 C 33.5 26, 37 30.5, 45 30.5 L 53 30.5 Z"
          fill={color}
        />
        {showText && (
          <>
            <text
              x="64"
              y="18"
              fill={color}
              fontFamily="Helvetica, Inter, Arial, sans-serif"
              fontWeight="800"
              fontSize="13.5"
              letterSpacing="0.8"
            >
              DOLBY
            </text>
            <text
              x="64"
              y="32"
              fill={color}
              fontFamily="Helvetica, Inter, Arial, sans-serif"
              fontWeight="700"
              fontSize="11"
              letterSpacing="0.6"
            >
              SYSTEM
            </text>
          </>
        )}
      </svg>
    </g>
  );
};

/**
 * Compact Cassette (Philips standard) Vector Emblem
 */
export const CompactCassetteLogo: React.FC<LogoProps> = ({
  x = 0,
  y = 0,
  width = 14,
  height = 5.5,
  color = '#161615',
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <svg viewBox="0 0 140 55" width={width} height={height} overflow="visible">
      <rect x="2" y="4" width="136" height="47" fill="none" stroke={color} strokeWidth="2.8" rx="2" />
      <rect x="7" y="9" width="54" height="37" fill="none" stroke={color} strokeWidth="2.2" />
      <circle cx="22" cy="27.5" r="7" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="22" cy="27.5" r="2.2" fill={color} />
      <circle cx="46" cy="27.5" r="7" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="46" cy="27.5" r="2.2" fill={color} />
      <line x1="22" y1="20.5" x2="46" y2="20.5" stroke={color} strokeWidth="1.8" />
      <text
        x="67"
        y="24"
        fill={color}
        fontFamily="Helvetica, Inter, Arial, sans-serif"
        fontWeight="800"
        fontSize="11.5"
        letterSpacing="0.5"
      >
        COMPACT
      </text>
      <text
        x="67"
        y="39"
        fill={color}
        fontFamily="Helvetica, Inter, Arial, sans-serif"
        fontWeight="900"
        fontSize="12"
        letterSpacing="0.4"
      >
        CASSETTE
      </text>
    </svg>
  </g>
);

/**
 * CBS Walking Eye + Wordmark Vector Logo
 */
export const CbsLogoVector: React.FC<LogoProps> = ({
  x = 0,
  y = 0,
  width = 11,
  height = 5.5,
  color = '#B83227',
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <svg viewBox="0 0 110 55" width={width} height={height} overflow="visible">
      <circle cx="26" cy="27.5" r="23" fill="none" stroke={color} strokeWidth="3.5" />
      <path
        d="M 6 27.5 Q 26 11, 46 27.5 Q 26 44, 6 27.5 Z"
        fill="none"
        stroke={color}
        strokeWidth="3"
      />
      <circle cx="26" cy="27.5" r="8.5" fill={color} />
      <text
        x="56"
        y="36"
        fill={color}
        fontFamily="Georgia, EB Garamond, serif"
        fontWeight="700"
        fontSize="25"
        letterSpacing="1"
      >
        CBS
      </text>
    </svg>
  </g>
);

/**
 * EMI Rectangular Box Vector Logo
 */
export const EmiLogoVector: React.FC<LogoProps> = ({
  x = 0,
  y = 0,
  width = 12,
  height = 5.5,
  color = '#161615',
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <svg viewBox="0 0 120 55" width={width} height={height} overflow="visible">
      <rect x="2" y="3" width="116" height="49" fill="none" stroke={color} strokeWidth="4" />
      <rect x="7" y="8" width="106" height="39" fill="none" stroke={color} strokeWidth="1.5" />
      <text
        x="60"
        y="39"
        textAnchor="middle"
        fill={color}
        fontFamily="Helvetica, Inter, Arial, sans-serif"
        fontWeight="900"
        fontSize="31"
        letterSpacing="4"
      >
        EMI
      </text>
    </svg>
  </g>
);

/**
 * Warner / Sire Technical Shield Vector Logo
 */
export const WarnerSireLogoVector: React.FC<LogoProps> = ({
  x = 0,
  y = 0,
  width = 11,
  height = 5.5,
  color = '#D9381E',
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <svg viewBox="0 0 110 55" width={width} height={height} overflow="visible">
      <path
        d="M 24 4 L 44 12 L 44 30 C 44 42, 24 50, 24 50 C 24 50, 4 42, 4 30 L 4 12 Z"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
      />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fill={color}
        fontFamily="Oswald, Barlow Condensed, sans-serif"
        fontWeight="700"
        fontSize="20"
      >
        W
      </text>
      <text
        x="53"
        y="26"
        fill={color}
        fontFamily="Oswald, Barlow Condensed, sans-serif"
        fontWeight="700"
        fontSize="16"
        letterSpacing="1.2"
      >
        SIRE
      </text>
      <text
        x="53"
        y="41"
        fill={color}
        fontFamily="Helvetica, Inter, sans-serif"
        fontWeight="700"
        fontSize="9"
        letterSpacing="0.8"
      >
        RECORDS
      </text>
    </svg>
  </g>
);

/**
 * Deutsche Grammophon Crown / Tulip Emblem Vector
 */
export const DeutscheGrammophonCrest: React.FC<LogoProps> = ({
  x = 0,
  y = 0,
  width = 16,
  height = 5,
  color = '#18181B',
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <svg viewBox="0 0 160 50" width={width} height={height} overflow="visible">
      {/* Laurel / Tulip Crown motif */}
      <path
        d="M 20 38 C 20 18, 50 10, 80 10 C 110 10, 140 18, 140 38"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeDasharray="4 2"
      />
      <polygon points="80,6 85,18 75,18" fill={color} />
      <polygon points="62,10 68,20 58,20" fill={color} />
      <polygon points="98,10 102,20 92,20" fill={color} />
      <polygon points="45,16 52,24 43,24" fill={color} />
      <polygon points="115,16 117,24 108,24" fill={color} />
      <line x1="35" y1="30" x2="125" y2="30" stroke={color} strokeWidth="2" />
      <circle cx="80" cy="30" r="3.5" fill={color} />
    </svg>
  </g>
);

/**
 * SGAE / BIEM Rights Box Vector
 */
export const RightsSocietyBox: React.FC<{
  x: number;
  y: number;
  color: string;
  text?: string;
}> = ({ x, y, color, text = 'SGAE / BIEM' }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="0" y="0" width="13.5" height="4.2" fill="none" stroke={color} strokeWidth="0.25" />
    <text
      x="6.75"
      y="2.8"
      textAnchor="middle"
      fill={color}
      fontFamily="Helvetica, Inter, sans-serif"
      fontWeight="700"
      fontSize="1.85"
      letterSpacing="0.15"
    >
      {text}
    </text>
  </g>
);
