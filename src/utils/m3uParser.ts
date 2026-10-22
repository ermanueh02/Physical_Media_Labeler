import { Track } from '../types/cassette';
import { balanceTracksSequential } from './timeAndBalance';

export interface ParsedM3UResult {
  playlistTitle?: string;
  playlistArtist?: string;
  tracks: Track[];
}

/**
 * Parses standard (.m3u) and extended (.m3u8) playlist files.
 * Supports #EXTM3U, #PLAYLIST:, #EXTART:, #EXTALB:, and #EXTINF:<duration>,<Artist> - <Title>
 */
export function parseM3UContent(content: string, defaultArtist = 'Varios Artistas'): ParsedM3UResult {
  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let playlistTitle: string | undefined;
  let playlistArtist: string | undefined;
  const rawTracks: Omit<Track, 'side'>[] = [];

  let pendingDuration: number | null = null;
  let pendingArtist: string | null = null;
  let pendingTitle: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.toUpperCase().startsWith('#EXTM3U')) {
      continue;
    }

    if (line.toUpperCase().startsWith('#PLAYLIST:')) {
      playlistTitle = line.slice(10).trim();
      continue;
    }

    if (line.toUpperCase().startsWith('#EXTALB:')) {
      if (!playlistTitle) playlistTitle = line.slice(8).trim();
      continue;
    }

    if (line.toUpperCase().startsWith('#EXTART:')) {
      playlistArtist = line.slice(8).trim();
      continue;
    }

    if (line.toUpperCase().startsWith('#EXTINF:')) {
      const infBody = line.slice(8).trim();
      // Format: #EXTINF:245,Artist - Title  OR  #EXTINF:245.4 title="...",Artist - Title
      const commaIdx = infBody.indexOf(',');
      if (commaIdx !== -1) {
        const metaPart = infBody.slice(0, commaIdx).trim();
        const displayPart = infBody.slice(commaIdx + 1).trim();

        const durMatch = metaPart.match(/^(-?\d+(?:\.\d+)?)/);
        const parsedSec = durMatch ? Math.round(parseFloat(durMatch[1])) : 0;
        pendingDuration = parsedSec > 0 ? parsedSec : 180;

        const splitMatch = displayPart.split(/\s+(?:[-–—])\s+/);
        if (splitMatch.length >= 2) {
          pendingArtist = splitMatch[0].trim();
          pendingTitle = splitMatch.slice(1).join(' - ').trim();
        } else {
          pendingArtist = playlistArtist || defaultArtist;
          pendingTitle = displayPart || `Pista ${rawTracks.length + 1}`;
        }
      }
      continue;
    }

    if (line.startsWith('#')) {
      // Other comment or directive
      continue;
    }

    // It's a file path or stream URL line
    if (pendingTitle !== null) {
      rawTracks.push({
        id: `m3u-${Date.now()}-${rawTracks.length}`,
        title: pendingTitle,
        artist: pendingArtist || playlistArtist || defaultArtist,
        durationSec: pendingDuration !== null ? pendingDuration : 210,
      });
      pendingDuration = null;
      pendingArtist = null;
      pendingTitle = null;
    } else {
      // Standard M3U without #EXTINF: infer from filename
      const fileName = line
        .split(/[/\\]/)
        .pop()
        ?.replace(/\.[a-zA-Z0-9]{2,4}$/, '') || line;
      const cleaned = fileName.replace(/^\d+[\s._-]*/, '');
      const parts = cleaned.split(/\s+(?:[-–—])\s+/);
      const artist = parts.length >= 2 ? parts[0].trim() : playlistArtist || defaultArtist;
      const title = parts.length >= 2 ? parts.slice(1).join(' - ').trim() : cleaned.trim();

      rawTracks.push({
        id: `m3u-${Date.now()}-${rawTracks.length}`,
        title: title || `Pista ${rawTracks.length + 1}`,
        artist,
        durationSec: 210,
      });
    }
  }

  // Handle trailing #EXTINF without path at end of file
  if (pendingTitle !== null) {
    rawTracks.push({
      id: `m3u-${Date.now()}-${rawTracks.length}`,
      title: pendingTitle,
      artist: pendingArtist || playlistArtist || defaultArtist,
      durationSec: pendingDuration !== null ? pendingDuration : 210,
    });
  }

  const initialTracks: Track[] = rawTracks.map((t) => ({
    ...t,
    side: 'A',
  }));

  return {
    playlistTitle,
    playlistArtist,
    tracks: balanceTracksSequential(initialTracks),
  };
}

export const SAMPLE_M3U8_CONTENT = `#EXTM3U
#PLAYLIST:MAXELL XL-II S90 - NOCTURNO ANALÓGICO 1983
#EXTART:Varios Artistas
#EXTINF:246,New Order - Age of Consent
01 - New Order - Age of Consent.flac
#EXTINF:298,Tears for Fears - Pale Shelter
02 - Tears for Fears - Pale Shelter.flac
#EXTINF:215,The Cure - A Forest (Short Version)
03 - The Cure - A Forest.flac
#EXTINF:258,Depeche Mode - Everything Counts
04 - Depeche Mode - Everything Counts.flac
#EXTINF:274,Roxy Music - More Than This
05 - Roxy Music - More Than This.flac
#EXTINF:234,Talk Talk - Such a Shame
06 - Talk Talk - Such a Shame.flac
#EXTINF:262,Orchestral Manoeuvres in the Dark - Enola Gay
07 - OMD - Enola Gay.flac
#EXTINF:288,Ultravox - Vienna
08 - Ultravox - Vienna.flac
#EXTINF:229,Yazoo - Only You
09 - Yazoo - Only You.flac
#EXTINF:312,Simple Minds - New Gold Dream (81-82-83-84)
10 - Simple Minds - New Gold Dream.flac
`;
