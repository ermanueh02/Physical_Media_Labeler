import { CassetteProject, TemplateId, Track } from '../types/cassette';
import { balanceTracksSequential } from './timeAndBalance';
import { ensureDataUrl, getPresetCoverSvgDataUrl } from './vintageArtwork';

export interface SpotifyExtractedData {
  title: string;
  artist: string;
  releaseYear: string;
  coverUrl: string;
  label?: string;
  tracks: Track[];
  sourceMode: 'spotify-web-api' | 'spotify-embed-proxy' | 'catalog-preset';
}

export function parseSpotifyUrl(input: string): { type: 'album' | 'playlist'; id: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Match spotify:album:ID or spotify:playlist:ID
  const uriMatch = trimmed.match(/^spotify:(album|playlist):([a-zA-Z0-9]+)$/i);
  if (uriMatch) {
    return {
      type: uriMatch[1].toLowerCase() as 'album' | 'playlist',
      id: uriMatch[2],
    };
  }

  // Match https://open.spotify.com/(intl-xx/)?(album|playlist)/ID
  const urlMatch = trimmed.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(album|playlist)\/([a-zA-Z0-9]+)/i
  );
  if (urlMatch) {
    return {
      type: urlMatch[1].toLowerCase() as 'album' | 'playlist',
      id: urlMatch[2],
    };
  }

  return null;
}

/**
 * Fetches an OAuth2 access token using Spotify Client Credentials Flow
 */
async function getSpotifyClientCredentialsToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const credentials = btoa(`${clientId.trim()}:${clientSecret.trim()}`);
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Error de autenticación Spotify Web API (${response.status})`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetches album or playlist metadata & tracks from official Spotify Web API v1
 */
async function fetchFromOfficialSpotifyApi(
  type: 'album' | 'playlist',
  id: string,
  accessToken: string
): Promise<SpotifyExtractedData> {
  const endpoint =
    type === 'album'
      ? `https://api.spotify.com/v1/albums/${id}`
      : `https://api.spotify.com/v1/playlists/${id}`;

  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Spotify Web API respondió con estado ${res.status}`);
  }

  const data = await res.json();

  if (type === 'album') {
    const artistName =
      data.artists?.map((a: { name: string }) => a.name).join(', ') || 'Artista Desconocido';
    const rawCover = data.images?.[0]?.url || '';
    const coverUrl = rawCover ? await ensureDataUrl(rawCover) : getPresetCoverSvgDataUrl('cbs-epic');
    const releaseYear = (data.release_date || '1982').slice(0, 4);

    const rawTracks: Track[] = (data.tracks?.items || []).map(
      (item: { id?: string; name: string; duration_ms: number; artists?: { name: string }[] }, idx: number) => ({
        id: item.id || `sp-alb-${idx}`,
        title: item.name,
        artist: item.artists?.map((a) => a.name).join(', ') || artistName,
        durationSec: Math.max(1, Math.round((item.duration_ms || 180000) / 1000)),
        side: 'A' as const,
      })
    );

    return {
      title: data.name || 'Álbum sin título',
      artist: artistName,
      releaseYear,
      coverUrl,
      label: data.label || undefined,
      tracks: balanceTracksSequential(rawTracks),
      sourceMode: 'spotify-web-api',
    };
  } else {
    const ownerName = data.owner?.display_name || 'Varios Artistas';
    const rawCover = data.images?.[0]?.url || '';
    const coverUrl = rawCover
      ? await ensureDataUrl(rawCover)
      : getPresetCoverSvgDataUrl('mixtape-tdk-maxell');

    const items = data.tracks?.items || [];
    const rawTracks: Track[] = items
      .map(
        (
          entry: {
            track?: {
              id?: string;
              name?: string;
              duration_ms?: number;
              artists?: { name: string }[];
            };
          },
          idx: number
        ) => {
          const t = entry.track;
          if (!t || !t.name) return null;
          return {
            id: t.id || `sp-pl-${idx}`,
            title: t.name,
            artist: t.artists?.map((a) => a.name).join(', ') || ownerName,
            durationSec: Math.max(1, Math.round((t.duration_ms || 180000) / 1000)),
            side: 'A' as const,
          };
        }
      )
      .filter((t: Track | null): t is Track => t !== null);

    return {
      title: data.name || 'Playlist de Spotify',
      artist: ownerName,
      releaseYear: new Date().getFullYear().toString(),
      coverUrl,
      tracks: balanceTracksSequential(rawTracks),
      sourceMode: 'spotify-web-api',
    };
  }
}

/**
 * Fetches album or playlist metadata & full tracklist via our zero-config Vite backend proxy
 * that parses Spotify's public embed payload (__NEXT_DATA__).
 */
async function fetchFromSpotifyEmbedProxy(
  type: 'album' | 'playlist',
  id: string
): Promise<SpotifyExtractedData> {
  // First check if it matches one of our built-in offline presets by ID
  const preset = SPOTIFY_HISTORICAL_PRESETS.find((p) => p.spotifyId === id);

  let entity: any = null;

  // 1. Try local Vite middleware first (when running npm run dev locally)
  try {
    const res = await fetch(`/api/spotify-embed?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = await res.json();
        entity = payload?.entity;
      }
    }
  } catch {
    // Ignore local proxy error when hosted statically on GitHub Pages
  }

  // 2. Static GitHub Pages fallback: fetch Spotify embed HTML via public CORS proxy & parse __NEXT_DATA__
  if (!entity) {
    try {
      const targetEmbed = `https://open.spotify.com/embed/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;
      const corsRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetEmbed)}`);
      if (corsRes.ok) {
        const html = await corsRes.text();
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (match && match[1]) {
          const nextData = JSON.parse(match[1]);
          entity = nextData?.props?.pageProps?.state?.data?.entity;
        }
      }
    } catch {
      // Fallback to oEmbed or preset below
    }
  }

  if (!entity) {
    if (preset) {
      return {
        title: preset.project.albumTitle,
        artist: preset.project.albumArtist,
        releaseYear: preset.project.releaseYear,
        coverUrl: preset.project.coverUrl,
        label: preset.project.recordLabel,
        tracks: balanceTracksSequential(preset.project.tracks),
        sourceMode: 'catalog-preset',
      };
    }

    // 3. Final public fallback: Spotify public oEmbed API (always supports CORS natively)
    try {
      const oembedRes = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/${type}/${id}`)}`
      );
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        const coverUrl = oembed.thumbnail_url
          ? await ensureDataUrl(oembed.thumbnail_url)
          : getPresetCoverSvgDataUrl('cbs-epic');
        return {
          title: oembed.title || 'Álbum Spotify',
          artist: 'Spotify Import',
          releaseYear: '1984',
          coverUrl,
          tracks: [],
          sourceMode: 'spotify-embed-proxy',
        };
      }
    } catch {
      // Ignore
    }

    throw new Error('No se pudo extraer el enlace público. Introduce Client ID / Secret de Spotify o usa un preset.');
  }

  const title = entity.title || entity.name || 'Álbum Spotify';
  const subtitle =
    entity.subtitle ||
    entity.artists?.map((a: { name: string }) => a.name).join(', ') ||
    'Varios Artistas';
  const releaseYear = entity.releaseDate?.isoString
    ? entity.releaseDate.isoString.slice(0, 4)
    : '1984';

  const visuals =
    entity.visualIdentity?.image ||
    entity.coverArt?.sources ||
    entity.images ||
    [];
  const bestImage = Array.isArray(visuals) && visuals.length > 0
    ? visuals.reduce((prev: { url: string; width?: number }, curr: { url: string; width?: number }) =>
        (curr.width || 0) > (prev.width || 0) ? curr : prev
      ).url
    : '';

  const coverUrl = bestImage
    ? await ensureDataUrl(bestImage)
    : getPresetCoverSvgDataUrl('cbs-epic');

  const trackListRaw = entity.trackList || [];
  const rawTracks: Track[] = trackListRaw.map(
    (
      item: {
        uid?: string;
        uri?: string;
        title?: string;
        subtitle?: string;
        duration?: number;
      },
      idx: number
    ) => ({
      id: item.uid || item.uri || `embed-${idx}`,
      title: item.title || `Pista ${idx + 1}`,
      artist: (item.subtitle || subtitle).replace(/\u00a0/g, ' '),
      durationSec: Math.max(1, Math.round((item.duration || 180000) / 1000)),
      side: 'A' as const,
    })
  );

  if (rawTracks.length === 0 && preset) {
    return {
      title: preset.project.albumTitle,
      artist: preset.project.albumArtist,
      releaseYear: preset.project.releaseYear,
      coverUrl: coverUrl || preset.project.coverUrl,
      label: preset.project.recordLabel,
      tracks: balanceTracksSequential(preset.project.tracks),
      sourceMode: 'catalog-preset',
    };
  }

  return {
    title,
    artist: subtitle,
    releaseYear,
    coverUrl,
    tracks: balanceTracksSequential(rawTracks),
    sourceMode: 'spotify-embed-proxy',
  };
}

