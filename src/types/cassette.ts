export type TemplateId =
  | 'cbs-epic'
  | 'emi-harvest'
  | 'warner-sire'
  | 'deutsche-grammophon'
  | 'mixtape-tdk-maxell';

export type FoldFormat = 'j-standard' | 'j-plus-1' | 'j-plus-2';

export type TapeCapacity = 'C-46' | 'C-60' | 'C-90' | 'C-100';

export type PaperStockId =
  | 'off-white'
  | 'editorial-cream'
  | 'pearl-grey'
  | 'aged-ivory'
  | 'matte-black';

export type TypographyPreset =
  | 'helvetica-univers'
  | 'garamond-serif'
  | 'condensed-80s'
  | 'classical-dg'
  | 'typewriter-mono';

export type CoverFilter = 'none' | 'warm-70s' | 'high-contrast' | 'monochrome';

export type PreviewMode = 'flat-print' | 'mockup-3d' | 'labels-view';

export interface Track {
  id: string;
  title: string;
  artist: string;
  durationSec: number; // exact duration in seconds
  side: 'A' | 'B';
}

export interface CoverFraming {
  zoom: number; // 1.0 to 3.0
  panX: number; // -100 to 100 (%)
  panY: number; // -100 to 100 (%)
  filter: CoverFilter;
}

export interface CassetteProject {
  version: string;
  albumTitle: string;
  albumArtist: string;
  subtitleOrSeries: string;
  catalogNumber: string;
  recordLabel: string;
  releaseYear: string;
  countryText: string;
  legalText: string;
  linerNotes: string;
  productionCredits: string;
  coverUrl: string;
  coverFraming: CoverFraming;
  templateId: TemplateId;
  foldFormat: FoldFormat;
  tapeCapacity: TapeCapacity;
  paperStock: PaperStockId;
  accentColor: string;
  secondaryColor: string;
  typography: TypographyPreset;
  dolbySystem: 'B-NR' | 'C-NR' | 'HX-PRO' | 'NONE';
  tapeBias: 'Normal (Fe2O3) 120µs' | 'CrO2 (Type II) 70µs' | 'Metal (Type IV) 70µs';
  stereoText: string;
  showCropMarks: boolean;
  showDimensionGuides: boolean;
  tracks: Track[];
}

export const PHYSICAL_SPECS = {
  FRONT_WIDTH_MM: 65,
  SPINE_WIDTH_MM: 12.5,
  FLAP_WIDTH_MM: 19,
  EXTRA_PANEL_WIDTH_MM: 65,
  JCARD_HEIGHT_MM: 102,
  LABEL_WIDTH_MM: 89,
  LABEL_HEIGHT_MM: 42,
  LABEL_WINDOW_WIDTH_MM: 59,
  LABEL_WINDOW_HEIGHT_MM: 17.5,
  LABEL_REEL_SPACING_MM: 42.5,
  LABEL_REEL_DIAMETER_MM: 12.8,
  DPI: 300,
  MM_TO_PX_300DPI: 300 / 25.4, // ~11.811023622 px/mm
} as const;

export const TAPE_CAPACITIES: Record<
  TapeCapacity,
  { label: string; maxSideSec: number; totalMin: number; description: string }
> = {
  'C-46': {
    label: 'C-46 (23 min/cara)',
    maxSideSec: 23 * 60,
    totalMin: 46,
    description: 'Ideal para EPs y álbumes cortos de vinilo',
  },
  'C-60': {
    label: 'C-60 (30 min/cara)',
    maxSideSec: 30 * 60,
    totalMin: 60,
    description: 'Estándar comercial LP (30 min por cara)',
  },
  'C-90': {
    label: 'C-90 (45 min/cara)',
    maxSideSec: 45 * 60,
    totalMin: 90,
    description: 'Estándar para Mixtapes y álbumes dobles (45 min por cara)',
  },
  'C-100': {
    label: 'C-100 (50 min/cara)',
    maxSideSec: 50 * 60,
    totalMin: 100,
    description: 'Cinta extendida de alta densidad (50 min por cara)',
  },
};

export const PAPER_STOCKS: Record<
  PaperStockId,
  { name: string; bgHex: string; textHex: string; subTextHex: string; borderHex: string }
