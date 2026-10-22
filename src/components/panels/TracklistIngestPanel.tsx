import React, { useState, useRef } from 'react';
import {
  Music,
  FileText,
  ListMusic,
  AlertTriangle,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  CheckCircle2,
  KeyRound,
  Download,
} from 'lucide-react';
import {
  CassetteProject,
  TAPE_CAPACITIES,
  TapeCapacity,
  Track,
} from '../../types/cassette';
import {
  balanceTracksMixtapeOptimal,
  balanceTracksSequential,
  computeSideStats,
  formatDuration,
  parseDuration,
} from '../../utils/timeAndBalance';
import { parseM3UContent, SAMPLE_M3U8_CONTENT } from '../../utils/m3uParser';
import {
  fetchSpotifyMetadata,
  SPOTIFY_HISTORICAL_PRESETS,
} from '../../utils/spotifyConnector';

interface TracklistIngestPanelProps {
  project: CassetteProject;
  onChangeProject: (updater: (prev: CassetteProject) => CassetteProject) => void;
}

type IngestTab = 'manual' | 'spotify' | 'm3u';

export const TracklistIngestPanel: React.FC<TracklistIngestPanelProps> = ({
  project,
  onChangeProject,
}) => {
  const [activeTab, setActiveTab] = useState<IngestTab>('manual');
  const [spotifyUrl, setSpotifyUrl] = useState<string>(
    'https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv'
  );
  const [showSpotifyCreds, setShowSpotifyCreds] = useState<boolean>(false);
  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [isLoadingSpotify, setIsLoadingSpotify] = useState<boolean>(false);
  const [ingestMessage, setIngestMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [m3uRawText, setM3uRawText] = useState<string>(SAMPLE_M3U8_CONTENT);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const m3uFileInputRef = useRef<HTMLInputElement | null>(null);

  const stats = computeSideStats(project.tracks, project.tapeCapacity);

  const handleSpotifyFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotifyUrl.trim()) return;
    setIsLoadingSpotify(true);
    setIngestMessage(null);

    try {
      const result = await fetchSpotifyMetadata(spotifyUrl, {
        clientId,
        clientSecret,
        accessToken,
      });

      onChangeProject((prev) => ({
        ...prev,
        albumTitle: result.title,
        albumArtist: result.artist,
        releaseYear: result.releaseYear || prev.releaseYear,
        recordLabel: result.label || prev.recordLabel,
        coverUrl: result.coverUrl || prev.coverUrl,
        customBgColor: result.customBgColor ?? prev.customBgColor,
        customTextColor: result.customTextColor ?? prev.customTextColor,
        showQrCode: result.qrCodeUrl ? true : prev.showQrCode,
        qrCodeUrl: result.qrCodeUrl ?? prev.qrCodeUrl,
        showBarcode: result.barcodeNumber ? true : prev.showBarcode,
        barcodeNumber: result.barcodeNumber ?? prev.barcodeNumber,
        companyLogo: result.companyLogo ?? prev.companyLogo,
        fullBleedFront: result.fullBleedFront ?? prev.fullBleedFront,
        tracks: result.tracks.length > 0 ? result.tracks : prev.tracks,
      }));

      setIngestMessage({
        type: 'success',
        text: `Cargado "${result.title}" (${result.tracks.length} pistas).`,
      });
    } catch (err: unknown) {
      setIngestMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al conectar con Spotify.',
      });
    } finally {
      setIsLoadingSpotify(false);
    }
  };

  const handleM3uFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setM3uRawText(content);
      const parsed = parseM3UContent(content, project.albumArtist);
      if (parsed.tracks.length > 0) {
        onChangeProject((prev) => ({
          ...prev,
          albumTitle: parsed.playlistTitle ? parsed.playlistTitle.toUpperCase() : prev.albumTitle,
          albumArtist: parsed.playlistArtist
            ? parsed.playlistArtist.toUpperCase()
            : prev.albumArtist,
          tracks: parsed.tracks,
        }));
        setIngestMessage({
          type: 'success',
          text: `"${file.name}" importado (${parsed.tracks.length} pistas).`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleParseM3uTextarea = () => {
    const parsed = parseM3UContent(m3uRawText, project.albumArtist);
    if (parsed.tracks.length > 0) {
      onChangeProject((prev) => ({
        ...prev,
        albumTitle: parsed.playlistTitle ? parsed.playlistTitle.toUpperCase() : prev.albumTitle,
        albumArtist: parsed.playlistArtist
          ? parsed.playlistArtist.toUpperCase()
          : prev.albumArtist,
        tracks: parsed.tracks,
      }));
      setIngestMessage({
        type: 'success',
        text: `Lista M3U cargada (${parsed.tracks.length} pistas).`,
      });
    }
  };

  const handleExportCurrentAsM3u8 = () => {
    const lines = [
      '#EXTM3U',
      `#PLAYLIST:${project.albumTitle}`,
      `#EXTART:${project.albumArtist}`,
      ...project.tracks.flatMap((t, idx) => [
        `#EXTINF:${t.durationSec},${t.artist} - ${t.title}`,
        `${String(idx + 1).padStart(2, '0')} - ${t.artist} - ${t.title}.flac`,
      ]),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.albumTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.m3u8`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTrackUpdate = (id: string, field: keyof Track, value: string | number) => {
    onChangeProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  };

  const handleAddTrack = (side: 'A' | 'B' = 'B') => {
    const newTrack: Track = {
      id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `Pista ${project.tracks.length + 1}`,
      artist: project.albumArtist,
      durationSec: 210,
      side,
    };
    onChangeProject((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));
  };

  const handleDeleteTrack = (id: string) => {
    onChangeProject((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((t) => t.id !== id),
    }));
  };

  const handleDragStart = (idx: number) => setDraggedIndex(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === idx) return;
    onChangeProject((prev) => {
      const next = [...prev.tracks];
      const [draggedItem] = next.splice(draggedIndex, 1);
      next.splice(idx, 0, draggedItem);
      return { ...prev, tracks: next };
    });
    setDraggedIndex(idx);
  };

  return (
    <div className="space-y-5">
      {/* Clean Source Switcher */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-stone-200/70 dark:bg-zinc-900/80 rounded-lg border border-stone-200 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition ${
            activeTab === 'manual'
              ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm'
              : 'text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-300'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          Manual
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('spotify')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition ${
            activeTab === 'spotify'
              ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-300'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          Spotify
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('m3u')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition ${
            activeTab === 'm3u'
              ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          .M3U8
        </button>
      </div>

      {ingestMessage && (
        <div
          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${
            ingestMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {ingestMessage.text}
          </span>
          <button
            type="button"
            onClick={() => setIngestMessage(null)}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* SPOTIFY TAB */}
      {activeTab === 'spotify' && (
        <div className="space-y-3 p-3 rounded-lg bg-white/80 dark:bg-zinc-900/40 border border-stone-200 dark:border-zinc-800/80">
          <form onSubmit={handleSpotifyFetch} className="space-y-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/album/..."
                className="flex-1 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isLoadingSpotify}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                {isLoadingSpotify ? '...' : 'Importar'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowSpotifyCreds((v) => !v)}
              className="text-[10px] text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-300 flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              {showSpotifyCreds ? 'Ocultar credenciales API' : 'Usar Client ID / Token propio (opcional)'}
            </button>
            {showSpotifyCreds && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Client ID"
                  className="bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded px-2 py-1 text-[11px] text-stone-800 dark:text-zinc-200"
                />
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Client Secret"
                  className="bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded px-2 py-1 text-[11px] text-stone-800 dark:text-zinc-200"
                />
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="O Bearer Token directo"
                  className="col-span-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded px-2 py-1 text-[11px] text-stone-800 dark:text-zinc-200"
                />
              </div>
            )}
          </form>

          <div className="space-y-1 pt-2 border-t border-stone-200 dark:border-zinc-800/60">
            <span className="text-[10px] font-mono uppercase text-stone-400 dark:text-zinc-500">
              Ejemplos de Época
            </span>
            <div className="grid grid-cols-1 gap-1">
              {SPOTIFY_HISTORICAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSpotifyUrl(preset.spotifyUrl);
                    onChangeProject(() => structuredClone(preset.project));
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded bg-stone-100/80 dark:bg-zinc-900/60 hover:bg-stone-200/80 dark:hover:bg-zinc-800/80 text-left text-xs transition"
                >
                  <span className="text-stone-700 dark:text-zinc-300 truncate">
                    {preset.project.albumTitle}
                  </span>
                  <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-500 shrink-0 ml-2">
                    {preset.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* M3U TAB */}
      {activeTab === 'm3u' && (
        <div className="space-y-2.5 p-3 rounded-lg bg-white/80 dark:bg-zinc-900/40 border border-stone-200 dark:border-zinc-800/80">
          <input
            ref={m3uFileInputRef}
            type="file"
            accept=".m3u,.m3u8,text/plain"
            onChange={handleM3uFileUpload}
            className="hidden"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => m3uFileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-lg bg-stone-200/80 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-xs text-stone-800 dark:text-zinc-200 font-medium flex items-center justify-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              Abrir archivo .M3U / .M3U8
            </button>
            <button
              type="button"
              onClick={handleExportCurrentAsM3u8}
              className="py-2 px-2.5 rounded-lg bg-stone-100 dark:bg-zinc-900 hover:bg-stone-200 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-xs text-stone-600 dark:text-zinc-400 flex items-center gap-1"
              title="Exportar lista actual a .M3U8"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            value={m3uRawText}
            onChange={(e) => setM3uRawText(e.target.value)}
            rows={4}
            className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg p-2 text-[11px] font-mono text-stone-700 dark:text-zinc-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleParseM3uTextarea}
            className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition"
          >
            Cargar Pistas del Texto M3U
          </button>
        </div>
      )}

      {/* BALANCEO DE CARAS A / B */}
      <div className="p-3 rounded-lg bg-white/80 dark:bg-zinc-900/40 border border-stone-200 dark:border-zinc-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            Duración por Cara
          </span>
          <select
            value={project.tapeCapacity}
            onChange={(e) =>
              onChangeProject((prev) => ({
                ...prev,
                tapeCapacity: e.target.value as TapeCapacity,
              }))
            }
            className="bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded px-2 py-0.5 text-[11px] font-mono text-amber-600 dark:text-amber-400 focus:outline-none"
          >
            {(Object.keys(TAPE_CAPACITIES) as TapeCapacity[]).map((cap) => (
              <option key={cap} value={cap}>
                {TAPE_CAPACITIES[cap].label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-stone-500 dark:text-zinc-400">Cara A</span>
              <span
                className={`font-mono ${
                  stats.isSideAOver
                    ? 'text-red-500 font-bold'
                    : 'text-stone-800 dark:text-zinc-200'
                }`}
              >
                {formatDuration(stats.sideASec)} / {formatDuration(stats.maxSideSec)}
              </span>
            </div>
            <div className="h-1.5 bg-stone-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${stats.isSideAOver ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, stats.sideAUtilizationPct)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-stone-500 dark:text-zinc-400">Cara B</span>
              <span
                className={`font-mono ${
                  stats.isSideBOver
                    ? 'text-red-500 font-bold'
                    : 'text-stone-800 dark:text-zinc-200'
                }`}
              >
                {formatDuration(stats.sideBSec)} / {formatDuration(stats.maxSideSec)}
              </span>
            </div>
            <div className="h-1.5 bg-stone-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${stats.isSideBOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, stats.sideBUtilizationPct)}%` }}
              />
            </div>
          </div>
        </div>

        {(stats.isSideAOver || stats.isSideBOver) && (
          <div className="flex items-center gap-2 text-[11px] text-red-600 dark:text-red-300 pt-0.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>
              Supera {project.tapeCapacity}. Sugerido:{' '}
              <button
                type="button"
                onClick={() =>
                  onChangeProject((prev) => ({ ...prev, tapeCapacity: stats.recommendedTape }))
                }
                className="underline font-semibold text-amber-600 dark:text-amber-300"
              >
                {stats.recommendedTape}
              </button>
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
            Δ {formatDuration(stats.diffSec)}
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() =>
                onChangeProject((prev) => ({
                  ...prev,
                  tracks: balanceTracksSequential(prev.tracks),
                }))
              }
              className="px-2 py-1 rounded bg-stone-200/80 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 text-[11px] transition"
            >
              Auto-Dividir A/B
            </button>
            <button
              type="button"
              onClick={() =>
                onChangeProject((prev) => ({
                  ...prev,
                  tracks: balanceTracksMixtapeOptimal(prev.tracks),
                }))
              }
              className="px-2 py-1 rounded bg-stone-200/80 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-[11px] transition"
            >
              Mixtape 50/50
            </button>
          </div>
        </div>
      </div>

      {/* CLEAN TRACKLIST TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            Pistas ({project.tracks.length})
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleAddTrack('A')}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-zinc-300 text-[11px]"
            >
              <Plus className="w-3 h-3 text-amber-500" /> Cara A
            </button>
            <button
              type="button"
              onClick={() => handleAddTrack('B')}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-zinc-300 text-[11px]"
            >
              <Plus className="w-3 h-3 text-emerald-500" /> Cara B
            </button>
          </div>
        </div>

        <div className="divide-y divide-stone-200/70 dark:divide-zinc-800/50 border border-stone-200 dark:border-zinc-800/80 rounded-lg bg-white/70 dark:bg-zinc-900/30 max-h-[380px] overflow-y-auto">
          {project.tracks.map((track, idx) => {
            const sideIndex = project.tracks
              .slice(0, idx + 1)
              .filter((t) => t.side === track.side).length;

            return (
              <div
                key={track.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={() => setDraggedIndex(null)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs hover:bg-stone-100 dark:hover:bg-zinc-900/80 transition"
              >
                <GripVertical className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-600 cursor-grab shrink-0" />

                <button
                  type="button"
                  onClick={() =>
                    handleTrackUpdate(track.id, 'side', track.side === 'A' ? 'B' : 'A')
                  }
                  className={`w-8 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                    track.side === 'A'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  }`}
                  title="Cambiar cara A/B"
                >
                  {track.side}
                  {sideIndex}
                </button>

                <input
                  type="text"
                  value={track.title}
                  onChange={(e) => handleTrackUpdate(track.id, 'title', e.target.value)}
                  className="flex-1 min-w-0 bg-transparent border-b border-transparent focus:border-stone-400 dark:focus:border-zinc-700 px-1 py-0.5 text-xs text-stone-800 dark:text-zinc-200 focus:outline-none truncate"
                  placeholder="Título"
                />

                <input
                  type="text"
                  defaultValue={formatDuration(track.durationSec)}
                  key={`${track.id}-${track.durationSec}`}
                  onBlur={(e) => {
                    const sec = parseDuration(e.target.value);
                    if (sec > 0) handleTrackUpdate(track.id, 'durationSec', sec);
                    else e.target.value = formatDuration(track.durationSec);
                  }}
                  className="w-12 bg-transparent text-right font-mono text-[11px] text-stone-500 dark:text-zinc-400 focus:text-stone-900 dark:focus:text-zinc-100 focus:outline-none shrink-0"
                />

                <button
                  type="button"
                  onClick={() => handleDeleteTrack(track.id)}
                  className="p-1 text-stone-400 dark:text-zinc-600 hover:text-red-500 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