/**
 * Main entry point to extract Spotify Album or Playlist data.
 */
export async function fetchSpotifyMetadata(
  urlOrUri: string,
  options?: { clientId?: string; clientSecret?: string; accessToken?: string }
): Promise<SpotifyExtractedData> {
  const parsed = parseSpotifyUrl(urlOrUri);
  if (!parsed) {
    throw new Error(
      'Enlace de Spotify no válido. Usa un enlace de álbum o playlist (ej. https://open.spotify.com/album/...)'
    );
  }

  // 1. If official credentials or token are provided, try official Spotify Web API first
  if (options?.accessToken?.trim()) {
    return await fetchFromOfficialSpotifyApi(parsed.type, parsed.id, options.accessToken.trim());
  }

  if (options?.clientId?.trim() && options?.clientSecret?.trim()) {
    const token = await getSpotifyClientCredentialsToken(
      options.clientId,
      options.clientSecret
    );
    return await fetchFromOfficialSpotifyApi(parsed.type, parsed.id, token);
  }

  // 2. Otherwise use zero-config backend embed extractor (or preset catalog fallback)
  return await fetchFromSpotifyEmbedProxy(parsed.type, parsed.id);
}

export interface HistoricalCatalogPreset {
  id: string;
  spotifyId: string;
  spotifyUrl: string;
  badge: string;
  templateId: TemplateId;
  project: CassetteProject;
}

