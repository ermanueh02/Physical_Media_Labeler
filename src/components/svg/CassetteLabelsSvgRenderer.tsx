import React from 'react';
import {
  CassetteProject,
  PAPER_STOCKS,
  PHYSICAL_SPECS,
  Track,
} from '../../types/cassette';
import { formatDuration } from '../../utils/timeAndBalance';
import { getFontFamilyForPreset } from './JCardSvgRenderer';
import { DolbyVectorLogo } from './TechnicalLogos';

interface SingleCassetteLabelProps {
  project: CassetteProject;
  side: 'A' | 'B';
  x?: number;
  y?: number;
  showDieCutGuides?: boolean;
  showCassetteMechanics?: boolean;
}

export const SingleCassetteLabelSvg: React.FC<SingleCassetteLabelProps> = ({
  project,
  side,
  x = 0,
  y = 0,
  showDieCutGuides = true,
  showCassetteMechanics = false,
}) => {
  const W = PHYSICAL_SPECS.LABEL_WIDTH_MM; // 89 mm
  const H = PHYSICAL_SPECS.LABEL_HEIGHT_MM; // 42 mm
  const winW = PHYSICAL_SPECS.LABEL_WINDOW_WIDTH_MM; // 59 mm
  const winH = PHYSICAL_SPECS.LABEL_WINDOW_HEIGHT_MM; // 17.5 mm
  const winX = (W - winW) / 2; // 15 mm
  const winY = 13.2;

  const reelSpacing = PHYSICAL_SPECS.LABEL_REEL_SPACING_MM; // 42.5 mm
  const reelRadius = PHYSICAL_SPECS.LABEL_REEL_DIAMETER_MM / 2; // 6.4 mm
  const leftReelX = W / 2 - reelSpacing / 2;
  const rightReelX = W / 2 + reelSpacing / 2;
  const reelY = winY + winH / 2;

  const paper = PAPER_STOCKS[project.paperStock] || PAPER_STOCKS['editorial-cream'];
  const fontFamily = getFontFamilyForPreset(project.typography);

  const sideTracks: Track[] = project.tracks.filter((t) => t.side === side);
  const sideTotalSec = sideTracks.reduce((acc, t) => acc + t.durationSec, 0);

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max - 1) + '…' : str;

  const labelOutlinePath = `
    M 3.5 0
    L ${W - 3.5} 0
    L ${W} 3.5
    L ${W} ${H - 2}
    Q ${W} ${H} ${W - 2} ${H}
    L 2 ${H}
    Q 0 ${H} 0 ${H - 2}
    L 0 3.5
    Z
  `;

  const clipId = `label-clip-${side}-${Math.round(x)}-${Math.round(y)}`;
  const isDG = project.templateId === 'deutsche-grammophon';

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <clipPath id={clipId}>
          <path d={labelOutlinePath} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={W} height={H} fill={paper.bgHex} />

        {/* Clean Accent Header Band */}
        <rect x={0} y={0} width={W} height={3.2} fill={project.accentColor} />

        {/* Top Header Content: Album Title, Artist & Catalog */}
        <text
          x={15}
          y={7.6}
          fill={paper.textHex}
          fontFamily={fontFamily}
          fontWeight="800"
          fontSize="2.7"
          letterSpacing="0.16"
        >
          {truncate(project.albumTitle.toUpperCase(), 34)}
        </text>
        <text
          x={15}
          y={10.8}
          fill={paper.subTextHex}
          fontFamily={fontFamily}
          fontWeight="600"
          fontSize="1.95"
          letterSpacing="0.12"
        >
          {truncate(project.albumArtist.toUpperCase(), 40)}
        </text>

        <text
          x={W - 4}
          y={7.6}
          textAnchor="end"
          fill={isDG ? '#18181B' : project.accentColor}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="700"
          fontSize="1.9"
        >
          {project.catalogNumber}
        </text>
        <text
          x={W - 4}
          y={10.8}
          textAnchor="end"
          fill={paper.subTextHex}
          fontFamily="Inter, Helvetica, sans-serif"
          fontWeight="600"
          fontSize="1.55"
        >
          {project.recordLabel.toUpperCase()}
        </text>

        {/* Large Minimalist Side Indicator ("A" / "B") on Left Wing */}
        <text
          x={7.5}
          y={22.8}
          textAnchor="middle"
          fill={project.accentColor}
          fontFamily="Inter, Helvetica, Arial, sans-serif"
          fontWeight="900"
          fontSize="8.5"
        >
          {side}
        </text>
        <text
          x={7.5}
          y={26.5}
          textAnchor="middle"
          fill={paper.subTextHex}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
          fontSize="1.65"
        >
          {formatDuration(sideTotalSec)}
        </text>

        {/* Right Wing: Technical Spec (Dolby B-NR / 120µs) */}
        <g transform="translate(75.5, 16.5)">
          {project.dolbySystem !== 'NONE' && (
            <DolbyVectorLogo
              x={3.2}
              y={0}
              width={5.6}
              height={3.6}
              color={paper.textHex}
              showText={false}
            />
          )}
          <text
            x={6}
            y={6.4}
            textAnchor="middle"
            fill={paper.textHex}
            fontFamily="Inter, Helvetica, sans-serif"
            fontWeight="700"
            fontSize="1.5"
          >
            {project.dolbySystem !== 'NONE' ? `DOLBY ${project.dolbySystem}` : 'STEREO'}
          </text>
          <text
            x={6}
            y={8.8}
            textAnchor="middle"
            fill={paper.subTextHex}
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
            fontSize="1.45"
          >
            {project.tapeBias.includes('70') ? '70µs EQ' : '120µs EQ'}
          </text>
        </g>

        {/* Bottom Apron Below Window: Clean Track Summary */}
        <line
          x1={4}
          y1={32.2}
          x2={W - 4}
          y2={32.2}
          stroke={paper.borderHex}
          strokeWidth="0.2"
          opacity="0.35"
        />

        <text
          x={W / 2}
          y={35.6}
          textAnchor="middle"
          fill={paper.textHex}
          fontFamily={fontFamily}
          fontWeight="600"
          fontSize="1.75"
        >
          {truncate(
            sideTracks
              .slice(0, 3)
              .map((t, i) => `${i + 1}. ${t.title}`)
              .join('   •   '),
            62
          )}
        </text>
        {sideTracks.length > 3 && (
          <text
            x={W / 2}
            y={38.4}
            textAnchor="middle"
            fill={paper.subTextHex}
            fontFamily={fontFamily}
            fontSize="1.65"
          >
            {truncate(
              sideTracks
                .slice(3, 6)
                .map((t, i) => `${i + 4}. ${t.title}`)
                .join('   •   '),
              64
            )}
          </text>
        )}

        {/* Central Die-Cut Window Area (59 mm x 17.5 mm) */}
        {showCassetteMechanics ? (
          <g>
            <rect
              x={winX}
              y={winY}
              width={winW}
              height={winH}
              rx={2.2}
              fill="#18181B"
              stroke="#3F3F46"
              strokeWidth="0.35"
            />
            <circle
              cx={leftReelX}
              cy={reelY}
              r={side === 'A' ? 11.2 : 7.8}
              fill="#291D18"
              opacity="0.85"
            />
            <circle
              cx={rightReelX}
              cy={reelY}
              r={side === 'A' ? 7.8 : 11.2}
              fill="#291D18"
              opacity="0.85"
            />
            <rect
              x={W / 2 - 10.5}
              y={winY + 2.8}
              width={21}
              height={winH - 5.6}
              fill="#09090B"
              stroke="#52525B"
              strokeWidth="0.2"
            />
            {[leftReelX, rightReelX].map((cx, i) => (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={reelY}
                  r={reelRadius}
                  fill="#09090B"
                  stroke="#E4E4E7"
                  strokeWidth="0.5"
                />
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <line
                    key={deg}
                    x1={cx}
                    y1={reelY - reelRadius + 0.2}
                    x2={cx}
                    y2={reelY - reelRadius + 1.6}
                    stroke="#E4E4E7"
                    strokeWidth="0.8"
                    transform={`rotate(${deg} ${cx} ${reelY})`}
                  />
                ))}
              </g>
            ))}
          </g>
        ) : (
          <g>
            <rect
              x={winX}
              y={winY}
              width={winW}
              height={winH}
              rx={2.2}
              fill="#FFFFFF"
              stroke={showDieCutGuides ? '#A1A1AA' : paper.borderHex}
              strokeWidth="0.25"
              strokeDasharray={showDieCutGuides ? '1.5 1.0' : undefined}
            />
            {showDieCutGuides && (
              <g stroke="#A1A1AA" strokeWidth="0.2" strokeDasharray="1.0 0.8" fill="none">
                <circle cx={leftReelX} cy={reelY} r={reelRadius} />
                <circle cx={rightReelX} cy={reelY} r={reelRadius} />
              </g>
            )}
          </g>
        )}
      </g>

      <path
        d={labelOutlinePath}
        fill="none"
        stroke={showDieCutGuides ? '#A1A1AA' : paper.borderHex}
        strokeWidth="0.25"
      />
    </g>
  );
};

