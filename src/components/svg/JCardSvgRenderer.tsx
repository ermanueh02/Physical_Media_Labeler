import React from 'react';
import {
  CassetteProject,
  PAPER_STOCKS,
  PHYSICAL_SPECS,
  Track,
  TypographyPreset,
} from '../../types/cassette';
import { formatDuration } from '../../utils/timeAndBalance';
import {
  CompactCassetteLogo,
  CompanyLogoBadge,
  DeutscheGrammophonCrest,
  DolbyVectorLogo,
  EmiLogoVector,
  RightsSocietyBox,
  TdkLogoVector,
  VectorBarcodeSvg,
  VectorQrCodeSvg,
  WarnerSireLogoVector,
} from './TechnicalLogos';

export function getFontFamilyForPreset(preset: TypographyPreset): string {
  switch (preset) {
    case 'helvetica-univers':
      return 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';
    case 'garamond-serif':
      return '"EB Garamond", Garamond, Georgia, "Times New Roman", serif';
    case 'condensed-80s':
      return '"Barlow Condensed", Oswald, Impact, Arial Narrow, sans-serif';
    case 'classical-dg':
      return 'Cinzel, "EB Garamond", Georgia, serif';
    case 'typewriter-mono':
      return '"Courier Prime", "JetBrains Mono", Courier, monospace';
    case 'handwritten-pen':
      return '"Caveat", cursive, sans-serif';
  }
}

interface JCardSvgRendererProps {
  project: CassetteProject;
  includePrintGuides?: boolean;
  svgRef?: React.RefObject<SVGSVGElement>;
  className?: string;
  idPrefix?: string;
}

