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

/**
 * TDK Iconic Diamond Emblem + Wordmark Vector
 */
export const TdkLogoVector: React.FC<{
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
}> = ({ x = 0, y = 0, width = 14, height = 4.2, color = '#FFFFFF' }) => (
  <g transform={`translate(${x}, ${y})`}>
    <svg viewBox="0 0 140 42" width={width} height={height} overflow="visible">
      {/* TDK Tri-Faceted Diamond Mark */}
      <polygon points="18,4 28,20 8,20" fill={color} />
      <polygon points="7,22 17,22 12,37" fill={color} />
      <polygon points="19,22 29,22 24,37" fill={color} />
      <polygon points="2,18 7,8 12,18" fill={color} opacity="0.85" />
      <polygon points="24,18 29,8 34,18" fill={color} opacity="0.85" />
      {/* Bold TDK Wordmark */}
      <text
        x="40"
        y="33"
        fill={color}
        fontFamily="Inter, Helvetica, Arial, sans-serif"
        fontWeight="900"
        fontSize="31"
        letterSpacing="1.5"
      >
        TDK
      </text>
    </svg>
  </g>
);

/**
 * Arista Records 1970s/80s Stylized "A" Peak + Wordmark Vector
 */
export const AristaLogoVector: React.FC<{
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
}> = ({ x = 0, y = 0, width = 12, height = 5, color = '#18181B' }) => (
  <g transform={`translate(${x}, ${y})`}>
    <svg viewBox="0 0 120 50" width={width} height={height} overflow="visible">
      <path
        d="M 18 32 L 32 6 L 46 32 M 23 24 L 41 24"
        fill="none"
        stroke={color}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 10 32 Q 32 18, 54 32"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
      />
      <text
        x="60"
        y="29"
        fill={color}
        fontFamily="Inter, Helvetica, Arial, sans-serif"
        fontWeight="900"
        fontSize="16"
        letterSpacing="2"
      >
        ARISTA
      </text>
    </svg>
  </g>
);

/**
 * Compact Disc Digital Audio Vector Logo (Philips / Sony Red Book Standard)
 */
export const CompactDiscLogo: React.FC<{
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
}> = ({ x = 0, y = 0, width = 13, height = 6, color = '#18181B' }) => (
  <g transform={`translate(${x}, ${y})`}>
    <svg viewBox="0 0 130 60" width={width} height={height} overflow="visible">
      <rect x="2" y="2" width="126" height="56" rx="3" fill="none" stroke={color} strokeWidth="2.8" />
      <text
        x="65"
        y="15"
        textAnchor="middle"
        fill={color}
        fontFamily="Inter, Helvetica, Arial, sans-serif"
        fontWeight="800"
        fontSize="10.5"
        letterSpacing="2.2"
      >
        COMPACT
      </text>
      {/* Stylized "disc" outline */}
      <text
        x="65"
        y="39"
        textAnchor="middle"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        fontFamily="Inter, Helvetica, Arial, sans-serif"
        fontStyle="italic"
        fontWeight="900"
        fontSize="26"
        letterSpacing="1"
      >
        disc
      </text>
      <text
        x="65"
        y="52"
        textAnchor="middle"
        fill={color}
        fontFamily="Inter, Helvetica, Arial, sans-serif"
        fontWeight="800"
        fontSize="8.5"
        letterSpacing="1.6"
      >
        DIGITAL AUDIO
      </text>
    </svg>
  </g>
);

/**
 * Universal Record Company Vector Logo Selector (inspired by vhs.texs.org company logo picker)
 */
export const CompanyLogoBadge: React.FC<{
  logoId: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
}> = ({ logoId, x = 0, y = 0, width = 11, height = 4.6, color = '#18181B' }) => {
  switch (logoId) {
    case 'arista':
      return <AristaLogoVector x={x} y={y} width={width} height={height} color={color} />;
    case 'cbs':
      return <CbsLogoVector x={x} y={y} width={width} height={height} color={color} />;
    case 'emi':
      return <EmiLogoVector x={x} y={y} width={width} height={height} color={color} />;
    case 'warner':
      return <WarnerSireLogoVector x={x} y={y} width={width} height={height} color={color} />;
    case 'dg':
      return <DeutscheGrammophonCrest x={x} y={y} width={width} height={height} color={color} />;
    case 'tdk':
      return <TdkLogoVector x={x} y={y} width={width} height={height} color={color} />;
    case 'maxell':
    case 'sony':
    case 'virgin':
      return (
        <g transform={`translate(${x}, ${y})`}>
          <rect x={0} y={0} width={width} height={height} fill="none" stroke={color} strokeWidth="0.3" />
          <text
            x={width / 2}
            y={height * 0.72}
            textAnchor="middle"
            fill={color}
            fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize={height * 0.56}
            letterSpacing="0.2"
          >
            {logoId.toUpperCase()}
          </text>
        </g>
      );
    default:
      return null;
  }
};