> = {
  'off-white': {
    name: 'Blanco Roto (Offset 80s)',
    bgHex: '#FAF7F0',
    textHex: '#161615',
    subTextHex: '#4A4843',
    borderHex: '#262523',
  },
  'editorial-cream': {
    name: 'Crema Editorial (CBS 70s)',
    bgHex: '#F3ECDA',
    textHex: '#1A1815',
    subTextHex: '#524B3E',
    borderHex: '#2B261F',
  },
  'pearl-grey': {
    name: 'Gris Perla Técnico',
    bgHex: '#EAECEF',
    textHex: '#14171A',
    subTextHex: '#495057',
    borderHex: '#212529',
  },
  'aged-ivory': {
    name: 'Marfil Envejecido Archivo',
    bgHex: '#EADFC5',
    textHex: '#211C15',
    subTextHex: '#5E5240',
    borderHex: '#332B1E',
  },
  'matte-black': {
    name: 'Negro Mate (Edición Especial)',
    bgHex: '#151514',
    textHex: '#F3EFE6',
    subTextHex: '#A8A296',
    borderHex: '#D8D0C0',
  },
};

export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  era: string;
  region: string;
  description: string;
  defaultAccent: string;
  defaultSecondary: string;
  defaultPaper: PaperStockId;
  defaultTypography: TypographyPreset;
  defaultLabel: string;
  defaultCatalog: string;
  defaultStereoText: string;
}

export const HISTORICAL_TEMPLATES: TemplateMetadata[] = [
  {
    id: 'cbs-epic',
    name: 'CBS / Epic',
    era: 'ca. 1978–1985',
    region: 'España y Europa',
    description:
      'Portada cuadrada superior con filete doble; faldón crema con catálogo en rojo teja, logo Dolby System, Helvética mayúscula centrada y "ESTÉREO CASSETTE".',
    defaultAccent: '#B83227',
    defaultSecondary: '#1A1815',
    defaultPaper: 'editorial-cream',
    defaultTypography: 'helvetica-univers',
    defaultLabel: 'CBS',
    defaultCatalog: 'CBS 40-85930',
    defaultStereoText: 'ESTÉREO CASSETTE',
  },
  {
    id: 'emi-harvest',
    name: 'EMI / Harvest / Odeon',
    era: 'Años 1971–1979',
    region: 'UK y Europa',
    description:
      'Marco perimetral grueso en negro o crema; arte cuadrado centrado; bloque tipográfico serif sobrio (Garamond), indicación de sesgo y emblema rectangular EMI.',
    defaultAccent: '#8C6239',
    defaultSecondary: '#141413',
    defaultPaper: 'aged-ivory',
    defaultTypography: 'garamond-serif',
    defaultLabel: 'EMI / HARVEST',
    defaultCatalog: 'TC-SHVL 804',
    defaultStereoText: 'STEREO PLAYABLE MONO',
  },
  {
    id: 'warner-sire',
    name: 'Warner Bros. / Sire',
    era: 'Años 1981–1989',
    region: 'EE.UU. / Internacional',
    description:
      'Diseño con franja superior/lateral de color sólido, tipografía condensada en bloque, sellos de control de calidad HX PRO y estética comercial años 80.',
    defaultAccent: '#D9381E',
    defaultSecondary: '#0F172A',
    defaultPaper: 'off-white',
    defaultTypography: 'condensed-80s',
    defaultLabel: 'SIRE / WARNER BROS.',
    defaultCatalog: '9 23801-4',
    defaultStereoText: 'SUPER HIGH QUALITY • HX PRO B NR',
  },
  {
    id: 'deutsche-grammophon',
    name: 'Deutsche Grammophon',
    era: 'Clásica / Archiv 70s–80s',
    region: 'Alemania Occidental',
    description:
      'Cartelera superior amarilla ocre con marco institucional triple y corona clásica; composición rigurosa centrada con fotografía debajo.',
    defaultAccent: '#E5B822',
    defaultSecondary: '#18181B',
    defaultPaper: 'off-white',
    defaultTypography: 'classical-dg',
    defaultLabel: 'DEUTSCHE GRAMMOPHON',
    defaultCatalog: '3302 019 • STEREO',
    defaultStereoText: 'CHROMDIOXID 70 µs',
  },
  {
    id: 'mixtape-tdk-maxell',
    name: 'Mixtape Virgen (TDK SA / Maxell XL-II)',
    era: 'Finales 70s / Años 80',
    region: 'Japón / Home Taping',
    description:
      'Fondo con cuadrícula milimetrada técnica, franjas horizontales bicolores (dorado/negro), casillas de verificación NR/EQ y tipografía de máquina de escribir.',
    defaultAccent: '#B89241',
    defaultSecondary: '#1E3A8A',
    defaultPaper: 'off-white',
    defaultTypography: 'typewriter-mono',
    defaultLabel: 'TDK SA-90 / MAXELL XL-II',
    defaultCatalog: 'INDEX NO. 01-84',
    defaultStereoText: 'HIGH POSITION (TYPE II) • 70µs EQ',
  },
];