export const JCardSvgRenderer: React.FC<JCardSvgRendererProps> = ({
  project,
  includePrintGuides = true,
  svgRef,
  className = '',
  idPrefix = 'jcard',
}) => {
  const basePaper = PAPER_STOCKS[project.paperStock] || PAPER_STOCKS['editorial-cream'];
  const paper = {
    ...basePaper,
    bgHex: project.customBgColor || basePaper.bgHex,
    textHex: project.customTextColor || basePaper.textHex,
    subTextHex: project.customTextColor ? project.customTextColor : basePaper.subTextHex,
  };
  const fontFamily = getFontFamilyForPreset(project.typography);

  const extraPanelsCount =
    project.foldFormat === 'j-plus-2' ? 2 : project.foldFormat === 'j-plus-1' ? 1 : 0;

  const flapW = PHYSICAL_SPECS.FLAP_WIDTH_MM; // 19 mm
  const spineW = PHYSICAL_SPECS.SPINE_WIDTH_MM; // 12.5 mm
  const frontW = PHYSICAL_SPECS.FRONT_WIDTH_MM; // 65 mm
  const panelW = PHYSICAL_SPECS.EXTRA_PANEL_WIDTH_MM; // 65 mm
  const cardH = PHYSICAL_SPECS.JCARD_HEIGHT_MM; // 102 mm

  const totalCardW = flapW + spineW + frontW + extraPanelsCount * panelW;
  const margin = includePrintGuides ? 10 : 0;
  const viewBoxW = totalCardW + margin * 2;
  const viewBoxH = cardH + margin * 2;

  const flapX = 0;
  const spineX = flapW; // 19
  const frontX = flapW + spineW; // 31.5
  const panel1X = frontX + frontW; // 96.5
  const panel2X = panel1X + panelW; // 161.5

  const sideATracks = project.tracks.filter((t) => t.side === 'A');
  const sideBTracks = project.tracks.filter((t) => t.side === 'B');
  const sideASec = sideATracks.reduce((s, t) => s + t.durationSec, 0);
  const sideBSec = sideBTracks.reduce((s, t) => s + t.durationSec, 0);

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

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max - 1) + '…' : str;

  // Practical, minimalist 1970s–1980s Front Panel (65 x 102 mm)
  const renderFrontPanel = () => {
    if (project.templateId === 'full-bleed-art' || project.fullBleedFront) {
      // Portada a Sangre Completa (65 x 102 mm) sin marco cuadrado: la imagen ocupa todo el frontal
      const showOverlay = project.fullBleedShowOverlayText !== false;
      const activeLogo =
        project.companyLogo && project.companyLogo !== 'auto' && project.companyLogo !== 'none'
          ? project.companyLogo
          : 'arista';

      return (
        <g>
          {renderCoverArt(frontX, 0, frontW, cardH, `${idPrefix}-full-bleed-cover`)}

          {showOverlay && (
            <g>
              {/* Banda inferior traslúcida o limpia con título y sello */}
              <rect
                x={frontX + 4}
                y={75}
                width={frontW - 8}
                height={21.5}
                rx={1.2}
                fill={paper.bgHex}
                opacity="0.9"
              />
              <text
                x={frontX + frontW / 2}
                y={82.2}
                textAnchor="middle"
                fill={paper.textHex}
                fontFamily={fontFamily}
                fontWeight="800"
                fontSize="3.6"
                letterSpacing="0.16"
              >
                {truncate(project.albumTitle, 25)}
              </text>
              {project.albumArtist.trim() !== '' && (
                <text
                  x={frontX + frontW / 2}
                  y={86.8}
                  textAnchor="middle"
                  fill={paper.subTextHex}
                  fontFamily={fontFamily}
                  fontWeight="600"
                  fontSize="2.25"
                  letterSpacing="0.14"
                >
                  {truncate(project.albumArtist, 30)}
                </text>
              )}

              <CompanyLogoBadge
                logoId={activeLogo}
                x={frontX + 7}
                y={90.2}
                width={10.5}
                height={4.2}
                color={paper.textHex}
              />

              {project.dolbySystem !== 'NONE' && (
                <DolbyVectorLogo
                  x={frontX + frontW - 18}
                  y={90.4}
                  width={11}
                  height={4.0}
                  color={paper.textHex}
                  showText={true}
                />
              )}
            </g>
          )}
        </g>
      );
    }

    switch (project.templateId) {
      case 'awesome-mix-quill': {
        // Plantilla Awesome Mix Vol. 1 (Réplica exacta de las fotos de referencia)
        // Mitad superior: Ventana de cassette con etiqueta blanca/franjas rojas progresivas y "AWESOME MIX VOL. 1" en rotulador azul + banda negra con logo y código de barras.
        // Mitad inferior: Tarjeta beige a 2 columnas [A] y [B] con DATE / NOISE REDUCTION ☐ y tracklist manuscrito continuo separado por barras "/".
        const wrapSlashTracks = (tracks: Track[], maxCharsPerLine: number, maxLines: number): string[] => {
          const fullText = tracks
            .map((t) => {
              const title = t.title.toUpperCase();
              const artist = t.artist ? ` - ${t.artist.toUpperCase()}` : '';
              return `${title}${artist}`;
            })
            .join(' / ');

          if (!fullText) return [];
          const tokens = fullText.split(' ');
          const lines: string[] = [];
          let current = '';

          for (const token of tokens) {
            const candidate = current ? `${current} ${token}` : token;
            if (candidate.length <= maxCharsPerLine) {
              current = candidate;
            } else {
              if (current) lines.push(current);
              current = token;
              if (lines.length >= maxLines - 1) break;
            }
          }
          if (current && lines.length < maxLines) {
            lines.push(current);
          }
          return lines;
        };

        const colALines = wrapSlashTracks(sideATracks, 24, 10);
        const colBLines = wrapSlashTracks(sideBTracks, 24, 10);
        const colW = 28.6;
        const colAX = frontX + 2.6;
        const colBX = frontX + 33.8;

        const renderIndexColumn = (
          sideLetter: 'A' | 'B',
          colX: number,
          wrappedLines: string[]
        ) => (
          <g transform={`translate(${colX}, 49.3)`}>
            {/* Caja cuadrada marrón [A] o [B] */}
            <rect x={0} y={0} width={4.5} height={4.5} fill="#6B5E4F" />
            <text
              x={2.25}
              y={3.55}
              textAnchor="middle"
              fill="#EAE2D3"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fontSize="3.4"
            >
              {sideLetter}
            </text>

            {/* DATE + línea fina */}
            <text
              x={5.4}
              y={1.65}
              fill="#5A4E40"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="700"
              fontSize="1.35"
              letterSpacing="0.16"
            >
              DATE
            </text>
            <line x1={5.4} y1={2.15} x2={colW} y2={2.15} stroke="#786B5C" strokeWidth="0.22" />

            {/* NOISE REDUCTION + casilla ☐ */}
            <text
              x={5.4}
              y={4.1}
              fill="#5A4E40"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="700"
              fontSize="1.35"
              letterSpacing="0.12"
            >
              NOISE REDUCTION
            </text>
            <rect
              x={21.8}
              y={2.75}
              width={1.55}
              height={1.55}
              fill="none"
              stroke="#5A4E40"
              strokeWidth="0.24"
            />
            {project.dolbySystem !== 'NONE' && (
              <path
                d="M 22.0 3.5 L 22.5 4.0 L 23.2 2.9"
                fill="none"
                stroke="#253551"
                strokeWidth="0.3"
              />
            )}

            {/* Barra gruesa marrón oscuro bajo cabecera */}
            <rect x={0} y={5.2} width={colW} height={0.68} fill="#4A3F34" />

            {/* 11 renglones pautados con el tracklist manuscrito continuo con "/" */}
            {Array.from({ length: 11 }).map((_, idx) => {
              const lineY = 9.3 + idx * 4.05;
              const textLine = wrappedLines[idx];
              return (
                <g key={`am-col-${sideLetter}-${idx}`}>
                  <line
                    x1={0}
                    y1={lineY}
                    x2={colW}
                    y2={lineY}
                    stroke="#7D7061"
                    strokeWidth="0.24"
                  />
                  {textLine && (
                    <text
                      x={0.2}
                      y={lineY - 0.8}
                      fill="#233554"
                      fontFamily="'Architects Daughter', 'Caveat', cursive"
                      fontWeight="700"
                      fontSize="1.82"
                      letterSpacing="0.02"
                    >
                      {textLine}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );

        // Dividir el artista/título de la banda central para estilo GUARDIANS OF THE GALAXY
        const artistUpper = (project.albumArtist || 'GUARDIANS OF THE GALAXY').toUpperCase();
        const isGuardians = artistUpper.includes('GUARDIANS');

        return (
          <g>
            {/* 1. ZONA SUPERIOR (0 a 28.5 mm): Ventana con el cassette Awesome Mix Vol. 1 */}
            <rect x={frontX} y={0} width={frontW} height={28.5} fill="#1E1E22" />

            {/* Etiqueta achaflanada dentro de la ventana superior */}
            <g transform={`translate(${frontX + 4.5}, 2.2)`}>
              <polygon
                points="3.8,0 52.2,0 56,3.8 56,24.2 0,24.2 0,3.8"
                fill="#EFECE4"
              />
              {/* Título manuscrito en rotulador azul sobre la ventana del cassette */}
              <text
                x={28}
                y={8.8}
                textAnchor="middle"
                fill="#24477F"
                fontFamily="'Permanent Marker', 'Architects Daughter', 'Caveat', cursive"
                fontWeight="700"
                fontSize="3.25"
                letterSpacing="0.28"
              >
                {truncate(project.albumTitle.toUpperCase(), 26)}
              </text>

              {/* 7 Franjas rojas progresivas a ambos lados de la ventana central */}
              <rect x={0} y={10.2} width={56} height={0.32} fill="#D43B30" />
              <rect x={0} y={12.3} width={56} height={0.55} fill="#D43B30" />
              <rect x={0} y={14.5} width={56} height={0.85} fill="#D43B30" />
              <rect x={0} y={16.9} width={56} height={1.25} fill="#D43B30" />
              <rect x={0} y={19.4} width={56} height={1.75} fill="#D43B30" />
              <rect x={0} y={22.0} width={56} height={2.2} fill="#D43B30" />

              {/* Ventana central negra con las dos bobinas del cassette */}
              <rect
                x={11.5}
                y={10.0}
                width={33}
                height={14.2}
                fill="#18181B"
                stroke="#27272A"
                strokeWidth="0.35"
              />
              {[17.2, 38.8].map((rcx, rIdx) => (
                <g key={rIdx}>
                  <circle
                    cx={rcx}
                    cy={17.1}
                    r={4.2}
                    fill="#111113"
                    stroke="#71717A"
                    strokeWidth="0.55"
                  />
                  <circle
                    cx={rcx}
                    cy={17.1}
                    r={2.8}
                    fill="none"
                    stroke="#D4D4D8"
                    strokeWidth="0.45"
                  />
                  {[0, 120, 240].map((ang) => (
                    <line
                      key={ang}
                      x1={rcx}
                      y1={17.1 - 0.6}
                      x2={rcx}
                      y2={17.1 - 3.6}
                      stroke="#E4E4E7"
                      strokeWidth="0.85"
                      transform={`rotate(${ang} ${rcx} 17.1)`}
                    />
                  ))}
                </g>
              ))}
            </g>

            {/* 2. ZONA CENTRAL (28.5 a 47.2 mm): Banda negra con logo estilo Guardians + Código de barras */}
            <rect x={frontX} y={28.5} width={frontW} height={18.7} fill="#22201E" />

            {/* Bloque izquierdo: Insignia roja + Tipografía apilada */}
            <g transform={`translate(${frontX + 3.2}, 29.8)`}>
              <rect x={11.5} y={0} width={5.4} height={1.7} fill="#D43B30" />
              <text
                x={14.2}
                y={1.3}
                textAnchor="middle"
                fill="#FFFFFF"
                fontFamily="'Oswald', Impact, sans-serif"
                fontWeight="900"
                fontSize="1.15"
                letterSpacing="0.06"
              >
                {truncate(project.recordLabel.split('/')[0].trim().toUpperCase() || 'MARVEL', 8)}
              </text>

              {isGuardians ? (
                <>
                  <text
                    x={14.2}
                    y={5.1}
                    textAnchor="middle"
                    fill="#F4F4F5"
                    fontFamily="'Oswald', 'Barlow Condensed', Impact, sans-serif"
                    fontWeight="900"
                    fontSize="3.9"
                    letterSpacing="0.08"
                  >
                    GUARDIANS
                  </text>
                  <text
                    x={4.0}
                    y={6.8}
                    fill="#F4F4F5"
                    fontFamily="'Oswald', Impact, sans-serif"
                    fontWeight="800"
                    fontSize="1.4"
                  >
                    OF
                  </text>
                  <text
                    x={3.6}
                    y={8.4}
                    fill="#F4F4F5"
                    fontFamily="'Oswald', Impact, sans-serif"
                    fontWeight="800"
                    fontSize="1.4"
                  >
                    THE
                  </text>
                  <text
                    x={7.0}
                    y={8.5}
                    fill="#F4F4F5"
                    fontFamily="'Oswald', 'Barlow Condensed', Impact, sans-serif"
                    fontWeight="900"
                    fontSize="3.8"
                    letterSpacing="0.08"
                  >
                    GALAXY
                  </text>
                </>
              ) : (
                <>
                  <text
                    x={14.2}
                    y={5.3}
                    textAnchor="middle"
                    fill="#F4F4F5"
                    fontFamily="'Oswald', 'Barlow Condensed', Impact, sans-serif"
                    fontWeight="900"
                    fontSize="3.2"
                    letterSpacing="0.08"
                  >
                    {truncate(artistUpper, 16)}
                  </text>
                  <text
                    x={14.2}
                    y={8.5}
                    textAnchor="middle"
                    fill="#F4F4F5"
                    fontFamily="'Oswald', 'Barlow Condensed', Impact, sans-serif"
                    fontWeight="800"
                    fontSize="2.5"
                    letterSpacing="0.08"
                  >
                    {truncate(project.albumTitle.toUpperCase(), 18)}
                  </text>
                </>
              )}

              <text
                x={14.2}
                y={10.2}
                textAnchor="middle"
                fill="#E4E4E7"
                fontFamily="'Barlow Condensed', Inter, sans-serif"
                fontWeight="800"
                fontSize="1.18"
                letterSpacing="0.08"
              >
                ORIGINAL MOTION PICTURE SOUNDTRACK
              </text>
            </g>

            {/* Bloque derecho: Código de barras UPC blanco */}
            <VectorBarcodeSvg
              code={project.barcodeNumber || '050087316792'}
              x={frontX + 34.2}
              y={30.8}
              width={27.5}
              height={9.2}
              color="#18181B"
              bgColor="#FFFFFF"
            />

            {/* Filete rojo fino horizontal y micro-texto de copyright debajo */}
            <line
              x1={frontX + 2}
              y1={41.6}
              x2={frontX + frontW - 2}
              y2={41.6}
              stroke="#D43B30"
              strokeWidth="0.4"
            />
            <text
              x={frontX + frontW / 2}
              y={43.2}
              textAnchor="middle"
              fill="#D6D3D1"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="600"
              fontSize="0.82"
              letterSpacing="0.04"
            >
              © {project.releaseYear} MARVEL THIS COMPILATION ℗ {project.releaseYear} MARVEL MUSIC, INC. MANUFACTURED AND MARKETED BY
            </text>
            <text
              x={frontX + frontW / 2}
              y={44.5}
              textAnchor="middle"
              fill="#D6D3D1"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="600"
              fontSize="0.82"
              letterSpacing="0.04"
            >
              HOLLYWOOD RECORDS, 500 S. BUENA VISTA ST., BURBANK, CA 91521. ALL RIGHTS RESERVED. UNAUTHORIZED COPYING,
            </text>
            <text
              x={frontX + frontW / 2}
              y={45.8}
              textAnchor="middle"
              fill="#D6D3D1"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="600"
              fontSize="0.82"
              letterSpacing="0.04"
            >
              REPRODUCTION, HIRING, LENDING, PUBLIC PERFORMANCE AND BROADCASTING PROHIBITED. {project.catalogNumber}
            </text>

            {/* 3. ZONA INFERIOR (47.2 a 102 mm): Tarjeta beige pautada a 2 columnas [A] y [B] */}
            <rect x={frontX} y={47.2} width={frontW} height={54.8} fill="#E2D8C5" />
            <line
              x1={frontX}
              y1={47.4}
              x2={frontX + frontW}
              y2={47.4}
              stroke="#9CA3AF"
              strokeWidth="0.45"
            />

            {renderIndexColumn('A', colAX, colALines)}
            {renderIndexColumn('B', colBX, colBLines)}
          </g>
        );
      }

      case 'cbs-epic': {
        const artSize = 52;
        const artX = frontX + (frontW - artSize) / 2;
        const artY = 6.5;

        return (
          <g>
            <rect x={frontX} y={0} width={frontW} height={cardH} fill={paper.bgHex} />

            <rect
              x={artX - 1.3}
              y={artY - 1.3}
              width={artSize + 2.6}
              height={artSize + 2.6}
              fill="none"
              stroke={project.accentColor}
              strokeWidth="0.45"
            />
            <rect
              x={artX - 0.5}
              y={artY - 0.5}
              width={artSize + 1.0}
              height={artSize + 1.0}
              fill="none"
              stroke={paper.textHex}
              strokeWidth="0.18"
            />

            {renderCoverArt(artX, artY, artSize, artSize, `${idPrefix}-cbs-cover`)}

            <text
              x={artX}
              y={64.8}
              fill={project.accentColor}
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fontSize="2.2"
              letterSpacing="0.15"
            >
              {project.catalogNumber}
            </text>

            {project.dolbySystem !== 'NONE' && (
              <DolbyVectorLogo
                x={artX + artSize - 11.2}
                y={61.8}
                width={11.2}
                height={4.2}
                color={paper.textHex}
                showText={true}
              />
            )}

            <text
              x={frontX + frontW / 2}
              y={76.5}
              textAnchor="middle"
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="900"
              fontSize="3.5"
              letterSpacing="0.28"
            >
              {truncate(project.albumTitle.toUpperCase(), 26)}
            </text>
            <text
              x={frontX + frontW / 2}
              y={81.2}
              textAnchor="middle"
              fill={paper.subTextHex}
              fontFamily={fontFamily}
              fontWeight="600"
              fontSize="2.35"
              letterSpacing="0.22"
            >
              {truncate(project.albumArtist.toUpperCase(), 32)}
            </text>

            <line
              x1={artX + 10}
              y1={91.5}
              x2={artX + artSize - 10}
              y2={91.5}
              stroke={project.accentColor}
              strokeWidth="0.25"
              opacity="0.6"
            />
            <text
              x={frontX + frontW / 2}
              y={96.2}
              textAnchor="middle"
              fill={paper.textHex}
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontStyle="italic"
              fontWeight="700"
              fontSize="2.3"
              letterSpacing="0.55"
            >
              {project.stereoText.toUpperCase()}
            </text>
          </g>
        );
      }

      case 'emi-harvest': {
        const borderThickness = 4.5;
        const artSize = 48;
        const artX = frontX + (frontW - artSize) / 2;
        const artY = 12;

        return (
          <g>
            <rect x={frontX} y={0} width={frontW} height={cardH} fill={project.secondaryColor} />
            <rect
              x={frontX + borderThickness}
              y={borderThickness}
              width={frontW - borderThickness * 2}
              height={cardH - borderThickness * 2}
              fill={paper.bgHex}
            />

            {renderCoverArt(artX, artY, artSize, artSize, `${idPrefix}-emi-cover`)}
            <rect
              x={artX}
              y={artY}
              width={artSize}
              height={artSize}
              fill="none"
              stroke={paper.textHex}
              strokeWidth="0.25"
            />

            <text
              x={frontX + frontW / 2}
              y={68.5}
              textAnchor="middle"
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="700"
              fontSize="3.4"
              letterSpacing="0.2"
            >
              {truncate(project.albumArtist.toUpperCase(), 24)}
            </text>
            <text
              x={frontX + frontW / 2}
              y={73.5}
              textAnchor="middle"
              fill={project.accentColor}
              fontFamily={fontFamily}
              fontStyle="italic"
              fontWeight="500"
              fontSize="3.1"
            >
              {truncate(project.albumTitle, 28)}
            </text>

            <EmiLogoVector x={artX} y={87.5} width={9.5} height={4.2} color={paper.textHex} />
            <text
              x={frontX + frontW / 2}
              y={90.3}
              textAnchor="middle"
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="600"
              fontSize="1.65"
              letterSpacing="0.2"
            >
              {project.tapeBias.includes('CrO2') ? 'CHROME' : 'NORMAL'} • {project.catalogNumber}
            </text>
            {project.dolbySystem !== 'NONE' && (
              <DolbyVectorLogo
                x={artX + artSize - 5.5}
                y={87.8}
                width={5.5}
                height={3.6}
                color={paper.textHex}
                showText={false}
              />
            )}
          </g>
        );
      }

      case 'warner-sire': {
        const artSize = 55;
        const artX = frontX + (frontW - artSize) / 2;
        const artY = 21;

        return (
          <g>
            <rect x={frontX} y={0} width={frontW} height={cardH} fill={paper.bgHex} />
            <rect x={frontX} y={0} width={frontW} height={15} fill={project.accentColor} />
            <text
              x={artX}
              y={6.8}
              fill="#FFFFFF"
              fontFamily={fontFamily}
              fontWeight="800"
              fontSize="4.1"
              letterSpacing="0.22"
            >
              {truncate(project.albumArtist.toUpperCase(), 24)}
            </text>
            <text
              x={artX}
              y={11.8}
              fill="#FFFFFF"
              fontFamily={fontFamily}
              fontWeight="600"
              fontSize="2.8"
              letterSpacing="0.18"
              opacity="0.9"
            >
              {truncate(project.albumTitle.toUpperCase(), 28)}
            </text>

            {renderCoverArt(artX, artY, artSize, artSize, `${idPrefix}-warner-cover`)}

            <line
              x1={artX}
              y1={83}
              x2={artX + artSize}
              y2={83}
              stroke={paper.borderHex}
              strokeWidth="0.25"
              opacity="0.35"
            />
            <WarnerSireLogoVector
              x={artX}
              y={86.5}
              width={9.5}
              height={4.5}
              color={project.accentColor}
            />
            <text
              x={frontX + frontW / 2 + 1}
              y={89.5}
              textAnchor="middle"
              fill={paper.subTextHex}
              fontFamily={fontFamily}
              fontWeight="700"
              fontSize="1.9"
              letterSpacing="0.2"
            >
              {project.stereoText.toUpperCase()}
            </text>
            {project.dolbySystem !== 'NONE' && (
              <DolbyVectorLogo
                x={artX + artSize - 5.8}
                y={87.2}
                width={5.8}
                height={3.8}
                color={paper.textHex}
                showText={false}
              />
            )}
          </g>
        );
      }

      case 'deutsche-grammophon': {
        const marginX = 5.5;
        const boxW = frontW - marginX * 2;
        const cartoucheX = frontX + marginX;
        const cartoucheY = 5.5;
        const cartoucheH = 28;
        const artY = 36.5;
        const artH = 54;

        return (
          <g>
            <rect x={frontX} y={0} width={frontW} height={cardH} fill={paper.bgHex} />

            <rect
              x={cartoucheX}
              y={cartoucheY}
              width={boxW}
              height={cartoucheH}
              fill={project.accentColor}
              stroke="#18181B"
              strokeWidth="0.45"
            />
            <rect
              x={cartoucheX + 1.2}
              y={cartoucheY + 1.2}
              width={boxW - 2.4}
              height={cartoucheH - 2.4}
              fill="none"
              stroke="#18181B"
              strokeWidth="0.25"
            />

            <DeutscheGrammophonCrest
              x={frontX + frontW / 2 - 6.5}
              y={cartoucheY + 2.2}
              width={13}
              height={3.8}
              color="#18181B"
            />
            <text
              x={frontX + frontW / 2}
              y={cartoucheY + 8.6}
              textAnchor="middle"
              fill="#18181B"
              fontFamily="Cinzel, Georgia, serif"
              fontWeight="800"
              fontSize="2.0"
              letterSpacing="0.35"
            >
              {project.recordLabel.toUpperCase()}
            </text>
            <line
              x1={cartoucheX + 8}
              y1={cartoucheY + 10.2}
              x2={cartoucheX + boxW - 8}
              y2={cartoucheY + 10.2}
              stroke="#18181B"
              strokeWidth="0.2"
            />
            <text
              x={frontX + frontW / 2}
              y={cartoucheY + 15.2}
              textAnchor="middle"
              fill="#18181B"
              fontFamily={fontFamily}
              fontWeight="700"
              fontSize="2.2"
              letterSpacing="0.14"
            >
              {truncate(project.albumArtist.toUpperCase(), 30)}
            </text>
            <text
              x={frontX + frontW / 2}
              y={cartoucheY + 20.5}
              textAnchor="middle"
              fill="#18181B"
              fontFamily={fontFamily}
              fontWeight="800"
              fontSize="2.85"
              letterSpacing="0.12"
            >
              {truncate(project.albumTitle.toUpperCase(), 25)}
            </text>
            <text
              x={frontX + frontW / 2}
              y={cartoucheY + 24.8}
              textAnchor="middle"
              fill="#27272A"
              fontFamily={fontFamily}
              fontWeight="600"
              fontSize="1.85"
              letterSpacing="0.18"
            >
              {truncate(project.subtitleOrSeries || project.catalogNumber, 30)}
            </text>

            {renderCoverArt(cartoucheX, artY, boxW, artH, `${idPrefix}-dg-cover`)}
            <rect
              x={cartoucheX}
              y={artY}
              width={boxW}
              height={artH}
              fill="none"
              stroke="#18181B"
              strokeWidth="0.25"
            />

            <text
              x={frontX + frontW / 2}
              y={95.5}
              textAnchor="middle"
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="700"
              fontSize="1.75"
              letterSpacing="0.3"
            >
              {project.stereoText.toUpperCase()}
            </text>
          </g>
        );
      }

      case 'ecm-records': {
        // Plantilla F: ECM Records (Múnich, ca. 1975–1989)
        // Minimalismo puro: amplio margen superior blanco/crema, tipografía fina alineada a la izquierda,
        // arte cuadrado limpio y sello ECM discreto al pie.
        const padX = frontX + 6;
        const innerW = frontW - 12; // 53 mm

        return (
          <g>
            <rect x={frontX} y={0} width={frontW} height={cardH} fill={paper.bgHex} />

            {/* Understated Left-Aligned Typography with Generous Air */}
            <text
              x={padX}
              y={11.5}
              fill={paper.subTextHex}
              fontFamily={fontFamily}
              fontWeight="500"
              fontSize="2.4"
              letterSpacing="0.25"
            >
              {truncate(project.albumArtist.toUpperCase(), 28)}
            </text>
            <text
              x={padX}
              y={17.2}
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="700"
              fontSize="3.6"
              letterSpacing="0.18"
            >
              {truncate(project.albumTitle, 24)}
            </text>

            {/* Clean Unframed Square Artwork */}
            {renderCoverArt(padX, 24, innerW, innerW, `${idPrefix}-ecm-cover`)}

            {/* Minimalist ECM Footer */}
            <text
              x={padX}
              y={92.5}
              fill={project.accentColor}
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="800"
              fontSize="2.2"
              letterSpacing="0.45"
            >
              ECM
            </text>
            <text
              x={padX + innerW}
              y={92.5}
              textAnchor="end"
              fill={paper.subTextHex}
              fontFamily="JetBrains Mono, monospace"
              fontSize="1.75"
              letterSpacing="0.15"
            >
              {project.catalogNumber}
            </text>
          </g>
        );
      }

      case 'factory-benelux': {
        // Plantilla G: Factory Records / FAC (Mánchester, ca. 1980–1988)
        // Retícula suiza industrial de Peter Saville: filetes finos horizontales y código FAC.
        const padX = frontX + 5.5;
        const innerW = frontW - 11; // 54 mm

        return (
          <g>
            <rect x={frontX} y={0} width={frontW} height={cardH} fill={paper.bgHex} />

            {/* Top Swiss Grid Hairline */}
            <line x1={padX} y1={7} x2={padX + innerW} y2={7} stroke={paper.textHex} strokeWidth="0.35" />
            <text
              x={padX}
              y={11.2}
              fill={project.accentColor}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fontSize="2.0"
              letterSpacing="0.2"
            >
              {project.catalogNumber.toUpperCase()}
            </text>
            <text
              x={padX + innerW}
              y={11.2}
              textAnchor="end"
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="600"
              fontSize="1.8"
              letterSpacing="0.15"
            >
              {project.releaseYear}
            </text>
            <line x1={padX} y1={13.5} x2={padX + innerW} y2={13.5} stroke={paper.textHex} strokeWidth="0.18" />

            {/* Square Industrial Artwork */}
            {renderCoverArt(padX, 18.5, innerW, 50, `${idPrefix}-fac-cover`)}

            {/* Bottom Swiss Grid Block */}
            <line x1={padX} y1={73.5} x2={padX + innerW} y2={73.5} stroke={paper.textHex} strokeWidth="0.35" />
            <text
              x={padX}
              y={79.5}
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="800"
              fontSize="3.4"
              letterSpacing="0.16"
            >
              {truncate(project.albumTitle.toUpperCase(), 25)}
            </text>
            <text
              x={padX}
              y={84.2}
              fill={paper.subTextHex}
              fontFamily={fontFamily}
              fontWeight="600"
              fontSize="2.3"
              letterSpacing="0.15"
            >
              {truncate(project.albumArtist.toUpperCase(), 30)}
            </text>

            <line x1={padX} y1={91} x2={padX + innerW} y2={91} stroke={paper.textHex} strokeWidth="0.18" />
            <text
              x={padX}
              y={95}
              fill={paper.subTextHex}
              fontFamily="JetBrains Mono, monospace"
              fontSize="1.65"
              letterSpacing="0.2"
            >
              {project.stereoText.toUpperCase()}
            </text>
          </g>
        );
      }

      case 'blue-note-rvg': {
        // Plantilla H: Blue Note / Impulse! (Jazz Clásico 70s)
        // Franja lateral/superior asimétrica de color sólido + tipografía condensada + portada + resumen de pistas.
        const padX = frontX + 5;
        const innerW = frontW - 10; // 55 mm

        return (
          <g>
            <rect x={frontX} y={0} width={frontW} height={cardH} fill={paper.bgHex} />

            {/* Left vertical accent bar on header */}
            <rect x={padX} y={6} width={3.2} height={14.5} fill={project.accentColor} />
            <text
              x={padX + 5.5}
              y={11.5}
              fill={project.accentColor}
              fontFamily={fontFamily}
              fontWeight="800"
              fontSize="3.8"
              letterSpacing="0.18"
            >
              {truncate(project.albumTitle.toUpperCase(), 24)}
            </text>
            <text
              x={padX + 5.5}
              y={16.5}
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="700"
              fontSize="2.6"
              letterSpacing="0.15"
            >
              {truncate(project.albumArtist.toUpperCase(), 28)}
            </text>
            <text
              x={padX + 5.5}
              y={20}
              fill={paper.subTextHex}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
              fontSize="1.6"
            >
              {project.recordLabel.toUpperCase()} • {project.catalogNumber}
            </text>

            {renderCoverArt(padX, 24, innerW, 52, `${idPrefix}-bluenote-cover`)}

            {/* Practical Track Line Summary Under Art */}
            <text
              x={padX}
              y={81.5}
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="700"
              fontSize="1.85"
            >
              A: {truncate(sideATracks.map((t) => t.title).join(' • '), 38)}
            </text>
            <text
              x={padX}
              y={85.2}
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="700"
              fontSize="1.85"
            >
              B: {truncate(sideBTracks.map((t) => t.title).join(' • '), 38)}
            </text>

            <line x1={padX} y1={90} x2={padX + innerW} y2={90} stroke={project.accentColor} strokeWidth="0.4" />
            <text
              x={padX}
              y={94.5}
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="700"
              fontSize="1.65"
              letterSpacing="0.2"
            >
              {project.stereoText.toUpperCase()}
            </text>
          </g>
        );
      }

      case 'basf-chromdioxid': {
        // Plantilla I: BASF Chromdioxid (Índice Práctico en Portada)
        // Miniatura de portada arriba a la izquierda + título y 10 líneas de tracklist claras directamente en el frontal.
        const padX = frontX + 4.5;
        const innerW = frontW - 9; // 56 mm

        return (
          <g>
            <rect x={frontX} y={0} width={frontW} height={cardH} fill={paper.bgHex} />

            {/* Clean BASF Header Strip */}
            <rect x={frontX} y={0} width={frontW} height={9.5} fill={project.accentColor} />
            <text
              x={padX}
              y={6.4}
              fill="#FFFFFF"
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="900"
              fontSize="3.4"
              letterSpacing="0.22"
            >
              {truncate(project.recordLabel.toUpperCase(), 18)}
            </text>
            <text
              x={padX + innerW}
              y={6.4}
              textAnchor="end"
              fill="#FFFFFF"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fontSize="2.5"
            >
              {project.tapeCapacity}
            </text>

            {/* Compact Thumbnail + Title Block */}
            {renderCoverArt(padX, 13, 21, 21, `${idPrefix}-basf-cover`)}
            <rect x={padX} y={13} width={21} height={21} fill="none" stroke={paper.borderHex} strokeWidth="0.25" />

            <g transform={`translate(${padX + 24}, 16.5)`}>
              <text
                x={0}
                y={0}
                fill={paper.textHex}
                fontFamily={fontFamily}
                fontWeight="700"
                fontSize="2.6"
              >
                {truncate(project.albumTitle, 18)}
              </text>
              <text
                x={0}
                y={4.2}
                fill={paper.subTextHex}
                fontFamily={fontFamily}
                fontSize="2.0"
              >
                {truncate(project.albumArtist, 22)}
              </text>
              <text
                x={0}
                y={9.5}
                fill={project.accentColor}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
                fontSize="1.65"
              >
                A: {formatDuration(sideASec)} | B: {formatDuration(sideBSec)}
              </text>
              <text
                x={0}
                y={13.2}
                fill={paper.subTextHex}
                fontFamily="JetBrains Mono, monospace"
                fontSize="1.55"
              >
                NR: {project.dolbySystem} • {project.catalogNumber}
              </text>
            </g>

            {/* Practical 10-Track Direct Index on Front Cover */}
            <line x1={padX} y1={37.5} x2={padX + innerW} y2={37.5} stroke={project.accentColor} strokeWidth="0.4" />

            {project.tracks.slice(0, 11).map((t, idx) => {
              const y = 41.8 + idx * 4.5;
              return (
                <g key={t.id}>
                  <line
                    x1={padX}
                    y1={y + 1.1}
                    x2={padX + innerW}
                    y2={y + 1.1}
                    stroke={paper.borderHex}
                    strokeWidth="0.12"
                    opacity="0.22"
                  />
                  <text
                    x={padX}
                    y={y}
                    fill={project.accentColor}
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                    fontSize="1.8"
                  >
                    {t.side}{String(idx + 1).padStart(2, '0')}
                  </text>
                  <text
                    x={padX + 6.5}
                    y={y}
                    fill={paper.textHex}
                    fontFamily={fontFamily}
                    fontSize="1.95"
                  >
                    {truncate(t.title, 24)}
                  </text>
                  <text
                    x={padX + innerW}
                    y={y}
                    textAnchor="end"
                    fill={paper.subTextHex}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="1.75"
                  >
                    {formatDuration(t.durationSec)}
                  </text>
                </g>
              );
            })}

            <text
              x={frontX + frontW / 2}
              y={96.5}
              textAnchor="middle"
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="700"
              fontSize="1.6"
              letterSpacing="0.2"
            >
              {project.stereoText.toUpperCase()}
            </text>
          </g>
        );
      }

      case 'sub-pop-indie': {
        // Plantilla J: Rough Trade / SST / Sub Pop (Indie Práctico)
        // Cabecera en bloque alto contraste, arte central y doble columna A/B muy legible en portada.
        const padX = frontX + 5;
        const innerW = frontW - 10; // 55 mm

        return (
          <g>
            <rect x={frontX} y={0} width={frontW} height={cardH} fill={paper.bgHex} />

            {/* Stark Indie Top Banner */}
            <rect x={padX} y={5} width={innerW} height={11} fill={project.accentColor} />
            <text
              x={frontX + frontW / 2}
              y={9.8}
              textAnchor="middle"
              fill="#FAF7F0"
              fontFamily={fontFamily}
              fontWeight="900"
              fontSize="3.1"
              letterSpacing="0.2"
            >
              {truncate(project.albumArtist.toUpperCase(), 24)}
            </text>
            <text
              x={frontX + frontW / 2}
              y={13.8}
              textAnchor="middle"
              fill="#FAF7F0"
              fontFamily={fontFamily}
              fontWeight="600"
              fontSize="2.1"
              letterSpacing="0.18"
              opacity="0.85"
            >
              {truncate(project.albumTitle.toUpperCase(), 28)}
            </text>

            {/* Framed Artwork */}
            {renderCoverArt(padX, 18.5, innerW, 44, `${idPrefix}-indie-cover`)}
            <rect
              x={padX}
              y={18.5}
              width={innerW}
              height={44}
              fill="none"
              stroke={project.accentColor}
              strokeWidth="0.35"
            />

            {/* Practical Two-Column Tracklist on Front */}
            <g transform={`translate(${padX}, 66.5)`}>
              <text x={0} y={0} fill={project.accentColor} fontFamily={fontFamily} fontWeight="800" fontSize="1.85">
                CARA A ({formatDuration(sideASec)})
              </text>
              {sideATracks.slice(0, 5).map((t, idx) => (
                <text
                  key={t.id}
                  x={0}
                  y={3.2 + idx * 3.1}
                  fill={paper.textHex}
                  fontFamily={fontFamily}
                  fontSize="1.75"
                >
                  {idx + 1}. {truncate(t.title, 18)}
                </text>
              ))}

              <text x={28.5} y={0} fill={project.accentColor} fontFamily={fontFamily} fontWeight="800" fontSize="1.85">
                CARA B ({formatDuration(sideBSec)})
              </text>
              {sideBTracks.slice(0, 5).map((t, idx) => (
                <text
                  key={t.id}
                  x={28.5}
                  y={3.2 + idx * 3.1}
                  fill={paper.textHex}
                  fontFamily={fontFamily}
                  fontSize="1.75"
                >
                  {idx + 1}. {truncate(t.title, 18)}
                </text>
              ))}
            </g>

            <line x1={padX} y1={91.5} x2={padX + innerW} y2={91.5} stroke={project.accentColor} strokeWidth="0.3" />
            <text
              x={padX}
              y={95.5}
              fill={paper.subTextHex}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fontSize="1.65"
            >
              {project.recordLabel.toUpperCase()} • {project.catalogNumber}
            </text>
          </g>
        );
      }

      case 'tdk-d-index': {
        // Plantilla TDK D (Cinta Virgen — Índice Horizontal Clásico)
        // En el sistema local rotado 90° (translate(frontX + frontW, 0) rotate(90)):
        // lx va de 0 a 102 mm (de izquierda a derecha) y ly va de 0 a 65 mm (de arriba a abajo).
        const isHandwritten = project.typography === 'handwritten-pen';
        const headerH = 8.2;
        const rowCount = 12;
        const rowH = (frontW - headerH) / rowCount; // ~4.733 mm por renglón

        const buildColumnLines = (tracks: Track[]) => {
          const lines: { text: string; indent?: boolean; rightText?: string }[] = [];
          if (tracks.length <= 6) {
            tracks.forEach((t, idx) => {
              const hasDistinctArtist =
                t.artist &&
                t.artist.trim() !== '' &&
                t.artist.toLowerCase() !== project.albumArtist.toLowerCase();
              if (hasDistinctArtist) {
                lines.push({
                  text: `${idx + 1}. ${truncate(t.artist, 22)} -`,
                  indent: false,
                });
                lines.push({
                  text: truncate(t.title, 24),
                  indent: true,
                });
              } else {
                lines.push({
                  text: `${idx + 1}. ${truncate(t.title, 24)}`,
                  indent: false,
                  rightText: formatDuration(t.durationSec),
                });
                lines.push({ text: '', indent: true });
              }
            });
          } else {
            tracks.slice(0, 12).forEach((t, idx) => {
              const hasDistinctArtist =
                t.artist &&
                t.artist.trim() !== '' &&
                t.artist.toLowerCase() !== project.albumArtist.toLowerCase();
              const label = hasDistinctArtist
                ? `${idx + 1}. ${t.artist} - ${t.title}`
                : `${idx + 1}. ${t.title}`;
              lines.push({
                text: truncate(label, 27),
                indent: false,
              });
            });
          }
          return lines.slice(0, 12);
        };

        const colALines = buildColumnLines(sideATracks);
        const colBLines = buildColumnLines(sideBTracks);

        const renderHeaderHalf = (sideLabel: 'A' | 'B', offsetX: number, totalSec: number) => (
          <g transform={`translate(${offsetX}, 0)`}>
            {/* Caja negra [A] o [B] */}
            <rect x={3.8} y={1.5} width={5.2} height={5.2} fill={project.accentColor} />
            <text
              x={6.4}
              y={5.3}
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="900"
              fontSize="3.8"
            >
              {sideLabel}
            </text>

            {/* DATE y TIME con líneas */}
            <text
              x={10.4}
              y={3.6}
              fill="#18181B"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="700"
              fontSize="1.55"
              letterSpacing="0.06"
            >
              DATE
            </text>
            <line x1={16.2} y1={3.7} x2={34.8} y2={3.7} stroke="#18181B" strokeWidth="0.22" />
            <text
              x={25.5}
              y={3.3}
              textAnchor="middle"
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="700"
              fontSize={isHandwritten ? '2.45' : '1.75'}
            >
              {project.releaseYear}
            </text>

            <text
              x={10.4}
              y={6.6}
              fill="#18181B"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="700"
              fontSize="1.55"
              letterSpacing="0.06"
            >
              TIME
            </text>
            <line x1={16.2} y1={6.7} x2={34.8} y2={6.7} stroke="#18181B" strokeWidth="0.22" />
            <text
              x={25.5}
              y={6.3}
              textAnchor="middle"
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="700"
              fontSize={isHandwritten ? '2.45' : '1.75'}
            >
              {formatDuration(totalSec)}
            </text>

            {/* Divisor vertical de NOISE REDUCTION */}
            <line x1={36.2} y1={0} x2={36.2} y2={headerH} stroke="#18181B" strokeWidth="0.3" />

            <text
              x={37.4}
              y={3.6}
              fill="#18181B"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="700"
              fontSize="1.4"
            >
              NOISE
            </text>
            <text
              x={37.4}
              y={6.1}
              fill="#18181B"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="700"
              fontSize="1.35"
            >
              REDUCTION
            </text>

            {/* Casilla blanca de verificación N.R. */}
            <rect
              x={46.0}
              y={2.3}
              width={3.4}
              height={3.4}
              fill="#FFFFFF"
              stroke="#18181B"
              strokeWidth="0.25"
            />
            {project.dolbySystem !== 'NONE' && (
              <text
                x={47.7}
                y={5.0}
                textAnchor="middle"
                fill={paper.textHex}
                fontFamily={fontFamily}
                fontWeight="800"
                fontSize="2.8"
              >
                ✓
              </text>
            )}
          </g>
        );

        return (
          <g transform={`translate(${frontX + frontW}, 0) rotate(90)`}>
            {/* Fondo crema/blanco cálido de tarjeta TDK */}
            <rect x={0} y={0} width={cardH} height={frontW} fill={paper.bgHex} />

            {/* Franja superior gris técnica TDK (DATE / TIME / NOISE REDUCTION) */}
            <rect x={0} y={0} width={cardH} height={headerH} fill="#D5D4CE" />
            {renderHeaderHalf('A', 0, sideASec)}
            <line x1={51} y1={0} x2={51} y2={headerH} stroke="#18181B" strokeWidth="0.35" />
            {renderHeaderHalf('B', 51, sideBSec)}
            <line x1={0} y1={headerH} x2={cardH} y2={headerH} stroke="#18181B" strokeWidth="0.45" />

            {/* 12 Renglones pautados con línea punteada y puntos divisorios centrales */}
            {Array.from({ length: rowCount }).map((_, rIdx) => {
              const rowTop = headerH + rIdx * rowH;
              const rowBottom = rowTop + rowH;
              const textBaseline = rowBottom - 1.15;
              const dotY = rowTop + rowH * 0.54;
              const leftEntry = colALines[rIdx];
              const rightEntry = colBLines[rIdx];

              return (
                <g key={`tdk-row-${rIdx}`}>
                  {/* Línea horizontal punteada (excepto en el borde inferior del panel) */}
                  {rIdx < rowCount - 1 && (
                    <line
                      x1={3.5}
                      y1={rowBottom}
                      x2={cardH - 3.5}
                      y2={rowBottom}
                      stroke="#52525B"
                      strokeWidth="0.22"
                      strokeDasharray="0.55 0.75"
                    />
                  )}

                  {/* Punto central separador de columnas A / B (fiel al encarte TDK D) */}
                  <circle cx={51} cy={dotY} r={0.42} fill="#18181B" />

                  {/* Texto Columna Izquierda (Cara A) */}
                  {leftEntry && leftEntry.text && (
                    <text
                      x={leftEntry.indent ? 8.2 : 4.2}
                      y={textBaseline}
                      fill={paper.textHex}
                      fontFamily={fontFamily}
                      fontWeight={isHandwritten ? '700' : '600'}
                      fontSize={isHandwritten ? '3.35' : '2.25'}
                    >
                      {leftEntry.text}
                    </text>
                  )}
                  {leftEntry && leftEntry.rightText && (
                    <text
                      x={49.2}
                      y={textBaseline}
                      textAnchor="end"
                      fill={paper.subTextHex}
                      fontFamily={fontFamily}
                      fontSize={isHandwritten ? '2.6' : '1.8'}
                    >
                      {leftEntry.rightText}
                    </text>
                  )}

                  {/* Texto Columna Derecha (Cara B) */}
                  {rightEntry && rightEntry.text && (
                    <text
                      x={rightEntry.indent ? 56.8 : 53.0}
                      y={textBaseline}
                      fill={paper.textHex}
                      fontFamily={fontFamily}
                      fontWeight={isHandwritten ? '700' : '600'}
                      fontSize={isHandwritten ? '3.35' : '2.25'}
                    >
                      {rightEntry.text}
                    </text>
                  )}
                  {rightEntry && rightEntry.rightText && (
                    <text
                      x={cardH - 4.0}
                      y={textBaseline}
                      textAnchor="end"
                      fill={paper.subTextHex}
                      fontFamily={fontFamily}
                      fontSize={isHandwritten ? '2.6' : '1.8'}
                    >
                      {rightEntry.rightText}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      }

      case 'mixtape-tdk-maxell':
      default: {
        const gridPatternId = `${idPrefix}-mm-grid`;
        const padX = frontX + 5;
        const innerW = frontW - 10; // 55 mm

        return (
          <g>
            <defs>
              <pattern
                id={gridPatternId}
                width="2.5"
                height="2.5"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 2.5 0 L 0 0 0 2.5"
                  fill="none"
                  stroke={project.secondaryColor}
                  strokeWidth="0.08"
                  opacity="0.14"
                />
              </pattern>
            </defs>

            <rect x={frontX} y={0} width={frontW} height={cardH} fill={paper.bgHex} />
            <rect x={frontX} y={0} width={frontW} height={cardH} fill={`url(#${gridPatternId})`} />

            <rect x={frontX} y={0} width={frontW} height={10.5} fill="#18181B" />
            <rect x={frontX} y={10.5} width={frontW} height={4.2} fill={project.accentColor} />

            <text
              x={padX}
              y={6.8}
              fill="#FAF7F0"
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="900"
              fontSize="3.4"
              letterSpacing="0.25"
            >
              {truncate(project.recordLabel.toUpperCase(), 20)}
            </text>
            <text
              x={frontX + frontW - 5}
              y={6.8}
              textAnchor="end"
              fill={project.accentColor}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fontSize="2.8"
            >
              {project.tapeCapacity}
            </text>
            <text
              x={padX}
              y={13.4}
              fill="#18181B"
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="800"
              fontSize="1.85"
              letterSpacing="0.22"
            >
              {project.stereoText.toUpperCase()}
            </text>

            {renderCoverArt(padX, 20, innerW, 38, `${idPrefix}-mixtape-cover`)}
            <rect
              x={padX}
              y={20}
              width={innerW}
              height={38}
              fill="none"
              stroke="#18181B"
              strokeWidth="0.3"
            />

            <text
              x={padX}
              y={64.5}
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontWeight="700"
              fontSize="2.9"
            >
              {truncate(project.albumTitle, 26)}
            </text>
            <text
              x={padX}
              y={68.5}
              fill={paper.subTextHex}
              fontFamily={fontFamily}
              fontSize="2.1"
            >
              {truncate(project.albumArtist, 32)}
            </text>

            <line x1={padX} y1={71.5} x2={padX + innerW} y2={71.5} stroke="#18181B" strokeWidth="0.3" />

            {project.tracks.slice(0, 5).map((t, idx) => {
              const y = 75.5 + idx * 3.6;
              return (
                <g key={t.id}>
                  <line
                    x1={padX}
                    y1={y + 0.9}
                    x2={padX + innerW}
                    y2={y + 0.9}
                    stroke="#18181B"
                    strokeWidth="0.12"
                    opacity="0.22"
                  />
                  <text
                    x={padX}
                    y={y}
                    fill={paper.textHex}
                    fontFamily={fontFamily}
                    fontSize="1.85"
                  >
                    {t.side}{idx + 1}. {truncate(t.title, 25)}
                  </text>
                  <text
                    x={padX + innerW}
                    y={y}
                    textAnchor="end"
                    fill={paper.subTextHex}
                    fontFamily={fontFamily}
                    fontSize="1.75"
                  >
                    {formatDuration(t.durationSec)}
                  </text>
                </g>
              );
            })}

            <text
              x={padX}
              y={96.5}
              fill={paper.subTextHex}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
              fontSize="1.65"
            >
              NR: {project.dolbySystem} • A: {formatDuration(sideASec)} / B: {formatDuration(sideBSec)}
            </text>
          </g>
        );
      }
    }
  };

  // Minimalist Spine Panel (12.5 x 102 mm)
  const renderSpinePanel = () => {
    if (project.templateId === 'tdk-d-index') {
      // En el sistema rotado 90° desde (spineX + spineW = 31.5, 0):
      // lx va de 0 a 102 mm (izquierda a derecha) y ly va de 0 a 12.5 mm (arriba a abajo).
      const isHandwritten = project.typography === 'handwritten-pen';
      const rawBadge = project.catalogNumber
        .replace(/^TDK\s*/i, '')
        .replace(/[- ]?(C60|C90|60|90)$/i, '')
        .trim();
      const modelCode = rawBadge ? truncate(rawBadge, 4) : 'D';

      return (
        <g transform={`translate(${spineX + spineW}, 0) rotate(90)`}>
          {/* Fondo blanco/crema de la sección principal del lomo */}
          <rect x={0} y={0} width={cardH} height={spineW} fill={paper.bgHex} />

          {/* Trapecio superior izquierdo negro con logotipo oficial TDK (❖ TDK) */}
          <polygon points="0,0 26.8,0 23.0,6.25 0,6.25" fill={project.accentColor} />
          <TdkLogoVector x={3.2} y={1.25} width={17.5} height={3.8} color="#FFFFFF" />

          {/* Trapecio inferior izquierdo gris con código de serie ("D", "SA", "AD") en cursiva gruesa */}
          <polygon points="0,6.25 23.0,6.25 19.2,12.5 0,12.5" fill="#D5D4CE" />
          <line x1={0} y1={6.25} x2={23.0} y2={6.25} stroke="#18181B" strokeWidth="0.35" />
          <text
            x={10.5}
            y={11.1}
            textAnchor="middle"
            fill="#18181B"
            fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontStyle="italic"
            fontWeight="900"
            fontSize="5.4"
          >
            {modelCode}
          </text>

          {/* Línea diagonal negra característica de TDK */}
          <line x1={26.8} y1={0} x2={19.2} y2={12.5} stroke="#18181B" strokeWidth="0.55" />

          {/* Bordes horizontales del lomo */}
          <line x1={0} y1={0} x2={cardH} y2={0} stroke="#18181B" strokeWidth="0.45" />
          <line x1={0} y1={spineW} x2={cardH} y2={spineW} stroke="#18181B" strokeWidth="0.45" />

          {/* Título principal de la cinta en el área blanca del lomo (ej. "Autumn Tape II") */}
          <text
            x={61.5}
            y={isHandwritten ? 8.8 : 8.1}
            textAnchor="middle"
            fill={paper.textHex}
            fontFamily={fontFamily}
            fontWeight={isHandwritten ? '700' : '800'}
            fontSize={isHandwritten ? '7.8' : '5.2'}
            letterSpacing={isHandwritten ? '0.05' : '0.15'}
          >
            {truncate(project.albumTitle, 28)}
          </text>
        </g>
      );
    }

    if (project.templateId === 'awesome-mix-quill') {
      // Lomo réplica exacta de la Imagen 3: fondo crema con logotipo ❖ TDK en negro y "AWESOME MIX VOL. 1" en rotulador azul.
      return (
        <g transform={`translate(${spineX + spineW}, 0) rotate(90)`}>
          <rect x={0} y={0} width={cardH} height={spineW} fill="#F2EFE6" />
          <line x1={0} y1={0} x2={cardH} y2={0} stroke="#18181B" strokeWidth="0.45" />
          <line x1={0} y1={spineW} x2={cardH} y2={spineW} stroke="#18181B" strokeWidth="0.45" />

          {/* Logotipo vertical ❖ TDK a la izquierda del lomo (como en la Imagen 3) */}
          <g transform="translate(2.5, 11.4) rotate(-90)">
            <TdkLogoVector x={0} y={0} width={10.2} height={2.4} color="#18181B" />
          </g>

          {/* Título escrito a rotulador azul en el centro del lomo */}
          <text
            x={48}
            y={8.6}
            textAnchor="middle"
            fill="#24477F"
            fontFamily="'Permanent Marker', 'Architects Daughter', 'Caveat', cursive"
            fontWeight="700"
            fontSize="6.4"
            letterSpacing="0.35"
          >
            {truncate(project.albumTitle.toUpperCase(), 24)}
          </text>
        </g>
      );
    }

    const isDG = project.templateId === 'deutsche-grammophon';
    const spineBg = isDG ? project.accentColor : paper.bgHex;
    const spineText = isDG ? '#18181B' : paper.textHex;
    const spineAccent = isDG ? '#18181B' : project.accentColor;
    const spineCenterX = spineX + spineW / 2;
    const activeLogo =
      project.companyLogo && project.companyLogo !== 'auto' && project.companyLogo !== 'none'
        ? project.companyLogo
        : null;

    return (
      <g>
        <rect x={spineX} y={0} width={spineW} height={cardH} fill={spineBg} />

        {activeLogo ? (
          <CompanyLogoBadge
            logoId={activeLogo}
            x={spineCenterX - 4.2}
            y={4.2}
            width={8.4}
            height={3.6}
            color={spineAccent}
          />
        ) : (
          <text
            x={spineCenterX}
            y={7.5}
            textAnchor="middle"
            fill={spineAccent}
            fontFamily="Inter, Helvetica, sans-serif"
            fontWeight="900"
            fontSize="1.9"
            letterSpacing="0.1"
          >
            {truncate(project.recordLabel.split('/')[0].trim(), 8)}
          </text>
        )}
        <text
          x={spineCenterX}
          y={11.2}
          textAnchor="middle"
          fill={spineText}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="700"
          fontSize="1.45"
        >
          {truncate(project.catalogNumber.replace(/^CBS\s+/i, ''), 9)}
        </text>

        <line
          x1={spineX + 2.5}
          y1={13.5}
          x2={spineX + spineW - 2.5}
          y2={13.5}
          stroke={spineAccent}
          strokeWidth="0.25"
        />

        <g transform={`translate(${spineCenterX}, 53) rotate(-90)`}>
          <text
            x={0}
            y={-0.8}
            textAnchor="middle"
            fill={spineText}
            fontFamily={fontFamily}
            fontWeight="800"
            fontSize="2.85"
            letterSpacing="0.22"
          >
            {truncate(project.albumTitle.toUpperCase(), 28)}
          </text>
          <text
            x={0}
            y={2.6}
            textAnchor="middle"
            fill={spineAccent}
            fontFamily={fontFamily}
            fontWeight="600"
            fontSize="2.1"
            letterSpacing="0.16"
          >
            {truncate(project.albumArtist.toUpperCase(), 32)}
          </text>
        </g>

        {project.dolbySystem !== 'NONE' && (
          <DolbyVectorLogo
            x={spineCenterX - 2.8}
            y={90}
            width={5.6}
            height={3.6}
            color={spineText}
            showText={false}
          />
        )}
        <text
          x={spineCenterX}
          y={96.5}
          textAnchor="middle"
          fill={spineText}
          fontFamily="Inter, Helvetica, sans-serif"
          fontWeight="700"
          fontSize="1.45"
          letterSpacing="0.18"
        >
          STEREO
        </text>
      </g>
    );
  };

  // Clean Back Flap Panel (19 x 102 mm)
  const renderFlapPanel = () => {
    if (project.templateId === 'tdk-d-index') {
      // En el encarte TDK D real, la solapa trasera (19 x 102 mm) está impresa invertida (180° respecto al frontal)
      // para que al doblarse detrás de la caja Norelco quede al derecho.
      // Con transform="translate(0, cardH) rotate(-90)", lx va de 0 a 102 mm y ly va de 0 a 19 mm.
      const isNrOn = project.dolbySystem !== 'NONE';
      const biasLabel = project.tapeBias.includes('CrO2')
        ? 'High Position'
        : project.tapeBias.includes('Metal')
        ? 'Metal Bias'
        : 'Normal Bias';
      const eqLabel = project.tapeBias.includes('70') ? 'EQ-70µs' : 'EQ-120µs';

      const renderFlapRow = (sideChar: 'A' | 'B', yTop: number) => (
        <g transform={`translate(3.8, ${yTop})`}>
          {/* Caja blanca con borde para DATE y TIME */}
          <rect
            x={6.2}
            y={0}
            width={41.5}
            height={6.6}
            fill={paper.bgHex}
            stroke="#18181B"
            strokeWidth="0.25"
          />
          <line x1={26.8} y1={0} x2={26.8} y2={6.6} stroke="#18181B" strokeWidth="0.25" />

          {/* Caja negra [A] o [B] */}
          <rect x={0} y={0} width={6.2} height={6.6} fill={project.accentColor} />
          <text
            x={3.1}
            y={4.8}
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="4.2"
          >
            {sideChar}
          </text>

          <text
            x={8.0}
            y={2.4}
            fill="#18181B"
            fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontWeight="700"
            fontSize="1.5"
          >
            DATE
          </text>
          <text
            x={28.5}
            y={2.4}
            fill="#18181B"
            fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontWeight="700"
            fontSize="1.5"
          >
            TIME
          </text>

          {/* Bloque N.R. [ ] ON [ ] OFF */}
          <text
            x={50.2}
            y={4.2}
            fill="#18181B"
            fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontWeight="800"
            fontSize="1.8"
          >
            N.R.
          </text>

          <rect
            x={55.8}
            y={1.6}
            width={3.2}
            height={3.2}
            fill="#FFFFFF"
            stroke="#18181B"
            strokeWidth="0.25"
          />
          {isNrOn && (
            <text
              x={57.4}
              y={4.2}
              textAnchor="middle"
              fill="#18181B"
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="900"
              fontSize="2.5"
            >
              ✓
            </text>
          )}
          <text
            x={59.8}
            y={4.1}
            fill="#18181B"
            fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontWeight="700"
            fontSize="1.55"
          >
            ON
          </text>

          <rect
            x={64.2}
            y={1.6}
            width={3.2}
            height={3.2}
            fill="#FFFFFF"
            stroke="#18181B"
            strokeWidth="0.25"
          />
          {!isNrOn && (
            <text
              x={65.8}
              y={4.2}
              textAnchor="middle"
              fill="#18181B"
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="900"
              fontSize="2.5"
            >
              ✓
            </text>
          )}
          <text
            x={68.2}
            y={4.1}
            fill="#18181B"
            fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontWeight="700"
            fontSize="1.55"
          >
            OFF
          </text>
        </g>
      );

      return (
        <g transform={`translate(0, ${cardH}) rotate(-90)`}>
          <rect x={0} y={0} width={cardH} height={flapW} fill="#D5D4CE" />

          {/* Tabla técnica derecha (Normal Bias EQ-120µs / STEREO / MONO) que al invertirse queda a la izquierda */}
          <g transform="translate(3.8, 3.2)">
            <text
              x={0}
              y={3.0}
              fill="#18181B"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fontSize="2.9"
            >
              {biasLabel}
            </text>
            <text
              x={0}
              y={6.8}
              fill="#18181B"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fontSize="2.9"
            >
              {eqLabel}
            </text>

            {/* Casillas STEREO / MONO */}
            <rect
              x={0}
              y={9.4}
              width={3.2}
              height={3.2}
              fill="#FFFFFF"
              stroke="#18181B"
              strokeWidth="0.25"
            />
            <text
              x={1.6}
              y={11.9}
              textAnchor="middle"
              fill="#18181B"
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="900"
              fontSize="2.4"
            >
              ✓
            </text>
            <text
              x={4.0}
              y={11.8}
              fill="#18181B"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="700"
              fontSize="1.55"
            >
              STEREO
            </text>

            <rect
              x={12.2}
              y={9.4}
              width={3.2}
              height={3.2}
              fill="#FFFFFF"
              stroke="#18181B"
              strokeWidth="0.25"
            />
            <text
              x={16.2}
              y={11.8}
              fill="#18181B"
              fontFamily="Inter, Helvetica, Arial, sans-serif"
              fontWeight="700"
              fontSize="1.55"
            >
              MONO
            </text>
          </g>

          {/* Filas [A] y [B] invertidas al dorso */}
          <g transform="translate(22, 0)">
            {renderFlapRow('B', 2.4)}
            {renderFlapRow('A', 9.8)}
          </g>
        </g>
      );
    }

    if (project.templateId === 'awesome-mix-quill') {
      // Solapa trasera réplica exacta de la Imagen 3:
      // Banda crema junto al pliegue con logotipo ❖ TDK invertido en la esquina derecha + 7 franjas rojas progresivas (de fina a gruesa).
      return (
        <g transform={`translate(${flapX + flapW}, 0) rotate(90)`}>
          <rect x={0} y={0} width={cardH} height={flapW} fill="#F2EFE6" />

          {/* Logotipo ❖ TDK invertido en la franja superior derecha de la solapa (tal como aparece en la Imagen 3) */}
          <g transform={`translate(${cardH - 3.5}, 4.8) rotate(180)`}>
            <TdkLogoVector x={0} y={0} width={17.5} height={3.8} color="#18181B" />
          </g>

          {/* 7 Franjas rojas progresivas de fina a gruesa hacia el borde exterior de la solapa */}
          <rect x={0} y={6.2} width={cardH} height={0.35} fill="#D43B30" />
          <rect x={0} y={7.7} width={cardH} height={0.55} fill="#D43B30" />
          <rect x={0} y={9.3} width={cardH} height={0.85} fill="#D43B30" />
          <rect x={0} y={11.1} width={cardH} height={1.20} fill="#D43B30" />
          <rect x={0} y={13.1} width={cardH} height={1.60} fill="#D43B30" />
          <rect x={0} y={15.4} width={cardH} height={2.15} fill="#D43B30" />
          <rect x={0} y={18.0} width={cardH} height={1.0} fill="#D43B30" />
        </g>
      );
    }

    return (
      <g>
        <rect x={flapX} y={0} width={flapW} height={cardH} fill={paper.bgHex} />

        <g transform={`translate(${flapX + 2.2}, 6.5)`}>
          <text
            x={0}
            y={0}
            fill={project.accentColor}
            fontFamily="Inter, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="1.7"
            letterSpacing="0.08"
          >
            CARA A ({formatDuration(sideASec)})
          </text>
          {sideATracks.slice(0, 8).map((t, idx) => (
            <text
              key={t.id}
              x={0}
              y={2.5 + idx * 2.15}
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontSize="1.38"
            >
              {idx + 1}. {truncate(t.title, 16)}
            </text>
          ))}

          <text
            x={0}
            y={22.2}
            fill={project.accentColor}
            fontFamily="Inter, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="1.7"
            letterSpacing="0.08"
          >
            CARA B ({formatDuration(sideBSec)})
          </text>
          {sideBTracks.slice(0, 8).map((t, idx) => (
            <text
              key={t.id}
              x={0}
              y={24.7 + idx * 2.15}
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontSize="1.38"
            >
              {idx + 1}. {truncate(t.title, 16)}
            </text>
          ))}
        </g>

        {/* Código QR (estilo vhs.texs.org) en la solapa trasera */}
        {project.showQrCode ? (
          <VectorQrCodeSvg
            data={project.qrCodeUrl || 'https://open.spotify.com'}
            x={flapX + 3.5}
            y={50}
            size={12}
            color={paper.textHex}
            bgColor="#FFFFFF"
          />
        ) : (
          <RightsSocietyBox x={flapX + 2.5} y={53} color={paper.textHex} text="SGAE / BIEM" />
        )}

        {/* Código de Barras UPC/EAN (estilo vhs.texs.org cid=878727472725) */}
        {project.showBarcode ? (
          <g transform={`translate(${flapX + 2.2}, 96.5) rotate(-90)`}>
            <VectorBarcodeSvg
              code={project.barcodeNumber || project.catalogNumber}
              x={0}
              y={0}
              width={28}
              height={14.5}
              color="#18181B"
              bgColor="#FFFFFF"
            />
          </g>
        ) : (
          <g transform={`translate(${flapX + 13}, 96.5) rotate(-90)`}>
            <text
              x={0}
              y={-3}
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontWeight="600"
              fontSize="1.35"
            >
              {truncate(project.countryText, 36)}
            </text>
            <text
              x={0}
              y={0}
              fill={paper.subTextHex}
              fontFamily="Inter, Helvetica, sans-serif"
              fontSize="1.2"
            >
              {truncate(project.legalText, 42)}
            </text>
          </g>
        )}
      </g>
    );
  };

  // Inner Fold-Out Panel J+1 (65 x 102 mm)
  const renderExtraPanel1 = () => {
    if (project.templateId === 'awesome-mix-quill') {
      // Réplica exacta de la hoja interior apaisada TDK de la Imagen 3:
      // Dos columnas con círculos negros (A) "side A" y (B) "side B", y cada canción en 2 renglones:
      // 1. "HOOKED ON A FEELING" / PERFORMED BY BLUE SWEDE en bolígrafo azul.
      const headerH = 8.5;
      const rowCount = 12;
      const rowH = (panelW - headerH) / rowCount;

      const buildQuillLines = (tracks: Track[], startNum: number) => {
        const lines: { text: string; isArtist?: boolean }[] = [];
        tracks.slice(0, 6).forEach((t, idx) => {
          lines.push({
            text: `${startNum + idx}. "${truncate(t.title.toUpperCase(), 23)}"`,
            isArtist: false,
          });
          lines.push({
            text: `PERFORMED BY ${truncate((t.artist || project.albumArtist).toUpperCase(), 21)}`,
            isArtist: true,
          });
        });
        return lines;
      };

      const colALines = buildQuillLines(sideATracks, 1);
      const colBLines = buildQuillLines(sideBTracks, sideATracks.slice(0, 6).length + 1);

      return (
        <g transform={`translate(${panel1X + panelW}, 0) rotate(90)`}>
          <rect x={0} y={0} width={cardH} height={panelW} fill="#F2EFE6" />
          <rect x={0} y={0} width={cardH} height={headerH} fill="#DFDDD4" />

          {/* Cabecera Columna A: círculo negro (A) + "side A" manuscrito */}
          <circle cx={6.2} cy={4.25} r={2.8} fill="#18181B" />
          <text
            x={6.2}
            y={5.4}
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="3.4"
          >
            A
          </text>
          <text
            x={16.5}
            y={6.0}
            fill="#24477F"
            fontFamily="'Architects Daughter', 'Caveat', cursive"
            fontWeight="700"
            fontSize="4.2"
          >
            side A
          </text>

          {/* Cabecera Columna B: círculo negro (B) + "side B" manuscrito */}
          <circle cx={56.2} cy={4.25} r={2.8} fill="#18181B" />
          <text
            x={56.2}
            y={5.4}
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Inter, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="3.4"
          >
            B
          </text>
          <text
            x={66.5}
            y={6.0}
            fill="#24477F"
            fontFamily="'Architects Daughter', 'Caveat', cursive"
            fontWeight="700"
            fontSize="4.2"
          >
            side B
          </text>

          <line x1={0} y1={headerH} x2={cardH} y2={headerH} stroke="#18181B" strokeWidth="0.45" />

          {Array.from({ length: rowCount }).map((_, rIdx) => {
            const rowBottom = headerH + (rIdx + 1) * rowH;
            const leftLine = colALines[rIdx];
            const rightLine = colBLines[rIdx];
            return (
              <g key={`quill-j1-row-${rIdx}`}>
                <line
                  x1={3.0}
                  y1={rowBottom}
                  x2={cardH - 3.0}
                  y2={rowBottom}
                  stroke="#71717A"
                  strokeWidth="0.22"
                  strokeDasharray="0.55 0.7"
                />
                {leftLine && (
                  <text
                    x={leftLine.isArtist ? 6.2 : 3.6}
                    y={rowBottom - 1.0}
                    fill="#24477F"
                    fontFamily="'Architects Daughter', 'Caveat', cursive"
                    fontWeight="700"
                    fontSize={leftLine.isArtist ? '2.05' : '2.35'}
                  >
                    {leftLine.text}
                  </text>
                )}
                {rightLine && (
                  <text
                    x={rightLine.isArtist ? 56.2 : 53.6}
                    y={rowBottom - 1.0}
                    fill="#24477F"
                    fontFamily="'Architects Daughter', 'Caveat', cursive"
                    fontWeight="700"
                    fontSize={rightLine.isArtist ? '2.05' : '2.35'}
                  >
                    {rightLine.text}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      );
    }

    const maxTracksPerSide = Math.max(sideATracks.length, sideBTracks.length, 8);
    const isDense = maxTracksPerSide > 8;
    const rowStep = isDense ? 2.65 : 3.4;
    const trackFontSize = isDense ? '1.68' : '1.95';

    const renderTrackSection = (
      title: string,
      tracks: Track[],
      totalSec: number,
      startY: number
    ) => (
      <g transform={`translate(${panel1X + 6}, ${startY})`}>
        <text
          x={0}
          y={2.5}
          fill={project.accentColor}
          fontFamily="Inter, Helvetica, sans-serif"
          fontWeight="800"
          fontSize="1.95"
          letterSpacing="0.2"
        >
          {title}
        </text>
        <text
          x={53}
          y={2.5}
          textAnchor="end"
          fill={paper.subTextHex}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
          fontSize="1.75"
        >
          {formatDuration(totalSec)}
        </text>
        <line x1={0} y1={3.8} x2={53} y2={3.8} stroke={project.accentColor} strokeWidth="0.3" />

        {tracks.slice(0, 11).map((t, idx) => {
          const yPos = 6.8 + idx * rowStep;
          const hasArtist =
            t.artist &&
            t.artist.trim() !== '' &&
            t.artist.toLowerCase() !== project.albumArtist.toLowerCase();
          const lineLabel = hasArtist ? `${t.title} - ${t.artist}` : t.title;
          return (
            <g key={t.id}>
              <text
                x={0}
                y={yPos}
                fill={paper.subTextHex}
                fontFamily="JetBrains Mono, monospace"
                fontSize="1.6"
              >
                {String(idx + 1).padStart(2, '0')}
              </text>
              <text
                x={4.5}
                y={yPos}
                fill={paper.textHex}
                fontFamily={fontFamily}
                fontWeight="600"
                fontSize={trackFontSize}
              >
                {truncate(lineLabel, 30)}
              </text>
              <text
                x={53}
                y={yPos}
                textAnchor="end"
                fill={paper.subTextHex}
                fontFamily="JetBrains Mono, monospace"
                fontSize="1.6"
              >
                {formatDuration(t.durationSec)}
              </text>
            </g>
          );
        })}
      </g>
    );

    return (
      <g>
        <rect x={panel1X} y={0} width={panelW} height={cardH} fill={paper.bgHex} />

        <g transform={`translate(${panel1X + 6}, 7)`}>
          <text
            x={0}
            y={2.5}
            fill={paper.textHex}
            fontFamily={fontFamily}
            fontWeight="800"
            fontSize="2.7"
            letterSpacing="0.18"
          >
            {truncate(project.albumTitle.toUpperCase(), 26)}
          </text>
          <text
            x={0}
            y={5.4}
            fill={paper.subTextHex}
            fontFamily={fontFamily}
            fontSize="1.95"
          >
            {truncate(project.albumArtist.toUpperCase(), 32)}
          </text>
        </g>

        {renderTrackSection('CARA A', sideATracks, sideASec, 17)}
        {renderTrackSection('CARA B', sideBTracks, sideBSec, 54)}

        <g transform={`translate(${panel1X + 6}, 91)`}>
          <line x1={0} y1={0} x2={53} y2={0} stroke={paper.borderHex} strokeWidth="0.2" opacity="0.4" />
          <text
            x={0}
            y={3.5}
            fill={paper.subTextHex}
            fontFamily={fontFamily}
            fontSize="1.65"
          >
            {truncate(project.productionCredits, 44)}
          </text>
        </g>
      </g>
    );
  };

  // Inner Fold-Out Panel J+2 (65 x 102 mm)
  const renderExtraPanel2 = () => {
    const wrapText = (text: string, maxChars: number): string[] => {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let current = '';
      for (const w of words) {
        if ((current + ' ' + w).trim().length <= maxChars) {
          current = (current + ' ' + w).trim();
        } else {
          if (current) lines.push(current);
          current = w;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    const noteLines = wrapText(project.linerNotes, 42);

    return (
      <g>
        <rect x={panel2X} y={0} width={panelW} height={cardH} fill={paper.bgHex} />

        <g transform={`translate(${panel2X + 6}, 10)`}>
          <text
            x={0}
            y={0}
            fill={project.accentColor}
            fontFamily="Inter, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="2.0"
            letterSpacing="0.2"
          >
            NOTAS EDITORIALES
          </text>
          <line x1={0} y1={2} x2={53} y2={2} stroke={project.accentColor} strokeWidth="0.3" />

          {noteLines.slice(0, 12).map((line, i) => (
            <text
              key={i}
              x={0}
              y={7 + i * 3.3}
              fill={paper.textHex}
              fontFamily={fontFamily}
              fontSize="1.95"
            >
              {line}
            </text>
          ))}

          <g transform="translate(0, 72)">
            <CompactCassetteLogo x={0} y={0} width={12} height={4.6} color={paper.textHex} />
            {project.dolbySystem !== 'NONE' && (
              <DolbyVectorLogo x={41} y={0} width={12} height={4.6} color={paper.textHex} />
            )}
          </g>
        </g>
      </g>
    );
  };

  const foldLinesX = [spineX, frontX];
  if (extraPanelsCount >= 1) foldLinesX.push(panel1X);
  if (extraPanelsCount >= 2) foldLinesX.push(panel2X);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${-margin} ${-margin} ${viewBoxW} ${viewBoxH}`}
      width="100%"
      height="100%"
      className={className}
    >
      <defs>
        <clipPath id={`${idPrefix}-total-card-clip`}>
          <rect x={0} y={0} width={totalCardW} height={cardH} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${idPrefix}-total-card-clip)`}>
        {renderFlapPanel()}
        {renderSpinePanel()}
        {renderFrontPanel()}
        {extraPanelsCount >= 1 && renderExtraPanel1()}
        {extraPanelsCount >= 2 && renderExtraPanel2()}
      </g>

      {foldLinesX.map((fx) => (
        <g key={`fold-${fx}`}>
          <line
            x1={fx}
            y1={0}
            x2={fx}
            y2={cardH}
            stroke="#71717A"
            strokeWidth="0.22"
            strokeDasharray="1.8 1.4"
          />
          {includePrintGuides && project.showCropMarks && (
            <>
              <line
                x1={fx}
                y1={-4}
                x2={fx}
                y2={-1.2}
                stroke="#71717A"
                strokeWidth="0.2"
                strokeDasharray="1 0.8"
              />
              <line
                x1={fx}
                y1={cardH + 1.2}
                x2={fx}
                y2={cardH + 4}
                stroke="#71717A"
                strokeWidth="0.2"
                strokeDasharray="1 0.8"
              />
            </>
          )}
        </g>
      ))}

      <rect
        x={0}
        y={0}
        width={totalCardW}
        height={cardH}
        fill="none"
        stroke={includePrintGuides && project.showCropMarks ? '#A1A1AA' : paper.borderHex}
        strokeWidth="0.25"
      />

      {includePrintGuides && project.showCropMarks && (
        <g stroke="#A1A1AA" strokeWidth="0.2" fill="none">
          <line x1={-5} y1={0} x2={-1.5} y2={0} />
          <line x1={0} y1={-5} x2={0} y2={-1.5} />
          <line x1={totalCardW + 1.5} y1={0} x2={totalCardW + 5} y2={0} />
          <line x1={totalCardW} y1={-5} x2={totalCardW} y2={-1.5} />
          <line x1={-5} y1={cardH} x2={-1.5} y2={cardH} />
          <line x1={0} y1={cardH + 1.5} x2={0} y2={cardH + 5} />
          <line x1={totalCardW + 1.5} y1={cardH} x2={totalCardW + 5} y2={cardH} />
          <line x1={totalCardW} y1={cardH + 1.5} x2={totalCardW} y2={cardH + 5} />
        </g>
      )}

      {includePrintGuides && project.showDimensionGuides && (
        <g fontFamily="JetBrains Mono, monospace" fontSize="1.85" fill="#71717A">
          <text x={flapX + flapW / 2} y={-2.2} textAnchor="middle">
            19 mm
          </text>
          <text x={spineX + spineW / 2} y={-2.2} textAnchor="middle">
            12.5 mm
          </text>
          <text x={frontX + frontW / 2} y={-2.2} textAnchor="middle">
            65 mm
          </text>
          {extraPanelsCount >= 1 && (
            <text x={panel1X + panelW / 2} y={-2.2} textAnchor="middle">
              65 mm (J+1)
            </text>
          )}
          {extraPanelsCount >= 2 && (
            <text x={panel2X + panelW / 2} y={-2.2} textAnchor="middle">
              65 mm (J+2)
            </text>
          )}
          <g transform={`translate(${-2.8}, ${cardH / 2}) rotate(-90)`}>
            <text x={0} y={0} textAnchor="middle">
              102 mm
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};
