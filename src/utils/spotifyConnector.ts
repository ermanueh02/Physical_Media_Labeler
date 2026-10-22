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
  sourceMode: 'spotify-web-api' | 'spotify-embed-proxy' | 'catalog-preset' | 'vhs-texs-url';
  customBgColor?: string;
  customTextColor?: string;
  qrCodeUrl?: string;
  barcodeNumber?: string;
  companyLogo?: 'arista' | 'cbs' | 'emi' | 'warner' | 'dg' | 'tdk' | 'maxell' | 'sony' | 'virgin';
  dolbyEnabled?: boolean;
  fullBleedFront?: boolean;
}

/**
 * Parses a vhs.texs.org J-Card URL (e.g. https://vhs.texs.org/es/jcard?id=sp.17JFRRZhRXA3Zm5wsOl4Cl&musicAlbum=Autumn+Tape+II&bg=fcd8b7&musicA=...)
 */
export function parseVhsTexsJCardUrl(input: string): SpotifyExtractedData | null {
  try {
    if (!input.includes('vhs.texs.org') && !input.includes('musicA=')) return null;
    const urlObj = new URL(input.trim());
    const params = urlObj.searchParams;

    const parseSidePipeString = (raw: string | null, side: 'A' | 'B'): Track[] => {
      if (!raw) return [];
      return raw
        .split('|')
        .map((item, idx) => {
          const clean = item.trim();
          if (!clean) return null;
          // Match "Title - Artist (m:ss)"
          const durMatch = clean.match(/\((\d+):(\d{2})\)\s*$/);
          let durationSec = 210;
          let withoutDur = clean;
          if (durMatch) {
            durationSec = parseInt(durMatch[1], 10) * 60 + parseInt(durMatch[2], 10);
            withoutDur = clean.slice(0, durMatch.index).trim();
          }
          const lastDash = withoutDur.lastIndexOf(' - ');
          const title = lastDash > 0 ? withoutDur.slice(0, lastDash).trim() : withoutDur;
          const artist = lastDash > 0 ? withoutDur.slice(lastDash + 3).trim() : '';
          return {
            id: `texs-${side}-${idx}`,
            title,
            artist,
            durationSec,
            side,
          };
        })
        .filter((t): t is Track => t !== null);
    };

    const sideA = parseSidePipeString(params.get('musicA'), 'A');
    const sideB = parseSidePipeString(params.get('musicB'), 'B');
    const allTracks = [...sideA, ...sideB];
    if (allTracks.length === 0) return null;

    const bgParam = params.get('bg');
    const colorParam = params.get('color');
    const clParam = (params.get('cl') || '').toLowerCase();
    const companyLogo = clParam.includes('arista')
      ? 'arista'
      : clParam.includes('cbs')
      ? 'cbs'
      : clParam.includes('emi')
      ? 'emi'
      : clParam.includes('warner')
      ? 'warner'
      : clParam.includes('tdk')
      ? 'tdk'
      : undefined;

    return {
      title: params.get('musicAlbum') || 'Autumn Tape II',
      artist: params.get('musicArtist') || 'er_manueh02',
      releaseYear: new Date().getFullYear().toString(),
      coverUrl: getPresetCoverSvgDataUrl('full-bleed-art'),
      label: companyLogo ? companyLogo.toUpperCase() : 'ARISTA',
      tracks: allTracks,
      sourceMode: 'vhs-texs-url',
      customBgColor: bgParam ? `#${bgParam.replace(/^#/, '')}` : '#FCD8B7',
      customTextColor: colorParam ? `#${colorParam.replace(/^#/, '')}` : '#000000',
      qrCodeUrl: params.get('playlistUrl') || undefined,
      barcodeNumber: params.get('cid') || undefined,
      companyLogo,
      dolbyEnabled: params.get('ds') === '1',
      fullBleedFront: true,
    };
  } catch {
    return null;
  }
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
  // 0. Check if the user pasted a vhs.texs.org J-Card URL
  const texsParsed = parseVhsTexsJCardUrl(urlOrUri);
  if (texsParsed) {
    return texsParsed;
  }

  const parsed = parseSpotifyUrl(urlOrUri);
  if (!parsed) {
    throw new Error(
      'Enlace no válido. Pega un enlace de Spotify (álbum/playlist) o un enlace de vhs.texs.org/es/jcard.'
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
    id: 'awesome-mix-vol-1-2',
    spotifyId: '37i9dQZF1DX8C5858AwesomeMix',
    spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX8C5858AwesomeMix',
    badge: 'Awesome Mix Vol. 1 • Star-Lord',
    templateId: 'awesome-mix-quill',
    project: {
      version: '1.0',
      mediaFormat: 'cassette',
      albumTitle: 'AWESOME MIX VOL. 1',
      albumArtist: 'GUARDIANS OF THE GALAXY',
      subtitleOrSeries: 'ORIGINAL MOTION PICTURE SOUNDTRACK',
      catalogNumber: 'D002112804',
      recordLabel: 'MARVEL / HOLLYWOOD RECORDS',
      releaseYear: '2014',
      countryText: 'HOLLYWOOD RECORDS, 500 S. BUENA VISTA ST., BURBANK, CA 91521',
      legalText: '© 2014 MARVEL THIS COMPILATION ℗ 2014 MARVEL MUSIC, INC.',
      linerNotes:
        'Réplica exacta de la cinta Awesome Mix Vol. 1 de Peter Quill (Star-Lord) con las 12 canciones originales manuscritas por Meredith Quill.',
      productionCredits: 'Grabado en cassette TDK • Reproducido en Sony Walkman TPS-L2',
      coverUrl: getPresetCoverSvgDataUrl('awesome-mix-quill'),
      coverFraming: { zoom: 1, panX: 0, panY: 0, filter: 'none' },
      templateId: 'awesome-mix-quill',
      foldFormat: 'j-plus-1',
      tapeCapacity: 'C-60',
      paperStock: 'aged-ivory',
      accentColor: '#D43B30',
      secondaryColor: '#24477F',
      typography: 'handwritten-pen',
      dolbySystem: 'NONE',
      tapeBias: 'Normal (Fe2O3) 120µs',
      stereoText: 'ORIGINAL MOTION PICTURE SOUNDTRACK',
      barcodeNumber: '050087316792',
      showBarcode: true,
      fullBleedFront: false,
      showCropMarks: true,
      showDimensionGuides: true,
      tracks: [
        { id: 'am1', title: 'Hooked on a Feeling', artist: 'Blue Swede', durationSec: 172, side: 'A' },
        { id: 'am2', title: 'Go All the Way', artist: 'Raspberries', durationSec: 201, side: 'A' },
        { id: 'am3', title: 'Spirit in the Sky', artist: 'Norman Greenbaum', durationSec: 242, side: 'A' },
        { id: 'am4', title: 'Moonage Daydream', artist: 'David Bowie', durationSec: 279, side: 'A' },
        { id: 'am5', title: 'Fooled Around and Fell in Love', artist: 'Elvin Bishop', durationSec: 276, side: 'A' },
        { id: 'am6', title: 'I Want You Back', artist: 'Jackson 5', durationSec: 178, side: 'A' },
        { id: 'am7', title: "I'm Not in Love", artist: '10cc', durationSec: 367, side: 'B' },
        { id: 'am8', title: 'Come and Get Your Love', artist: 'Redbone', durationSec: 206, side: 'B' },
        { id: 'am9', title: 'Cherry Bomb', artist: 'The Runaways', durationSec: 138, side: 'B' },
        { id: 'am10', title: 'Escape (The Piña Colada Song)', artist: 'Rupert Holmes', durationSec: 277, side: 'B' },
        { id: 'am11', title: 'O-o-h Child', artist: 'The Five Stairsteps', durationSec: 194, side: 'B' },
        { id: 'am12', title: "Ain't No Mountain High Enough", artist: 'Marvin Gaye and Tammi Terrell', durationSec: 149, side: 'B' },
      ],
    },
  },
  {
    id: 'vhs-texs-autumn-tape-ii',
    spotifyId: '17JFRRZhRXA3Zm5wsOl4Cl',
    spotifyUrl: 'https://open.spotify.com/playlist/17JFRRZhRXA3Zm5wsOl4Cl',
    badge: 'Autumn Tape II 🍂 (Full-Bleed)',
    templateId: 'full-bleed-art',
    project: {
      version: '1.0',
      mediaFormat: 'cassette',
      albumTitle: 'Autumn Tape II',
      albumArtist: 'er_manueh02',
      subtitleOrSeries: 'AUTUMN MIXTAPE • ARISTA STEREO',
      catalogNumber: '878727472725',
      recordLabel: 'ARISTA',
      releaseYear: '2026',
      countryText: 'ARISTA RECORDS • SPOTIFY ANALOGUE EDITION',
      legalText: 'DOLBY SYSTEM • FULL-BLEED EDITION • QR LINKED',
      linerNotes:
        'Selección otoñal de 22 pistas en Cara A y Cara B: Jethro Tull, George Harrison, Neil Young, Fleetwood Mac, Simon & Garfunkel, Genesis, Cocteau Twins, The Beatles, Supertramp y más.',
      productionCredits: 'Curated by er_manueh02 • Autumn Tape II 🍂',
      coverUrl: getPresetCoverSvgDataUrl('full-bleed-art'),
      coverFraming: { zoom: 1, panX: 0, panY: 0, filter: 'none' },
      templateId: 'full-bleed-art',
      foldFormat: 'j-plus-1',
      tapeCapacity: 'C-90',
      paperStock: 'off-white',
      customBgColor: '#FCD8B7',
      customTextColor: '#000000',
      accentColor: '#18181B',
      secondaryColor: '#FCD8B7',
      typography: 'helvetica-univers',
      dolbySystem: 'B-NR',
      tapeBias: 'Normal (Fe2O3) 120µs',
      stereoText: 'DOLBY SYSTEM • STEREO',
      fullBleedFront: true,
      fullBleedShowOverlayText: true,
      showQrCode: true,
      qrCodeUrl: 'https://open.spotify.com/playlist/17JFRRZhRXA3Zm5wsOl4Cl',
      showBarcode: true,
      barcodeNumber: '878727472725',
      companyLogo: 'arista',
      showCropMarks: true,
      showDimensionGuides: true,
      tracks: [
        { id: 'vt-a1', title: 'Songs from the Wood', artist: 'Jethro Tull', durationSec: 293, side: 'A' },
        { id: 'vt-a2', title: "I'd Have You Anytime", artist: 'George Harrison', durationSec: 177, side: 'A' },
        { id: 'vt-a3', title: 'Harvest Moon', artist: 'Neil Young', durationSec: 303, side: 'A' },
        { id: 'vt-a4', title: 'Landslide', artist: 'Fleetwood Mac', durationSec: 199, side: 'A' },
        { id: 'vt-a5', title: 'April Come She Will', artist: 'Simon & Garfunkel', durationSec: 112, side: 'A' },
        { id: 'vt-a6', title: 'Fireside Song', artist: 'Genesis', durationSec: 208, side: 'A' },
        { id: 'vt-a7', title: 'Heaven or Las Vegas', artist: 'Cocteau Twins', durationSec: 298, side: 'A' },
        { id: 'vt-a8', title: 'The Only Living Boy in New York', artist: 'Simon & Garfunkel', durationSec: 241, side: 'A' },
        { id: 'vt-a9', title: 'I Cheat the Hangman', artist: 'The Doobie Brothers', durationSec: 396, side: 'A' },
        { id: 'vt-a10', title: 'On Horseback', artist: 'Mike Oldfield', durationSec: 205, side: 'A' },
        { id: 'vt-a11', title: 'Twin Peaks Theme', artist: 'Angelo Badalamenti', durationSec: 310, side: 'A' },
        { id: 'vt-b1', title: 'Ballad of Sir Frankie Crisp (Let It Roll)', artist: 'George Harrison', durationSec: 228, side: 'B' },
        { id: 'vt-b2', title: 'Norwegian Wood (This Bird Has Flown)', artist: 'The Beatles', durationSec: 124, side: 'B' },
        { id: 'vt-b3', title: 'Sister Moonshine', artist: 'Supertramp', durationSec: 316, side: 'B' },
        { id: 'vt-b4', title: 'Sara (Single Edit)', artist: 'Fleetwood Mac', durationSec: 275, side: 'B' },
        { id: 'vt-b5', title: 'Coming Around Again', artist: 'Carly Simon', durationSec: 218, side: 'B' },
        { id: 'vt-b6', title: 'Take My Hand', artist: 'Matt Berry', durationSec: 190, side: 'B' },
        { id: 'vt-b7', title: 'MacArthur Park', artist: 'Richard Harris', durationSec: 450, side: 'B' },
        { id: 'vt-b8', title: 'Bridge Over Troubled Water', artist: 'Simon & Garfunkel', durationSec: 296, side: 'B' },
        { id: 'vt-b9', title: 'Unquiet Slumbers for the Sleepers... - 2007 Remaster', artist: 'Genesis', durationSec: 139, side: 'B' },
        { id: 'vt-b10', title: "...In That Quiet Earth'", artist: 'Genesis', durationSec: 294, side: 'B' },
        { id: 'vt-b11', title: 'Afterglow', artist: 'Genesis', durationSec: 252, side: 'B' },
      ],
    },
  },
  {
    id: 'tdk-d-autumn-tape-ii',
    spotifyId: '7TDKDAutumnTapeII',
    spotifyUrl: 'https://open.spotify.com/playlist/7TDKDAutumnTapeII',
    badge: 'TDK D • Cinta Virgen',
    templateId: 'tdk-d-index',
    project: {
      version: '1.0',
      albumTitle: 'Autumn Tape II',
      albumArtist: '22 · 10 · 26',
      subtitleOrSeries: 'DYNAMIC CASSETTE • LOW NOISE HIGH OUTPUT',
      catalogNumber: 'D',
      recordLabel: 'TDK',
      releaseYear: '22 · 10 · 26',
      countryText: 'TDK ELECTRONICS CO., LTD. • TOKYO JAPAN',
      legalText: 'DYNAMIC CASSETTE • NORMAL BIAS EQ-120µs',
      linerNotes:
        'Grabación doméstica en cinta TDK D90 (Dynamic Cassette). Índice manuscrito a doble columna (Cara A / Cara B).',
      productionCredits: 'Grabado en cassette TDK D • Normal Bias 120µs',
      coverUrl: getPresetCoverSvgDataUrl('mixtape-tdk-maxell'),
      coverFraming: { zoom: 1, panX: 0, panY: 0, filter: 'none' },
      templateId: 'tdk-d-index',
      foldFormat: 'j-standard',
      tapeCapacity: 'C-90',
      paperStock: 'off-white',
      accentColor: '#18181B',
      secondaryColor: '#D6D5D0',
      typography: 'handwritten-pen',
      dolbySystem: 'NONE',
      tapeBias: 'Normal (Fe2O3) 120µs',
      stereoText: 'Normal Bias EQ-120µs',
      showCropMarks: true,
      showDimensionGuides: true,
      tracks: [
        { id: 'at1', title: 'Songs From The Wood', artist: 'Jethro Tull', durationSec: 292, side: 'A' },
        { id: 'at2', title: "I'd Have You Anytime", artist: 'George Harrison', durationSec: 176, side: 'A' },
        { id: 'at3', title: 'Harvest Moon', artist: 'Neil Young', durationSec: 303, side: 'A' },
        { id: 'at4', title: 'Landslide', artist: 'Fleetwood Mac', durationSec: 199, side: 'A' },
        { id: 'at5', title: 'April Come She Will', artist: 'Simon & Garfunkel', durationSec: 110, side: 'A' },
        { id: 'at6', title: 'Fireside Song', artist: 'Genesis', durationSec: 258, side: 'A' },
        { id: 'at7', title: 'Heaven Or Las Vegas', artist: 'Cocteau Twins', durationSec: 298, side: 'A' },
        { id: 'at8', title: 'The Only Living Boy in NY', artist: 'Simon & Garfunkel', durationSec: 238, side: 'A' },
        { id: 'at9', title: 'I Cheat The Hangman', artist: 'The Doobie Brothers', durationSec: 398, side: 'A' },
        { id: 'at10', title: 'On Horseback', artist: 'Mike Oldfield', durationSec: 203, side: 'A' },
        { id: 'at11', title: 'Twin Peaks Theme', artist: 'Angelo Badalamenti', durationSec: 304, side: 'A' },
        { id: 'bt1', title: 'Ballad of Sir Frankie Crisp', artist: 'George Harrison', durationSec: 228, side: 'B' },
        { id: 'bt2', title: 'Norwegian Wood', artist: 'The Beatles', durationSec: 125, side: 'B' },
        { id: 'bt3', title: 'Sister Moonshine', artist: 'Supertramp', durationSec: 315, side: 'B' },
        { id: 'bt4', title: 'Sara (Single Edit)', artist: 'Fleetwood Mac', durationSec: 278, side: 'B' },
        { id: 'bt5', title: 'Coming Around Again', artist: 'Carly Simon', durationSec: 219, side: 'B' },
        { id: 'bt6', title: 'Take My Hand', artist: 'Simple Minds', durationSec: 245, side: 'B' },
        { id: 'bt7', title: 'MacArthur Park', artist: 'Richard Harris', durationSec: 441, side: 'B' },
        { id: 'bt8', title: 'Bridge Over Troubled Water', artist: 'Simon & Garfunkel', durationSec: 295, side: 'B' },
        {
          id: 'bt9',
          title: 'Wind and Wuthering Suite:',
          artist: 'Genesis',
          durationSec: 210,
          side: 'B',
        },
        {
          id: 'bt10',
          title: "'Unquiet Slumbers for the",
          artist: 'Genesis',
          durationSec: 140,
          side: 'B',
        },
        {
          id: 'bt11',
          title: 'Sleepers... In That Quiet',
          artist: 'Genesis',
          durationSec: 165,
          side: 'B',
        },
        {
          id: 'bt12',
          title: "Earth' / Afterglow",
          artist: 'Genesis',
          durationSec: 251,
          side: 'B',
        },
      ],
    },
  },
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
