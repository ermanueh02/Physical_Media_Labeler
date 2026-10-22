import React from 'react';
import {
  CassetteProject,
  PAPER_STOCKS,
  PHYSICAL_SPECS,
} from '../../types/cassette';
import { formatDuration } from '../../utils/timeAndBalance';
import { getFontFamilyForPreset } from './JCardSvgRenderer';
import {
  CompactDiscLogo,
  CompanyLogoBadge,
  RightsSocietyBox,
  TdkLogoVector,
} from './TechnicalLogos';

interface CdDiscLabelSvgRendererProps {
  project: CassetteProject;
  showDieCutGuides?: boolean;
  showDiscMechanics?: boolean;
  svgRef?: React.RefObject<SVGSVGElement>;
  className?: string;
  idPrefix?: string;
}

export const CdDiscLabelSvgRenderer: React.FC<CdDiscLabelSvgRendererProps> = ({
  project,
  showDieCutGuides = true,
  showDiscMechanics = false,
  svgRef,
  className = '',
  idPrefix = 'cd-disc',
}) => {
  const outerD = PHYSICAL_SPECS.CD_DISC_OUTER_DIAMETER_MM; // 116 mm
  const outerR = outerD / 2; // 58 mm
  const hubR = PHYSICAL_SPECS.CD_DISC_HUB_DIAMETER_MM / 2; // 20.5 mm
  const holeR = PHYSICAL_SPECS.CD_DISC_HOLE_DIAMETER_MM / 2; // 11 mm

  const margin = showDieCutGuides ? 8 : 2;
  const viewSize = outerD + margin * 2;
  const cx = outerR;
  const cy = outerR;

  const basePaper = PAPER_STOCKS[project.paperStock] || PAPER_STOCKS['editorial-cream'];
  const paper = {
    ...basePaper,
    bgHex: project.customBgColor || basePaper.bgHex,
    textHex: project.customTextColor || basePaper.textHex,
    subTextHex: project.customTextColor ? project.customTextColor : basePaper.subTextHex,
  };
  const fontFamily = getFontFamilyForPreset(project.typography);

  const totalSec = project.tracks.reduce((s, t) => s + t.durationSec, 0);
  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max - 1) + '…' : str;

  const activeLogo =
    project.companyLogo && project.companyLogo !== 'auto' && project.companyLogo !== 'none'
      ? project.companyLogo
      : project.templateId === 'cbs-epic'
      ? 'cbs'
      : project.templateId === 'emi-harvest'
      ? 'emi'
      : project.templateId === 'warner-sire'
      ? 'warner'
      : project.templateId === 'deutsche-grammophon'
      ? 'dg'
      : project.templateId === 'tdk-d-index'
      ? 'tdk'
      : 'arista';

  const isFullBleed = project.templateId === 'full-bleed-art' || project.fullBleedFront;
  const isTDK = project.templateId === 'tdk-d-index';
  const isHw = project.typography === 'handwritten-pen';

  const maskId = `${idPrefix}-donut-mask`;
  const clipId = `${idPrefix}-outer-clip`;

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${-margin} ${-margin} ${viewSize} ${viewSize}`}
      width="100%"
      height="100%"
      className={className}
    >
      <defs>
        <mask id={maskId}>
          <rect x={-margin} y={-margin} width={viewSize} height={viewSize} fill="black" />
          <circle cx={cx} cy={cy} r={outerR} fill="white" />
          <circle cx={cx} cy={cy} r={showDiscMechanics ? holeR : hubR} fill="black" />
        </mask>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={outerR} />
        </clipPath>
        <linearGradient id={`${idPrefix}-cd-sheen`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="45%" stopColor="#A1A1AA" stopOpacity="0.05" />
          <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {showDieCutGuides && project.showDimensionGuides && (
        <text
          x={cx}
          y={-3}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="2.0"
          fill="#71717A"
        >
          GALLETA / ETIQUETA CD — Ø 116 mm (Hub Ø 41 mm / Centro Ø 22 mm)
        </text>
      )}

      {/* Printable Donut Area */}
      <g mask={`url(#${maskId})`}>
        <g clipPath={`url(#${clipId})`}>
          <rect x={0} y={0} width={outerD} height={outerD} fill={paper.bgHex} />

          {isFullBleed && (
            <g>
              <image
                href={project.coverUrl}
                x={0}
                y={0}
                width={outerD}
                height={outerD}
                preserveAspectRatio="xMidYMid slice"
                opacity="0.32"
              />
            </g>
          )}

          {isTDK ? (
            // TDK CD-R80 Printable Disc Style
            <g>
              <rect x={0} y={0} width={outerD} height={34} fill="#D5D4CE" />
              <line x1={0} y1={34} x2={outerD} y2={34} stroke="#18181B" strokeWidth="0.6" />
              <rect x={cx - 16} y={7} width={32} height={9} fill={project.accentColor} rx="1" />
              <TdkLogoVector x={cx - 11} y={8.5} width={22} height={5.6} color="#FFFFFF" />
              <text
                x={cx}
                y={22}
                textAnchor="middle"
                fill="#18181B"
                fontFamily="Inter, Helvetica, Arial, sans-serif"
                fontStyle="italic"
                fontWeight="900"
                fontSize="4.6"
              >
                CD-R80 • 700MB
              </text>
              <text
                x={cx}
                y={30.5}
                textAnchor="middle"
                fill={paper.textHex}
                fontFamily={fontFamily}
                fontWeight="700"
                fontSize={isHw ? '6.4' : '4.4'}
              >
                {truncate(project.albumTitle, 26)}
              </text>
            </g>
          ) : project.templateId === 'awesome-mix-quill' ? (
            // Peter Quill's "Awesome Mix" 1970s Striped Disc Label
            <g>
              <rect x={0} y={0} width={outerD} height={outerD} fill="#FAF4E4" />
              {[13, 19, 25, 31].map((ly) => (
                <line
                  key={`cd-disc-am-${ly}`}
                  x1={10}
                  y1={ly}
                  x2={outerD - 10}
                  y2={ly}
                  stroke="#B8AA91"
                  strokeWidth="0.22"
                />
              ))}
              <text
                x={cx}
                y={23.5}
                textAnchor="middle"
                fill="#111111"
                fontFamily="'Caveat', cursive, sans-serif"
                fontWeight="700"
                fontSize="8.2"
                transform={`rotate(-1.2, ${cx}, 23.5)`}
              >
                {truncate(project.albumTitle.toUpperCase(), 22)}
              </text>
              <text
                x={cx}
                y={30}
                textAnchor="middle"
                fill="#78350F"
                fontFamily="'Caveat', cursive, sans-serif"
                fontWeight="700"
                fontSize="4.2"
              >
                {truncate(project.albumArtist, 28)}
              </text>
              {/* 1970s Stripes Across Center of Disc */}
              <rect x={0} y={35} width={outerD} height={4.5} fill="#F59E0B" />
              <rect x={0} y={39.5} width={outerD} height={4.5} fill="#EA580C" />
              <rect x={0} y={44} width={outerD} height={5} fill="#B91C1C" />
              <rect x={0} y={49} width={outerD} height={16} fill="#18181B" />
              <circle
                cx={cx}
                cy={cy}
                r={outerR - 2.2}
                fill="none"
                stroke="#18181B"
                strokeWidth="0.7"
              />
            </g>
          ) : (
            // Classic Commercial / Vintage Label CD Disc Face (CBS, EMI, Arista, Warner, DG)
            <g>
              {/* Outer Accent Ring */}
              <circle
                cx={cx}
                cy={cy}
                r={outerR - 2.5}
                fill="none"
                stroke={project.accentColor}
                strokeWidth="1.2"
              />
              <circle
                cx={cx}
                cy={cy}
                r={outerR - 4.2}
                fill="none"
                stroke={paper.textHex}
                strokeWidth="0.25"
              />

              {/* Top Banner Band */}
              <rect x={0} y={18} width={outerD} height={8.5} fill={project.accentColor} />
              <text
                x={cx}
                y={23.6}
                textAnchor="middle"
                fill="#FFFFFF"
                fontFamily="Inter, Helvetica, sans-serif"
                fontWeight="900"
                fontSize="3.4"
                letterSpacing="0.35"
              >
                {truncate(project.recordLabel.toUpperCase(), 24)}
              </text>

              {/* Album Title & Artist Above Hub */}
              <text
                x={cx}
                y={32.5}
                textAnchor="middle"
                fill={paper.textHex}
                fontFamily={fontFamily}
                fontWeight="800"
                fontSize="4.2"
                letterSpacing="0.16"
              >
                {truncate(project.albumTitle.toUpperCase(), 26)}
              </text>
              <text
                x={cx}
                y={36.6}
                textAnchor="middle"
                fill={paper.subTextHex}
                fontFamily={fontFamily}
                fontWeight="600"
                fontSize="2.6"
                letterSpacing="0.14"
              >
                {truncate(project.albumArtist.toUpperCase(), 32)}
              </text>
            </g>
          )}

          {/* Left Wing of CD Disc: Compact Disc Logo & Catalog */}
          <g transform={`translate(11, ${cy - 6})`}>
            <CompactDiscLogo x={0} y={0} width={14} height={6.5} color={paper.textHex} />
            <text
              x={7}
              y={9.5}
              textAnchor="middle"
              fill={project.accentColor}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fontSize="2.0"
            >
              {truncate(project.catalogNumber, 14)}
            </text>
            <text
              x={7}
              y={12.4}
              textAnchor="middle"
              fill={paper.subTextHex}
              fontFamily="JetBrains Mono, monospace"
              fontSize="1.8"
            >
              {formatDuration(totalSec)}
            </text>
          </g>

          {/* Right Wing of CD Disc: Company Logo & Rights Box */}
          <g transform={`translate(${outerD - 26}, ${cy - 6})`}>
            <CompanyLogoBadge
              logoId={activeLogo}
              x={1}
              y={0}
              width={13}
              height={5.4}
              color={paper.textHex}
            />
            <RightsSocietyBox x={0.8} y={7.2} color={paper.textHex} text="SGAE / BIEM" />
            <text
              x={7.5}
              y={13.5}
              textAnchor="middle"
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="700"
              fontSize="1.65"
            >
              STEREO • {project.releaseYear}
            </text>
          </g>

          {/* Bottom Half of CD Disc (y: 80..108): Tracklist Columns */}
          <g transform={`translate(${cx}, 82)`}>
            {project.tracks.slice(0, 10).map((t, idx) => {
              const col = idx < 5 ? -1 : 1;
              const row = idx % 5;
              const tx = col === -1 ? -32 : 3;
              const ty = row * 4.2;
              return (
                <text
                  key={t.id}
                  x={tx}
                  y={ty}
                  fill={paper.textHex}
                  fontFamily={fontFamily}
                  fontWeight="600"
                  fontSize={isHw ? '2.85' : '1.95'}
                >
                  {idx + 1}. {truncate(t.title, 18)} ({formatDuration(t.durationSec)})
                </text>
              );
            })}
          </g>

          {/* Simulated Polycarbonate Sheen when showDiscMechanics is enabled */}
          {showDiscMechanics && (
            <circle cx={cx} cy={cy} r={outerR} fill={`url(#${idPrefix}-cd-sheen)`} />
          )}
        </g>
      </g>

      {/* Polycarbonate Clear Clamping Hub & Center Hole Mechanics */}
      {showDiscMechanics ? (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={hubR}
            fill="rgba(228, 228, 231, 0.35)"
            stroke="#A1A1AA"
            strokeWidth="0.4"
          />
          <circle
            cx={cx}
            cy={cy}
            r={hubR - 3.5}
            fill="none"
            stroke="#D4D4D8"
            strokeWidth="0.6"
            strokeDasharray="3 1.5"
          />
          <circle cx={cx} cy={cy} r={holeR} fill="#18181B" stroke="#71717A" strokeWidth="0.5" />
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#D4D4D8" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          {/* Die-Cut Outer & Inner Hub Guides */}
          <circle
            cx={cx}
            cy={cy}
            r={outerR}
            fill="none"
            stroke={showDieCutGuides ? '#A1A1AA' : paper.borderHex}
            strokeWidth="0.28"
          />
          <circle
            cx={cx}
            cy={cy}
            r={hubR}
            fill="none"
            stroke={showDieCutGuides ? '#A1A1AA' : paper.borderHex}
            strokeWidth="0.25"
            strokeDasharray={showDieCutGuides ? '1.6 1.2' : undefined}
          />
          {showDieCutGuides && (
            <circle
              cx={cx}
              cy={cy}
              r={holeR}
              fill="none"
              stroke="#A1A1AA"
              strokeWidth="0.2"
              strokeDasharray="1.0 0.8"
            />
          )}
        </g>
      )}
    </svg>
  );
};