interface CassetteLabelsSheetProps {
  project: CassetteProject;
  showDieCutGuides?: boolean;
  showCassetteMechanics?: boolean;
  svgRef?: React.RefObject<SVGSVGElement>;
  className?: string;
}

export const CassetteLabelsSvgRenderer: React.FC<CassetteLabelsSheetProps> = ({
  project,
  showDieCutGuides = true,
  showCassetteMechanics = false,
  svgRef,
  className = '',
}) => {
  const W = PHYSICAL_SPECS.LABEL_WIDTH_MM; // 89 mm
  const H = PHYSICAL_SPECS.LABEL_HEIGHT_MM; // 42 mm
  const gapY = 12;
  const margin = 8;

  const totalW = W + margin * 2;
  const totalH = H * 2 + gapY + margin * 2;

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${-margin} ${-margin} ${totalW} ${totalH}`}
      width="100%"
      height="100%"
      className={className}
    >
      {showDieCutGuides && project.showDimensionGuides && (
        <text
          x={W / 2}
          y={-2.2}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="1.8"
          fill="#71717A"
        >
          89 × 42 mm — CARA A
        </text>
      )}

      <SingleCassetteLabelSvg
        project={project}
        side="A"
        x={0}
        y={0}
        showDieCutGuides={showDieCutGuides}
        showCassetteMechanics={showCassetteMechanics}
      />

      {showDieCutGuides && project.showDimensionGuides && (
        <text
          x={W / 2}
          y={H + gapY - 2.2}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="1.8"
          fill="#71717A"
        >
          89 × 42 mm — CARA B
        </text>
      )}

      <SingleCassetteLabelSvg
        project={project}
        side="B"
        x={0}
        y={H + gapY}
        showDieCutGuides={showDieCutGuides}
        showCassetteMechanics={showCassetteMechanics}
      />
    </svg>
  );
};