export const SPOTIFY_HISTORICAL_PRESETS: HistoricalCatalogPreset[] = [
  {
    id: 'cbs-mecano-1982',
    spotifyId: '4A2n685X2p3HAjF9m85s2P',
    spotifyUrl: 'https://open.spotify.com/album/4A2n685X2p3HAjF9m85s2P',
    badge: 'CBS España 1982',
    templateId: 'cbs-epic',
    project: {
      version: '1.0',
      albumTitle: 'ARQUITECTURA DEL AIRE',
      albumArtist: 'AVIADOR DRO / SINTETIZADORES DE MADRID',
      subtitleOrSeries: 'EDICIÓN ESPECIAL ESTÉREO',
      catalogNumber: 'CBS 40-85930',
      recordLabel: 'CBS',
      releaseYear: '1982',
      countryText: 'FABRICADO EN ESPAÑA POR DISCOS CBS, S.A. - MADRID',
      legalText:
        'IMP. DE LUJO A METÁLICO - PERMISO Nº 7053. RESERVADOS TODOS LOS DERECHOS. PROHIBIDA LA REPRODUCCIÓN, EJECUCIÓN PÚBLICA Y RADIODIFUSIÓN DE ESTA CINTA.',
      linerNotes:
        'Grabado en los Estudios Kirios y Doublewtronics (Madrid) entre octubre de 1981 y enero de 1982 en cinta maestra de 2 pulgadas a 30 ips. Reducción de ruido Dolby B-NR en duplicación de alta velocidad.',
      productionCredits:
        'Producido por Jesús Gómez y Servando Carballar • Diseño Gráfico: Estudio CBS Madrid',
      coverUrl: getPresetCoverSvgDataUrl('cbs-epic'),
      coverFraming: { zoom: 1, panX: 0, panY: 0, filter: 'none' },
      templateId: 'cbs-epic',
      foldFormat: 'j-plus-1',
      tapeCapacity: 'C-60',
      paperStock: 'editorial-cream',
      accentColor: '#B83227',
      secondaryColor: '#1A1815',
      typography: 'helvetica-univers',
      dolbySystem: 'B-NR',
      tapeBias: 'Normal (Fe2O3) 120µs',
      stereoText: 'ESTÉREO CASSETTE',
      showCropMarks: true,
      showDimensionGuides: true,
      tracks: [
        { id: 't1', title: 'Programa en Espiral', artist: 'Aviador Dro', durationSec: 238, side: 'A' },
        { id: 't2', title: 'Selector de Frecuencias', artist: 'Aviador Dro', durationSec: 274, side: 'A' },
        { id: 't3', title: 'Maquillaje Magnético', artist: 'Mecano', durationSec: 196, side: 'A' },
        { id: 't4', title: 'Perdido en Mi Habitación', artist: 'Mecano', durationSec: 223, side: 'A' },
        { id: 't5', title: 'Nuclear Sí, Por Supuesto', artist: 'Aviador Dro', durationSec: 185, side: 'A' },
        { id: 't6', title: 'Televisión Nocturna', artist: 'Parálisis Permanente', durationSec: 212, side: 'B' },
        { id: 't7', title: 'Autosuficiencia', artist: 'Parálisis Permanente', durationSec: 178, side: 'B' },
        { id: 't8', title: 'Groenlandia (Versión Cinta)', artist: 'Zombies', durationSec: 231, side: 'B' },
        { id: 't9', title: 'Cenizas en el Dial', artist: 'Décima Víctima', durationSec: 254, side: 'B' },
        { id: 't10', title: 'El Ritmo del Garaje', artist: 'Loquillo y Trogloditas', durationSec: 245, side: 'B' },
      ],
    },
  },
  {
    id: 'emi-harvest-1973',
    spotifyId: '4LH4d3cOWNNsVw41Gqt2kv',
    spotifyUrl: 'https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv',
    badge: 'EMI / Harvest UK 1973',
    templateId: 'emi-harvest',
    project: {
      version: '1.0',
      albumTitle: 'THE DARK SIDE OF THE MOON',
      albumArtist: 'PINK FLOYD',
      subtitleOrSeries: 'HARVEST CHROME CASSETTE',
      catalogNumber: 'TC-SHVL 804',
      recordLabel: 'EMI / HARVEST',
      releaseYear: '1973',
      countryText: 'MADE AND PRINTED IN GREAT BRITAIN BY EMI RECORDS LTD.',
      legalText:
        'ALL RIGHTS OF THE MANUFACTURER AND OF THE OWNER OF THE RECORDED WORK RESERVED. UNAUTHORISED PUBLIC PERFORMANCE, BROADCASTING AND COPYING OF THIS TAPE RECORDING PROHIBITED.',
      linerNotes:
        'Recorded at Abbey Road Studios, London between June 1972 and January 1973. Engineer: Alan Parsons. Assistant: Peter James. Mixing supervised by Chris Thomas. Sleeve Design by Hipgnosis.',
      productionCredits: 'Produced by Pink Floyd • EMI Records Ltd., Hayes, Middlesex, England',
      coverUrl: getPresetCoverSvgDataUrl('emi-harvest'),
      coverFraming: { zoom: 1, panX: 0, panY: 0, filter: 'none' },
      templateId: 'emi-harvest',
      foldFormat: 'j-plus-1',
      tapeCapacity: 'C-60',
      paperStock: 'aged-ivory',
      accentColor: '#8C6239',
      secondaryColor: '#141413',
      typography: 'garamond-serif',
      dolbySystem: 'B-NR',
      tapeBias: 'Normal (Fe2O3) 120µs',
      stereoText: 'STEREO PLAYABLE MONO',
      showCropMarks: true,
      showDimensionGuides: true,
      tracks: [
        { id: 'pf1', title: 'Speak to Me', artist: 'Pink Floyd', durationSec: 68, side: 'A' },
        { id: 'pf2', title: 'Breathe (In the Air)', artist: 'Pink Floyd', durationSec: 169, side: 'A' },
        { id: 'pf3', title: 'On the Run', artist: 'Pink Floyd', durationSec: 225, side: 'A' },
        { id: 'pf4', title: 'Time', artist: 'Pink Floyd', durationSec: 413, side: 'A' },
        { id: 'pf5', title: 'The Great Gig in the Sky', artist: 'Pink Floyd', durationSec: 284, side: 'A' },
        { id: 'pf6', title: 'Money', artist: 'Pink Floyd', durationSec: 382, side: 'B' },
        { id: 'pf7', title: 'Us and Them', artist: 'Pink Floyd', durationSec: 469, side: 'B' },
        { id: 'pf8', title: 'Any Colour You Like', artist: 'Pink Floyd', durationSec: 206, side: 'B' },
        { id: 'pf9', title: 'Brain Damage', artist: 'Pink Floyd', durationSec: 226, side: 'B' },
        { id: 'pf10', title: 'Eclipse', artist: 'Pink Floyd', durationSec: 130, side: 'B' },
      ],
    },
  },
  {
    id: 'warner-sire-1983',
    spotifyId: '6NTrwu1XJ9c2F6c1K1a2b3',
    spotifyUrl: 'https://open.spotify.com/album/6NTrwu1XJ9c2F6c1K1a2b3',
    badge: 'Warner / Sire USA 1983',
    templateId: 'warner-sire',
    project: {
      version: '1.0',
      albumTitle: 'POWER, CORRUPTION & LIES',
      albumArtist: 'NEW ORDER',
      subtitleOrSeries: 'SUPER HIGH QUALITY CASSETTE',
      catalogNumber: '9 23801-4',
      recordLabel: 'SIRE / WARNER BROS.',
      releaseYear: '1983',
      countryText: 'MARKETED BY WARNER BROS. RECORDS INC., A WARNER COMMUNICATIONS COMPANY',
      legalText:
        '© 1983 SIRE RECORDS COMPANY. MADE IN U.S.A. DUPLICATED WORK WITH DOLBY HX PRO HEADROOM EXTENSION AND B-TYPE NOISE REDUCTION.',
      linerNotes:
        'Recorded at Britannia Row Studios, London. Mastered for cassette on high-output cobalt-modified tape stock. Side One Total Time: 21:40 • Side Two Total Time: 21:08.',
      productionCredits: 'Written and Produced by New Order • Design: Peter Saville Associates',
      coverUrl: getPresetCoverSvgDataUrl('warner-sire'),
      coverFraming: { zoom: 1, panX: 0, panY: 0, filter: 'none' },
      templateId: 'warner-sire',
      foldFormat: 'j-plus-1',
      tapeCapacity: 'C-60',
      paperStock: 'off-white',
      accentColor: '#D9381E',
      secondaryColor: '#0F172A',
      typography: 'condensed-80s',
      dolbySystem: 'HX-PRO',
      tapeBias: 'CrO2 (Type II) 70µs',
      stereoText: 'SUPER HIGH QUALITY • HX PRO B NR',
      showCropMarks: true,
      showDimensionGuides: true,
      tracks: [
        { id: 'no1', title: 'Age of Consent', artist: 'New Order', durationSec: 315, side: 'A' },
        { id: 'no2', title: 'We All Stand', artist: 'New Order', durationSec: 314, side: 'A' },
        { id: 'no3', title: 'The Village', artist: 'New Order', durationSec: 277, side: 'A' },
        { id: 'no4', title: '5 8 6', artist: 'New Order', durationSec: 451, side: 'A' },
        { id: 'no5', title: 'Your Silent Face', artist: 'New Order', durationSec: 360, side: 'B' },
        { id: 'no6', title: 'Ultraviolence', artist: 'New Order', durationSec: 292, side: 'B' },
        { id: 'no7', title: 'Ecstasy', artist: 'New Order', durationSec: 265, side: 'B' },
        { id: 'no8', title: 'Leave Me Alone', artist: 'New Order', durationSec: 280, side: 'B' },
      ],
    },
  },
  {
    id: 'dg-karajan-1977',
    spotifyId: '2DG999ClassicalKarajan',
    spotifyUrl: 'https://open.spotify.com/album/2DG999ClassicalKarajan',
    badge: 'Deutsche Grammophon 1977',
    templateId: 'deutsche-grammophon',
    project: {
      version: '1.0',
      albumTitle: 'SYMPHONIE NR. 7 A-DUR OP. 92',
      albumArtist: 'LUDWIG VAN BEETHOVEN • BERLINER PHILHARMONIKER',
      subtitleOrSeries: 'HERBERT VON KARAJAN',
      catalogNumber: '3301 107 • CrO2',
      recordLabel: 'DEUTSCHE GRAMMOPHON',
      releaseYear: '1977',
      countryText: 'PRINTED IN WEST GERMANY BY NEef, WITTINGEN • MADE IN WEST GERMANY',
      legalText:
        '℗ 1977 POLYDOR INTERNATIONAL GMBH, HAMBURG. ALLE URHEBER- UND LEISTUNGSSCHUTZRECHTE VORBEHALTEN.',
      linerNotes:
        'Aufnahmeleitung / Production: Michel Glotz • Tonmeister / Recording Supervision: Günter Hermanns. Aufgenommen in der Berliner Philharmonie. Chromdioxid-Cassette 70 µs mit Dolby-B-Verfahren.',
      productionCredits: 'Berliner Philharmoniker • Dirigent: Herbert von Karajan',
      coverUrl: getPresetCoverSvgDataUrl('deutsche-grammophon'),
      coverFraming: { zoom: 1, panX: 0, panY: 0, filter: 'none' },
      templateId: 'deutsche-grammophon',
      foldFormat: 'j-plus-1',
      tapeCapacity: 'C-60',
      paperStock: 'off-white',
      accentColor: '#E5B822',
      secondaryColor: '#18181B',
      typography: 'classical-dg',
      dolbySystem: 'B-NR',
      tapeBias: 'CrO2 (Type II) 70µs',
      stereoText: 'CHROMDIOXID 70 µs • STEREO',
      showCropMarks: true,
      showDimensionGuides: true,
      tracks: [
        { id: 'dg1', title: 'I. Poco sostenuto – Vivace', artist: 'Berliner Philharmoniker / Karajan', durationSec: 712, side: 'A' },
        { id: 'dg2', title: 'II. Allegretto', artist: 'Berliner Philharmoniker / Karajan', durationSec: 498, side: 'A' },
        { id: 'dg3', title: 'III. Presto – Assai meno presto', artist: 'Berliner Philharmoniker / Karajan', durationSec: 472, side: 'B' },
        { id: 'dg4', title: 'IV. Allegro con brio', artist: 'Berliner Philharmoniker / Karajan', durationSec: 416, side: 'B' },
      ],
    },
  },
  {
    id: 'tdk-maxell-mixtape-1985',
    spotifyId: '5MixtapeTDKSA90HomeTaping',
    spotifyUrl: 'https://open.spotify.com/playlist/5MixtapeTDKSA90HomeTaping',
    badge: 'TDK SA-90 / Maxell XL-II',
    templateId: 'mixtape-tdk-maxell',
    project: {
      version: '1.0',
      albumTitle: 'NOCTURNO FM • CARRETERA NACIONAL 1985',
      albumArtist: 'REC. EN NAKAMICHI BX-300 (CINTA VIRGEN)',
      subtitleOrSeries: 'SUPER AVILYN HIGH BIAS CrO2',
      catalogNumber: 'INDEX NO. 04-85',
      recordLabel: 'TDK SA-90 / MAXELL XL-II',
      releaseYear: '1985',
      countryText: 'HOME TAPING ARCHIVE • HIGH PRECISION MECHANISM MADE IN JAPAN',
      legalText:
        'LEVEL CALIBRATION: +3dB PEAK • BIAS: HIGH (TYPE II CrO2) • EQ: 70µs • NOISE REDUCTION: DOLBY C-NR IN.',
      linerNotes:
        'Grabado en directo desde vinilos originales con plato Technics SL-1200MK2 (cápsula Stanton 681EEE) a pletina Nakamichi BX-300. Ajuste fino de Bias y nivel de pico a +3dB VU.',
      productionCredits: 'Selección y Mezcla Manual • Fecha de Grabación: 14 Nov 1985',
      coverUrl: getPresetCoverSvgDataUrl('mixtape-tdk-maxell'),
      coverFraming: { zoom: 1, panX: 0, panY: 0, filter: 'none' },
      templateId: 'mixtape-tdk-maxell',
      foldFormat: 'j-plus-1',
      tapeCapacity: 'C-90',
      paperStock: 'off-white',
      accentColor: '#B89241',
      secondaryColor: '#1E3A8A',
      typography: 'typewriter-mono',
      dolbySystem: 'C-NR',
      tapeBias: 'CrO2 (Type II) 70µs',
      stereoText: 'HIGH POSITION (TYPE II) • 70µs EQ',
      showCropMarks: true,
      showDimensionGuides: true,
      tracks: [
        { id: 'mx1', title: 'Age of Consent', artist: 'New Order', durationSec: 315, side: 'A' },
        { id: 'mx2', title: 'Pale Shelter', artist: 'Tears for Fears', durationSec: 274, side: 'A' },
        { id: 'mx3', title: 'A Forest (12" Mix)', artist: 'The Cure', durationSec: 355, side: 'A' },
        { id: 'mx4', title: 'Everything Counts', artist: 'Depeche Mode', durationSec: 258, side: 'A' },
        { id: 'mx5', title: 'More Than This', artist: 'Roxy Music', durationSec: 270, side: 'A' },
        { id: 'mx6', title: 'Such a Shame', artist: 'Talk Talk', durationSec: 342, side: 'B' },
        { id: 'mx7', title: 'Enola Gay', artist: 'OMD', durationSec: 213, side: 'B' },
        { id: 'mx8', title: 'Vienna', artist: 'Ultravox', durationSec: 294, side: 'B' },
        { id: 'mx9', title: 'Only You', artist: 'Yazoo', durationSec: 194, side: 'B' },
        { id: 'mx10', title: 'New Gold Dream (81-82-83-84)', artist: 'Simple Minds', durationSec: 339, side: 'B' },
      ],
    },
  },
];
