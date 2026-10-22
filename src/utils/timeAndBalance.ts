import { TapeCapacity, TAPE_CAPACITIES, Track } from '../types/cassette';

/**
 * Formats seconds into mm:ss (e.g., 245 -> "04:05")
 */
export function formatDuration(seconds: number): string {
  const safeSec = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Parses a "mm:ss" or "hh:mm:ss" or plain seconds string into seconds
 */
export function parseDuration(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;

  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  const parts = trimmed.split(':').map((p) => parseInt(p.trim(), 10));
  if (parts.some((n) => Number.isNaN(n) || n < 0)) {
    return 0;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export interface SideBalanceStats {
  sideATracks: Track[];
  sideBTracks: Track[];
  sideASec: number;
  sideBSec: number;
  totalSec: number;
  diffSec: number;
  maxSideSec: number;
  sideAUtilizationPct: number;
  sideBUtilizationPct: number;
  isSideAOver: boolean;
  isSideBOver: boolean;
  recommendedTape: TapeCapacity;
}

export function computeSideStats(tracks: Track[], tapeCapacity: TapeCapacity): SideBalanceStats {
  const sideATracks = tracks.filter((t) => t.side === 'A');
  const sideBTracks = tracks.filter((t) => t.side === 'B');

  const sideASec = sideATracks.reduce((acc, t) => acc + Math.max(0, t.durationSec), 0);
  const sideBSec = sideBTracks.reduce((acc, t) => acc + Math.max(0, t.durationSec), 0);
  const totalSec = sideASec + sideBSec;
  const diffSec = Math.abs(sideASec - sideBSec);

  const maxSideSec = TAPE_CAPACITIES[tapeCapacity].maxSideSec;
  const sideAUtilizationPct = maxSideSec > 0 ? (sideASec / maxSideSec) * 100 : 0;
  const sideBUtilizationPct = maxSideSec > 0 ? (sideBSec / maxSideSec) * 100 : 0;

  const isSideAOver = sideASec > maxSideSec;
  const isSideBOver = sideBSec > maxSideSec;

  const longestSide = Math.max(sideASec, sideBSec);
  let recommendedTape: TapeCapacity = 'C-46';
  if (longestSide > 45 * 60) {
    recommendedTape = 'C-100';
  } else if (longestSide > 30 * 60) {
    recommendedTape = 'C-90';
  } else if (longestSide > 23 * 60) {
    recommendedTape = 'C-60';
  }

  return {
    sideATracks,
    sideBTracks,
    sideASec,
    sideBSec,
    totalSec,
    diffSec,
    maxSideSec,
    sideAUtilizationPct,
    sideBUtilizationPct,
    isSideAOver,
    isSideBOver,
    recommendedTape,
  };
}

/**
 * Balances tracks between Side A and Side B preserving sequential album order.
 * Finds the split index k that minimizes |Duration(A) - Duration(B)|.
 */
export function balanceTracksSequential(tracks: Track[]): Track[] {
  if (tracks.length === 0) return [];
  if (tracks.length === 1) {
    return [{ ...tracks[0], side: 'A' }];
  }

  const total = tracks.reduce((sum, t) => sum + Math.max(0, t.durationSec), 0);
  let bestSplitIndex = 1;
  let bestDiff = Infinity;
  let runningA = 0;

  for (let i = 0; i < tracks.length; i++) {
    runningA += Math.max(0, tracks[i].durationSec);
    const remainingB = total - runningA;
    const diff = Math.abs(runningA - remainingB);

    // Slight preference for Side A >= Side B when difference is very close (standard cassette mastering)
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplitIndex = i + 1;
    }
  }

  return tracks.map((track, idx) => ({
    ...track,
    side: idx < bestSplitIndex ? 'A' : 'B',
  }));
}

/**
 * Balances tracks by reordering (Mixtape optimal partition) to achieve minimal time difference
 * between Side A and Side B.
 */
export function balanceTracksMixtapeOptimal(tracks: Track[]): Track[] {
  if (tracks.length <= 1) {
    return tracks.map((t) => ({ ...t, side: 'A' }));
  }

  const indexed = tracks.map((t, idx) => ({ track: t, idx }));
  indexed.sort((a, b) => b.track.durationSec - a.track.durationSec);

  const sideA: typeof indexed = [];
  const sideB: typeof indexed = [];
  let sumA = 0;
  let sumB = 0;

  for (const item of indexed) {
    if (sumA <= sumB) {
      sideA.push(item);
      sumA += Math.max(0, item.track.durationSec);
    } else {
      sideB.push(item);
      sumB += Math.max(0, item.track.durationSec);
    }
  }

  // Restore original relative order within each side
  sideA.sort((a, b) => a.idx - b.idx);
  sideB.sort((a, b) => a.idx - b.idx);

  return [
    ...sideA.map((item) => ({ ...item.track, side: 'A' as const })),
    ...sideB.map((item) => ({ ...item.track, side: 'B' as const })),
  ];
}
