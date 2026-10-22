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
  DeutscheGrammophonCrest,
  RightsSocietyBox,
  TdkLogoVector,
  VectorBarcodeSvg,
  VectorQrCodeSvg,
} from './TechnicalLogos';

interface CdInsertsSvgRendererProps {
  project: CassetteProject;
  part?: 'both' | 'front-only' | 'tray-only';
  includePrintGuides?: boolean;
  svgRef?: React.RefObject<SVGSVGElement>;
  className?: string;
  idPrefix?: string;
}

export const CdInsertsSvgRenderer: React.FC<CdInsertsSvgRendererProps> = ({
  project,
  part = 'both',
  includePrintGuides = true,
  svgRef,
  className = '',
  idPrefix = 'cd-inserts',
}) => {
  const basePaper = PAPER_STOCKS[project.paperStock] || PAPER_STOCKS['editorial-cream'];
  const paper = {
    ...basePaper,
    bgHex: project.customBgColor || basePaper.bgHex,
    textHex: project.customTextColor || basePaper.textHex,
    subTextHex: project.customTextColor ? project.customTextColor : basePaper.subTextHex,
  };
  const fontFamily = getFontFamilyForPreset(project.typography);

  const frontW = PHYSICAL_SPECS.CD_FRONT_WIDTH_MM; // 120 mm
  const frontH = PHYSICAL_SPECS.CD_FRONT_HEIGHT_MM; // 120 mm
  const trayW = PHYSICAL_SPECS.CD_TRAY_TOTAL_WIDTH_MM; // 150 mm (6 + 138 + 6)
  const trayH = PHYSICAL_SPECS.CD_TRAY_HEIGHT_MM; // 118 mm
  const spineW = PHYSICAL_SPECS.CD_TRAY_SPINE_WIDTH_MM; // 6 mm
  const backW = PHYSICAL_SPECS.CD_TRAY_BACK_WIDTH_MM; // 138 mm

  const gapX = 14; // Gap between Front Booklet and Back Tray when rendering 'both'
  const margin = includePrintGuides ? 10 : 0;

  const contentW =
    part === 'front-only' ? frontW : part === 'tray-only' ? trayW : frontW + gapX + trayW;
  const contentH = part === 'tray-only' ? trayH : frontH;

  const viewBoxW = contentW + margin * 2;
  const viewBoxH = contentH + margin * 2;

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

  const renderCoverArt = (
    boxX: number,
    boxY: number,
    boxW: number,
    boxH: number,
    clipId: string
  ) => {
    const zoom = Math.max(0.8, Math.min(3.5, project.coverFraming.zoom || 1));
    const imgW = boxW * zoom;
    const imgH = boxH * zoom;
    const panOffsetX = (project.coverFraming.panX / 100) * (boxW * 0.5);
    const panOffsetY = (project.coverFraming.panY / 100) * (boxH * 0.5);
    const imgX = boxX + (boxW - imgW) / 2 + panOffsetX;
    const imgY = boxY + (boxH - imgH) / 2 + panOffsetY;

    const filterStyle =
      project.coverFraming.filter === 'monochrome'
        ? 'grayscale(100%) contrast(115%)'
        : project.coverFraming.filter === 'warm-70s'
        ? 'sepia(24%) contrast(106%) saturate(110%)'
        : project.coverFraming.filter === 'high-contrast'
        ? 'contrast(128%) saturate(115%)'
        : undefined;

    return (
      <g>
        <defs>
          <clipPath id={clipId}>
            <rect x={boxX} y={boxY} width={boxW} height={boxH} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="#18181B" />
          <image
            href={project.coverUrl}
            x={imgX}
            y={imgY}
            width={imgW}
            height={imgH}
            preserveAspectRatio="xMidYMid slice"
            style={filterStyle ? { filter: filterStyle } : undefined}
          />
          {project.coverFraming.filter === 'warm-70s' && (
            <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="#D97706" opacity="0.08" />
          )}
        </g>
      </g>
    );
  };

  // 1. CD FRONT BOOKLET (120 x 120 mm)
  const renderCdFrontCover = (offsetX: number, offsetY: number) => {
    const isFullBleed = project.templateId === 'full-bleed-art' || project.fullBleedFront;

    return (
      <g transform={`translate(${offsetX}, ${offsetY})`}>
        <defs>
          <clipPath id={`${idPrefix}-cd-front-clip`}>
            <rect x={0} y={0} width={frontW} height={frontH} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${idPrefix}-cd-front-clip)`}>
          <rect x={0} y={0} width={frontW} height={frontH} fill={paper.bgHex} />

          {isFullBleed ? (
            <g>
              {renderCoverArt(0, 0, frontW, frontH, `${idPrefix}-cd-fullbleed`)}
              {project.fullBleedShowOverlayText !== false && (
                <g>
                  <rect
                    x={8}
                    y={92}
                    width={frontW - 16}
                    height={21}
                    rx={1.5}
                    fill={paper.bgHex}
                    opacity="0.9"
                  />
                  <text
                    x={frontW / 2}
                    y={100.5}
                    textAnchor="middle"
                    fill={paper.textHex}
                    fontFamily={fontFamily}
                    fontWeight="800"
                    fontSize="5.2"
                    letterSpacing="0.2"
                  >
                    {truncate(project.albumTitle, 28)}
                  </text>
                  <text
                    x={frontW / 2}
                    y={106.2}
                    textAnchor="middle"
                    fill={paper.subTextHex}
                    fontFamily={fontFamily}
                    fontWeight="600"
                    fontSize="3.2"
                    letterSpacing="0.16"
                  >
                    {truncate(project.albumArtist, 34)}
                  </text>
                  <CompanyLogoBadge
                    logoId={activeLogo}
                    x={12}
                    y={106.5}
                    width={12}
                    height={4.8}
                    color={paper.textHex}
                  />
                  <CompactDiscLogo
                    x={frontW - 24}
                    y={106}
                    width={12}
                    height={5.4}
                    color={paper.textHex}
                  />
                </g>
              )}
            </g>
          ) : project.templateId === 'tdk-d-index' ? (
            // TDK CD-R / Index Card Style Front Booklet (120 x 120 mm)
            <g>
              <rect x={0} y={0} width={frontW} height={18} fill="#D5D4CE" />
              <polygon points="0,0 38,0 32,18 0,18" fill={project.accentColor} />
              <TdkLogoVector x={4.5} y={3.2} width={22} height={5.2} color="#FFFFFF" />
              <text
                x={16}
                y={15.2}
                textAnchor="middle"
                fill="#D5D4CE"
                fontFamily="Inter, Helvetica, Arial, sans-serif"
                fontStyle="italic"
                fontWeight="900"
                fontSize="5.8"
              >
                CD-R80
              </text>
              <line x1={38} y1={0} x2={32} y2={18} stroke="#18181B" strokeWidth="0.6" />
              <line x1={0} y1={18} x2={frontW} y2={18} stroke="#18181B" strokeWidth="0.55" />

              <text
                x={76}
                y={10.2}
                textAnchor="middle"
                fill="#18181B"
                fontFamily={fontFamily}
                fontWeight="700"
                fontSize={project.typography === 'handwritten-pen' ? '7.5' : '5.2'}
              >
                {truncate(project.albumTitle, 26)}
              </text>
              <text
                x={76}
                y={15.4}
                textAnchor="middle"
                fill="#3F3F46"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
                fontSize="2.2"
              >
                DATE: {project.releaseYear} • TIME: {formatDuration(totalSec)}
              </text>

              {/* 12 Ruled Lines across 2 columns on the CD Front Index */}
              {Array.from({ length: 12 }).map((_, rIdx) => {
                const rowH = (frontH - 22) / 12;
                const yBottom = 20 + (rIdx + 1) * rowH;
                const leftTrack = project.tracks[rIdx];
                const rightTrack = project.tracks[rIdx + 12];
                const isHw = project.typography === 'handwritten-pen';

                return (
                  <g key={`cd-tdk-r-${rIdx}`}>
                    <line
                      x1={5}
                      y1={yBottom}
                      x2={frontW - 5}
                      y2={yBottom}
                      stroke="#52525B"
                      strokeWidth="0.22"
                      strokeDasharray="0.6 0.8"
                    />
                    <circle cx={frontW / 2} cy={yBottom - rowH * 0.45} r={0.5} fill="#18181B" />
                    {leftTrack && (
                      <text
                        x={6}
                        y={yBottom - 1.5}
                        fill={paper.textHex}
                        fontFamily={fontFamily}
                        fontWeight="700"
                        fontSize={isHw ? '3.8' : '2.5'}
                      >
                        {rIdx + 1}. {truncate(`${leftTrack.title} - ${leftTrack.artist}`, 26)}
                      </text>
                    )}
                    {rightTrack && (
                      <text
                        x={frontW / 2 + 3}
                        y={yBottom - 1.5}
                        fill={paper.textHex}
                        fontFamily={fontFamily}
                        fontWeight="700"
                        fontSize={isHw ? '3.8' : '2.5'}
                      >
                        {rIdx + 13}. {truncate(`${rightTrack.title} - ${rightTrack.artist}`, 26)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ) : project.templateId === 'deutsche-grammophon' ? (
            <g>
              <rect
                x={8}
                y={7}
                width={frontW - 16}
                height={30}
                fill={project.accentColor}
                stroke="#18181B"
                strokeWidth="0.5"
              />
              <rect
                x={9.5}
                y={8.5}
                width={frontW - 19}
                height={27}
                fill="none"
                stroke="#18181B"
                strokeWidth="0.25"
              />
              <DeutscheGrammophonCrest x={frontW / 2 - 8} y={9.5} width={16} height={4.5} color="#18181B" />
              <text
                x={frontW / 2}
                y={17.2}
                textAnchor="middle"
                fill="#18181B"
                fontFamily="Cinzel, Georgia, serif"
                fontWeight="800"
                fontSize="2.6"
                letterSpacing="0.4"
              >
                {project.recordLabel.toUpperCase()}
              </text>
              <text
                x={frontW / 2}
                y={24.5}
                textAnchor="middle"
                fill="#18181B"
                fontFamily={fontFamily}
                fontWeight="700"
                fontSize="3.4"
              >
                {truncate(project.albumArtist.toUpperCase(), 32)}
              </text>
              <text
                x={frontW / 2}
                y={31.2}
                textAnchor="middle"
                fill="#18181B"
                fontFamily={fontFamily}
                fontWeight="800"
                fontSize="4.4"
              >
                {truncate(project.albumTitle.toUpperCase(), 28)}
              </text>
              {renderCoverArt(8, 40, frontW - 16, 72, `${idPrefix}-cd-dg-art`)}
            </g>
          ) : project.templateId === 'awesome-mix-quill' ? (
            // Peter Quill's "Awesome Mix Vol. 1" CD Front Booklet (120 x 120 mm)
            <g>
              <rect x={0} y={0} width={frontW} height={42} fill="#F2EFE6" />
              {/* Blue Marker Title Above Graduated Red Stripes */}
              <text
                x={frontW / 2}
                y={14.5}
                textAnchor="middle"
                fill="#24477F"
                fontFamily="'Permanent Marker', 'Architects Daughter', 'Caveat', cursive"
                fontWeight="700"
                fontSize="7.4"
                letterSpacing="0.45"
              >
                {truncate(project.albumTitle.toUpperCase(), 24)}
              </text>
              {/* 7 Graduated Red Stripes */}
              <rect x={0} y={18.5} width={frontW} height={0.55} fill="#D43B30" />
              <rect x={0} y={21.8} width={frontW} height={0.95} fill="#D43B30" />
              <rect x={0} y={25.2} width={frontW} height={1.45} fill="#D43B30" />
              <rect x={0} y={28.8} width={frontW} height={2.1} fill="#D43B30" />
              <rect x={0} y={32.6} width={frontW} height={2.9} fill="#D43B30" />
              <rect x={0} y={36.8} width={frontW} height={5.2} fill="#D43B30" />

              {/* Middle Black Guardians Soundtrack Bar with Barcode */}
              <rect x={0} y={42} width={frontW} height={22} fill="#22201E" />
              <rect x={24} y={44} width={9.5} height={2.8} fill="#D43B30" />
              <text
                x={28.75}
                y={46.1}
                textAnchor="middle"
                fill="#FFFFFF"
                fontFamily="'Oswald', Impact, sans-serif"
                fontWeight="900"
                fontSize="2.0"
              >
                {truncate(project.recordLabel.split('/')[0].trim().toUpperCase() || 'MARVEL', 8)}
              </text>
              <text
                x={28.75}
                y={52.8}
                textAnchor="middle"
                fill="#F4F4F5"
                fontFamily="'Oswald', 'Barlow Condensed', Impact, sans-serif"
                fontWeight="900"
                fontSize="6.6"
                letterSpacing="0.1"
              >
                {truncate(project.albumArtist.toUpperCase(), 20)}
              </text>
              <text
                x={28.75}
                y={56.4}
                textAnchor="middle"
                fill="#E4E4E7"
                fontFamily="'Barlow Condensed', Inter, sans-serif"
                fontWeight="800"
                fontSize="2.1"
                letterSpacing="0.1"
              >
                ORIGINAL MOTION PICTURE SOUNDTRACK
              </text>
              <VectorBarcodeSvg
                code={project.barcodeNumber || '050087316792'}
                x={64}
                y={44.2}
                width={48}
                height={13}
                color="#18181B"
                bgColor="#FFFFFF"
              />
              <line x1={4} y1={59.2} x2={frontW - 4} y2={59.2} stroke="#D43B30" strokeWidth="0.55" />

              {/* Bottom Beige 2-Column A | B Index Card */}
              <rect x={0} y={64} width={frontW} height={56} fill="#E2D8C5" />
              {[0, 1].map((colIdx) => {
                const colX = colIdx === 0 ? 5 : 62;
                const colWidth = 53;
                const sideLetter = colIdx === 0 ? 'A' : 'B';
                const colTracks =
                  colIdx === 0
                    ? project.tracks.slice(0, Math.ceil(project.tracks.length / 2))
                    : project.tracks.slice(Math.ceil(project.tracks.length / 2));
                const fullSlash = colTracks
                  .map((t) => `${t.title.toUpperCase()} - ${t.artist.toUpperCase()}`)
                  .join(' / ');
                const words = fullSlash ? fullSlash.split(' ') : [];
                const wrapped: string[] = [];
                let cur = '';
                for (const w of words) {
                  const cand = cur ? `${cur} ${w}` : w;
                  if (cand.length <= 28) cur = cand;
                  else {
                    if (cur) wrapped.push(cur);
                    cur = w;
                  }
                }
                if (cur) wrapped.push(cur);

                return (
                  <g key={`cd-am-col-${sideLetter}`} transform={`translate(${colX}, 66.5)`}>
                    <rect x={0} y={0} width={6.5} height={6.5} fill="#6B5E4F" />
                    <text
                      x={3.25}
                      y={5.1}
                      textAnchor="middle"
                      fill="#EAE2D3"
                      fontFamily="Inter, Helvetica, sans-serif"
                      fontWeight="800"
                      fontSize="4.8"
                    >
                      {sideLetter}
                    </text>
                    <text x={8.2} y={2.4} fill="#5A4E40" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="2.0" letterSpacing="0.2">
                      DATE
                    </text>
                    <line x1={8.2} y1={3.1} x2={colWidth} y2={3.1} stroke="#786B5C" strokeWidth="0.3" />
                    <text x={8.2} y={5.8} fill="#5A4E40" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="2.0" letterSpacing="0.16">
                      NOISE REDUCTION
                    </text>
                    <rect x={34} y={3.9} width={2.2} height={2.2} fill="none" stroke="#5A4E40" strokeWidth="0.3" />
                    <rect x={0} y={7.5} width={colWidth} height={0.95} fill="#4A3F34" />

                    {Array.from({ length: 9 }).map((_, lIdx) => {
                      const ly = 12.5 + lIdx * 4.4;
                      const txt = wrapped[lIdx];
                      return (
                        <g key={`cd-am-l-${sideLetter}-${lIdx}`}>
                          <line x1={0} y1={ly} x2={colWidth} y2={ly} stroke="#7D7061" strokeWidth="0.3" />
                          {txt && (
                            <text
                              x={0.4}
                              y={ly - 0.9}
                              fill="#233554"
                              fontFamily="'Architects Daughter', 'Caveat', cursive"
                              fontWeight="700"
                              fontSize="2.75"
                            >
                              {txt}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          ) : (
            // Standard Editorial Framed CD Booklet (CBS, EMI, Warner, ECM, Factory, Blue Note, etc.)
            <g>
              <rect x={0} y={0} width={frontW} height={8} fill={project.accentColor} />
              <text
                x={10}
                y={5.3}
                fill="#FFFFFF"
                fontFamily="Inter, Helvetica, sans-serif"
                fontWeight="800"
                fontSize="2.6"
                letterSpacing="0.25"
              >
                COMPACT DISC DIGITAL AUDIO • {project.catalogNumber}
              </text>

              {renderCoverArt(10, 13, 100, 76, `${idPrefix}-cd-std-art`)}
              <rect
                x={10}
                y={13}
                width={100}
                height={76}
                fill="none"
                stroke={project.accentColor}
                strokeWidth="0.4"
              />

              <text
                x={10}
                y={97.5}
                fill={paper.textHex}
                fontFamily={fontFamily}
                fontWeight="800"
                fontSize="5.2"
                letterSpacing="0.18"
              >
                {truncate(project.albumTitle.toUpperCase(), 26)}
              </text>
              <text
                x={10}
                y={103.5}
                fill={paper.subTextHex}
                fontFamily={fontFamily}
                fontWeight="600"
                fontSize="3.2"
                letterSpacing="0.14"
              >
                {truncate(project.albumArtist.toUpperCase(), 34)}
              </text>

              <CompanyLogoBadge
                logoId={activeLogo}
                x={10}
                y={108.5}
                width={13}
                height={5.2}
                color={project.accentColor}
              />
              <CompactDiscLogo
                x={frontW - 23}
                y={108}
                width={13}
                height={5.8}
                color={paper.textHex}
              />
            </g>
          )}
        </g>

        <rect
          x={0}
          y={0}
          width={frontW}
          height={frontH}
          fill="none"
          stroke={includePrintGuides && project.showCropMarks ? '#A1A1AA' : paper.borderHex}
          strokeWidth="0.25"
        />

        {includePrintGuides && project.showDimensionGuides && (
          <text
            x={frontW / 2}
            y={-2.5}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="2.1"
            fill="#71717A"
          >
            CARÁTULA FRONTAL CD — 120 × 120 mm
          </text>
        )}
      </g>
    );
  };

  // 2. CD BACK TRAY CARD / INLAY (150 x 118 mm: 6 mm Left Spine + 138 mm Back + 6 mm Right Spine)
  const renderCdTrayInlay = (offsetX: number, offsetY: number) => {
    const leftSpineX = 0;
    const backX = spineW; // 6 mm
    const rightSpineX = spineW + backW; // 144 mm

    const tracks = project.tracks.slice(0, 24);
    const useTwoCols = tracks.length > 11;
    const col1Tracks = useTwoCols ? tracks.slice(0, Math.ceil(tracks.length / 2)) : tracks;
    const col2Tracks = useTwoCols ? tracks.slice(Math.ceil(tracks.length / 2)) : [];

    const renderSpineStrip = (sx: number, flip: boolean) => {
      const cx = sx + spineW / 2;
      return (
        <g>
          <rect x={sx} y={0} width={spineW} height={trayH} fill={paper.bgHex} />
          <g transform={`translate(${cx}, ${trayH / 2}) rotate(${flip ? 90 : -90})`}>
            <text
              x={-52}
              y={0.9}
              fill={project.accentColor}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="800"
              fontSize="2.2"
            >
              {truncate(project.catalogNumber, 12)}
            </text>
            <text
              x={0}
              y={0.9}
              textAnchor="middle"
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="800"
              fontSize="2.6"
              letterSpacing="0.18"
            >
              {truncate(
                `${project.albumArtist ? project.albumArtist + ' — ' : ''}${project.albumTitle}`.toUpperCase(),
                38
              )}
            </text>
            <text
              x={52}
              y={0.9}
              textAnchor="end"
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="800"
              fontSize="2.1"
            >
              {truncate(project.recordLabel.toUpperCase(), 10)}
            </text>
          </g>
        </g>
      );
    };

    return (
      <g transform={`translate(${offsetX}, ${offsetY})`}>
        <defs>
          <clipPath id={`${idPrefix}-cd-tray-clip`}>
            <rect x={0} y={0} width={trayW} height={trayH} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${idPrefix}-cd-tray-clip)`}>
          {/* Center Back Panel (138 x 118 mm) */}
          <rect x={backX} y={0} width={backW} height={trayH} fill={paper.bgHex} />

          {/* Top Accent Bar */}
          <rect x={backX} y={0} width={backW} height={4.5} fill={project.accentColor} />

          {/* Header Block */}
          <g transform={`translate(${backX + 8}, 12.5)`}>
            <text
              x={0}
              y={0}
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="800"
              fontSize="4.6"
              letterSpacing="0.16"
            >
              {truncate(project.albumTitle.toUpperCase(), 34)}
            </text>
            <text
              x={0}
              y={4.8}
              fill={paper.subTextHex}
              fontFamily={fontFamily}
              fontWeight="600"
              fontSize="2.8"
              letterSpacing="0.14"
            >
              {truncate(project.albumArtist.toUpperCase(), 42)}
            </text>

            <text
              x={backW - 16}
              y={0}
              textAnchor="end"
              fill={project.accentColor}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fontSize="2.4"
            >
              {project.catalogNumber}
            </text>
            <text
              x={backW - 16}
              y={4.5}
              textAnchor="end"
              fill={paper.subTextHex}
              fontFamily="JetBrains Mono, monospace"
              fontSize="2.0"
            >
              TOTAL TIME: {formatDuration(totalSec)}
            </text>
            <line
              x1={0}
              y1={8.2}
              x2={backW - 16}
              y2={8.2}
              stroke={project.accentColor}
              strokeWidth="0.35"
            />
          </g>

          {/* Tracklist Section (Single or Two Columns) */}
          <g transform={`translate(${backX + 8}, 26.5)`}>
            {col1Tracks.map((t, idx) => {
              const rowY = idx * (useTwoCols ? 5.1 : 5.6);
              const hasArtist =
                t.artist &&
                t.artist.trim() !== '' &&
                t.artist.toLowerCase() !== project.albumArtist.toLowerCase();
              const label = hasArtist ? `${t.title} - ${t.artist}` : t.title;
              const colWidth = useTwoCols ? 57 : backW - 16;

              return (
                <g key={t.id}>
                  <line
                    x1={0}
                    y1={rowY + 1.4}
                    x2={colWidth}
                    y2={rowY + 1.4}
                    stroke={paper.borderHex}
                    strokeWidth="0.12"
                    opacity="0.2"
                  />
                  <text
                    x={0}
                    y={rowY}
                    fill={project.accentColor}
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                    fontSize="2.1"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </text>
                  <text
                    x={6}
                    y={rowY}
                    fill={paper.textHex}
                    fontFamily={fontFamily}
                    fontWeight="600"
                    fontSize={useTwoCols ? '2.25' : '2.65'}
                  >
                    {truncate(label, useTwoCols ? 28 : 54)}
                  </text>
                  <text
                    x={colWidth}
                    y={rowY}
                    textAnchor="end"
                    fill={paper.subTextHex}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="2.0"
                  >
                    {formatDuration(t.durationSec)}
                  </text>
                </g>
              );
            })}

            {useTwoCols &&
              col2Tracks.map((t, idx) => {
                const trackNum = col1Tracks.length + idx + 1;
                const rowY = idx * 5.1;
                const colOffset = 65;
                const colWidth = 57;
                const hasArtist =
                  t.artist &&
                  t.artist.trim() !== '' &&
                  t.artist.toLowerCase() !== project.albumArtist.toLowerCase();
                const label = hasArtist ? `${t.title} - ${t.artist}` : t.title;

                return (
                  <g key={t.id} transform={`translate(${colOffset}, 0)`}>
                    <line
                      x1={0}
                      y1={rowY + 1.4}
                      x2={colWidth}
                      y2={rowY + 1.4}
                      stroke={paper.borderHex}
                      strokeWidth="0.12"
                      opacity="0.2"
                    />
                    <text
                      x={0}
                      y={rowY}
                      fill={project.accentColor}
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="700"
                      fontSize="2.1"
                    >
                      {String(trackNum).padStart(2, '0')}
                    </text>
                    <text
                      x={6}
                      y={rowY}
                      fill={paper.textHex}
                      fontFamily={fontFamily}
                      fontWeight="600"
                      fontSize="2.25"
                    >
                      {truncate(label, 28)}
                    </text>
                    <text
                      x={colWidth}
                      y={rowY}
                      textAnchor="end"
                      fill={paper.subTextHex}
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="2.0"
                    >
                      {formatDuration(t.durationSec)}
                    </text>
                  </g>
                );
              })}
          </g>

          {/* Bottom Technical Footer on CD Back Tray */}
          <g transform={`translate(${backX + 8}, 92)`}>
            <line
              x1={0}
              y1={0}
              x2={backW - 16}
              y2={0}
              stroke={paper.borderHex}
              strokeWidth="0.25"
              opacity="0.4"
            />

            <CompanyLogoBadge
              logoId={activeLogo}
              x={0}
              y={4}
              width={14}
              height={5.6}
              color={paper.textHex}
            />
            <CompactDiscLogo x={17} y={3.8} width={13} height={6} color={paper.textHex} />
            <RightsSocietyBox x={33} y={4.8} color={paper.textHex} text="DDD • STEREO" />

            <text
              x={0}
              y={14.5}
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="600"
              fontSize="1.8"
            >
              {truncate(project.productionCredits || project.countryText, 55)}
            </text>
            <text
              x={0}
              y={18.2}
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontSize="1.55"
            >
              {truncate(project.legalText, 64)}
            </text>

            {/* QR Code (if enabled) */}
            {project.showQrCode && (
              <VectorQrCodeSvg
                data={project.qrCodeUrl || 'https://open.spotify.com'}
                x={backW - 56}
                y={2.5}
                size={16.5}
                color="#18181B"
                bgColor="#FFFFFF"
              />
            )}

            {/* UPC/EAN Barcode (if enabled) */}
            {project.showBarcode && (
              <VectorBarcodeSvg
                code={project.barcodeNumber || project.catalogNumber}
                x={backW - 36}
                y={3}
                width={20}
                height={16}
                color="#18181B"
                bgColor="#FFFFFF"
              />
            )}
          </g>

          {/* Left & Right 6 mm Spines */}
          {renderSpineStrip(leftSpineX, false)}
          {renderSpineStrip(rightSpineX, true)}
        </g>

        {/* Perforated Fold Lines for Left and Right 6mm Spines */}
        {[spineW, spineW + backW].map((fx) => (
          <line
            key={`cd-fold-${fx}`}
            x1={fx}
            y1={0}
            x2={fx}
            y2={trayH}
            stroke="#71717A"
            strokeWidth="0.25"
            strokeDasharray="1.8 1.4"
          />
        ))}

        <rect
          x={0}
          y={0}
          width={trayW}
          height={trayH}
          fill="none"
          stroke={includePrintGuides && project.showCropMarks ? '#A1A1AA' : paper.borderHex}
          strokeWidth="0.25"
        />

        {includePrintGuides && project.showDimensionGuides && (
          <g fontFamily="JetBrains Mono, monospace" fontSize="2.0" fill="#71717A">
            <text x={spineW / 2} y={-2.5} textAnchor="middle">
              6
            </text>
            <text x={spineW + backW / 2} y={-2.5} textAnchor="middle">
              INLAY TRASERO CD — 138 × 118 mm (Total 150 mm)
            </text>
            <text x={spineW + backW + spineW / 2} y={-2.5} textAnchor="middle">
              6
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${-margin} ${-margin} ${viewBoxW} ${viewBoxH}`}
      width="100%"
      height="100%"
      className={className}
    >
      {part === 'front-only' && renderCdFrontCover(0, 0)}
      {part === 'tray-only' && renderCdTrayInlay(0, 0)}
      {part === 'both' && (
        <>
          {renderCdFrontCover(0, 0)}
          {renderCdTrayInlay(frontW + gapX, 1)}
        </>
      )}
    </svg>
  );
};