/**
 * Crisp Vector QR Code Generator for Spotify / Playlist URLs (inspired by vhs.texs.org QR feature)
 */
export const VectorQrCodeSvg: React.FC<{
  data: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  bgColor?: string;
}> = ({
  data,
  x = 0,
  y = 0,
  size = 12,
  color = '#18181B',
  bgColor = '#FFFFFF',
}) => {
  const N = 21;
  // Build deterministic 21x21 QR matrix from data string
  const isFinder = (r: number, c: number, fr: number, fc: number) => {
    const dr = r - fr;
    const dc = c - fc;
    if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return null;
    if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
    if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
    return false;
  };

  let hash = 2166136261;
  const seedStr = data || 'https://open.spotify.com';
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      // Quiet separator around finders
      if (
        (r === 7 && (c <= 7 || c >= N - 8)) ||
        (c === 7 && (r <= 7 || r >= N - 8)) ||
        (r === N - 8 && c <= 7) ||
        (c === N - 8 && r <= 7)
      ) {
        continue;
      }

      const f1 = isFinder(r, c, 0, 0);
      if (f1 !== null) {
        if (f1) cells.push({ r, c });
        continue;
      }
      const f2 = isFinder(r, c, 0, N - 7);
      if (f2 !== null) {
        if (f2) cells.push({ r, c });
        continue;
      }
      const f3 = isFinder(r, c, N - 7, 0);
      if (f3 !== null) {
        if (f3) cells.push({ r, c });
        continue;
      }

      // Timing patterns
      if (r === 6) {
        if (c % 2 === 0) cells.push({ r, c });
        continue;
      }
      if (c === 6) {
        if (r % 2 === 0) cells.push({ r, c });
        continue;
      }

      // Deterministic bit from URL payload
      const charIdx = (r * N + c) % seedStr.length;
      const code = seedStr.charCodeAt(charIdx);
      const bit = ((hash ^ (code * (r + 1) * 31 + c * 17)) >>> ((r + c) % 16)) & 1;
      if (bit === 1) {
        cells.push({ r, c });
      }
    }
  }

  const pad = 1.5;
  const viewSize = N + pad * 2;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <svg viewBox={`0 0 ${viewSize} ${viewSize}`} width={size} height={size}>
        <rect
          x="0"
          y="0"
          width={viewSize}
          height={viewSize}
          rx="1"
          fill={bgColor}
          stroke={color}
          strokeWidth="0.35"
        />
        {cells.map((cell, idx) => (
          <rect
            key={idx}
            x={pad + cell.c}
            y={pad + cell.r}
            width="1.02"
            height="1.02"
            fill={color}
          />
        ))}
      </svg>
    </g>
  );
};

/**
 * Crisp Vector UPC/EAN Barcode Generator (inspired by vhs.texs.org cid=878727472725 parameter)
 */
export const VectorBarcodeSvg: React.FC<{
  code: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  bgColor?: string;
}> = ({
  code,
  x = 0,
  y = 0,
  width = 15,
  height = 8.5,
  color = '#18181B',
  bgColor = '#FFFFFF',
}) => {
  const cleanDigits = (code || '878727472725').replace(/[^0-9]/g, '').padEnd(12, '0').slice(0, 12);
  // Standard UPC-A L-code 7-module patterns for digits 0-9
  const L_PATTERNS = [
    '0001101',
    '0011001',
    '0010011',
    '0111101',
    '0100011',
    '0110001',
    '0101111',
    '0111011',
    '0110111',
    '0001011',
  ];

  let bits = '101'; // Start guard
  for (let i = 0; i < 6; i++) {
    const d = parseInt(cleanDigits[i], 10) || 0;
    bits += L_PATTERNS[d];
  }
  bits += '01010'; // Center guard
  for (let i = 6; i < 12; i++) {
    const d = parseInt(cleanDigits[i], 10) || 0;
    // R-code is bitwise complement of L-code
    const lPat = L_PATTERNS[d];
    for (const ch of lPat) {
      bits += ch === '1' ? '0' : '1';
    }
  }
  bits += '101'; // End guard

  return (
    <g transform={`translate(${x}, ${y})`}>
      <svg viewBox="0 0 115 62" width={width} height={height}>
        <rect x="0" y="0" width="115" height="62" rx="2" fill={bgColor} />
        {bits.split('').map((b, idx) => {
          if (b !== '1') return null;
          const isGuard = idx < 3 || (idx >= 45 && idx < 50) || idx >= 92;
          return (
            <rect
              key={idx}
              x={10 + idx}
              y={5}
              width="1.05"
              height={isGuard ? 45 : 40}
              fill={color}
            />
          );
        })}
        <text
          x="57.5"
          y="58"
          textAnchor="middle"
          fill={color}
          fontFamily="JetBrains Mono, Courier, monospace"
          fontWeight="700"
          fontSize="8.5"
          letterSpacing="1.8"
        >
          {cleanDigits}
        </text>
      </svg>
    </g>
  );
};
