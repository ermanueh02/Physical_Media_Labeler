import React, { useRef, useState } from 'react';
import {
  Image as ImageIcon,
  RotateCcw,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CassetteProject,
  CoverFilter,
  FoldFormat,
  HISTORICAL_TEMPLATES,
  PAPER_STOCKS,
  PaperStockId,
  TemplateMetadata,
  TypographyPreset,
} from '../../types/cassette';
import { getPresetCoverSvgDataUrl } from '../../utils/vintageArtwork';

interface EditorialStylePanelProps {
  project: CassetteProject;
  onChangeProject: (updater: (prev: CassetteProject) => CassetteProject) => void;
}

const VINTAGE_INK_SWATCHES = [
  { name: 'Rojo Teja CBS', hex: '#B83227' },
  { name: 'Ocre DG', hex: '#E5B822' },
  { name: 'Dorado Maxell', hex: '#B89241' },
  { name: 'Rojo Sire', hex: '#D9381E' },
  { name: 'Naranja BASF', hex: '#EA580C' },
  { name: 'Azul Blue Note', hex: '#0284C7' },
  { name: 'Carbón', hex: '#18181B' },
];

export const EditorialStylePanel: React.FC<EditorialStylePanelProps> = ({
  project,
  onChangeProject,
}) => {
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleSelectTemplate = (tpl: TemplateMetadata) => {
    onChangeProject((prev) => ({
      ...prev,
      templateId: tpl.id,
      paperStock: tpl.defaultPaper,
      accentColor: tpl.defaultAccent,
      secondaryColor: tpl.defaultSecondary,
      typography: tpl.defaultTypography,
      recordLabel: tpl.defaultLabel,
      catalogNumber: tpl.defaultCatalog,
      stereoText: tpl.defaultStereoText,
      coverUrl: prev.coverUrl.startsWith('data:image/svg+xml')
        ? getPresetCoverSvgDataUrl(tpl.id)
        : prev.coverUrl,
    }));
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeProject((prev) => ({
          ...prev,
          coverUrl: reader.result as string,
          coverFraming: { ...prev.coverFraming, zoom: 1, panX: 0, panY: 0 },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* 1. IDENTIDAD PRINCIPAL */}
      <section className="space-y-2.5">
        <div className="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-zinc-400">
          Identidad de la Cinta
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={project.albumTitle}
            onChange={(e) =>
              onChangeProject((prev) => ({ ...prev, albumTitle: e.target.value }))
            }
            placeholder="Título del álbum o cinta"
            className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm font-medium text-stone-900 dark:text-zinc-100 focus:outline-none transition"
          />
          <input
            type="text"
            value={project.albumArtist}
            onChange={(e) =>
              onChangeProject((prev) => ({ ...prev, albumArtist: e.target.value }))
            }
            placeholder="Artista o intérprete"
            className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-stone-700 dark:text-zinc-300 focus:outline-none transition"
          />
        </div>
      </section>

      {/* 2. PLANTILLAS HISTÓRICAS (10 PLANTILLAS EN CUADRÍCULA 2 COLUMNAS PRÁCTICA) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-zinc-400">
            Plantillas ({HISTORICAL_TEMPLATES.length})
          </span>
          <span className="text-[10px] text-stone-400 dark:text-zinc-500">
            70s & 80s
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {HISTORICAL_TEMPLATES.map((tpl) => {
            const isSelected = project.templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                title={tpl.description}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition ${
                  isSelected
                    ? 'bg-amber-500/10 dark:bg-zinc-900 border-amber-500 text-stone-900 dark:text-zinc-100 shadow-sm'
                    : 'bg-white/70 dark:bg-zinc-900/30 border-stone-200 dark:border-zinc-800/80 text-stone-600 dark:text-zinc-400 hover:border-stone-300 dark:hover:border-zinc-700 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
              >
                <div
                  className="w-5 h-7 rounded-[2px] border border-stone-300 dark:border-zinc-700 shrink-0 flex flex-col justify-between p-0.5"
                  style={{ backgroundColor: PAPER_STOCKS[tpl.defaultPaper].bgHex }}
                >
                  <div
                    className="w-full h-3"
                    style={{ backgroundColor: tpl.defaultAccent }}
                  />
                  <div className="w-full h-0.5 bg-zinc-800/60" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold truncate leading-tight">
                    {tpl.name}
                  </div>
                  <div className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 truncate">
                    {tpl.era}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. FORMATO FÍSICO Y PAPEL */}
      <section className="space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-zinc-400">
          Pliego y Acabado de Papel
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: 'j-standard', label: 'J-Card', sub: '96.5 mm' },
              { id: 'j-plus-1', label: 'J+1', sub: '161.5 mm' },
              { id: 'j-plus-2', label: 'J+2', sub: '226.5 mm' },
            ] as { id: FoldFormat; label: string; sub: string }[]
          ).map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() =>
                onChangeProject((prev) => ({ ...prev, foldFormat: fmt.id }))
              }
              className={`py-2 px-2 rounded-lg border text-center transition ${
                project.foldFormat === fmt.id
                  ? 'bg-amber-500/10 dark:bg-zinc-900 border-amber-500 text-stone-900 dark:text-zinc-100'
                  : 'bg-white/70 dark:bg-zinc-900/30 border-stone-200 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
              }`}
            >
              <div className="text-xs font-semibold">{fmt.label}</div>
              <div className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
                {fmt.sub}
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="space-y-1.5">
            <span className="text-[11px] text-stone-500 dark:text-zinc-400 block">
              Papel
            </span>
            <div className="flex items-center gap-1.5">
              {(Object.keys(PAPER_STOCKS) as PaperStockId[]).map((stockId) => {
                const stock = PAPER_STOCKS[stockId];
                const active = project.paperStock === stockId;
                return (
                  <button
                    key={stockId}
                    type="button"
                    onClick={() =>
                      onChangeProject((prev) => ({ ...prev, paperStock: stockId }))
                    }
                    title={stock.name}
                    className={`w-6 h-6 rounded-full border transition ${
                      active
                        ? 'ring-2 ring-amber-500 border-stone-900 dark:border-zinc-950 scale-110'
                        : 'border-stone-300 dark:border-zinc-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: stock.bgHex }}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-stone-500 dark:text-zinc-400 block">
              Tinta de Acento
            </span>
            <div className="flex items-center gap-1.5">
              {VINTAGE_INK_SWATCHES.map((sw) => (
                <button
                  key={sw.hex}
                  type="button"
                  onClick={() =>
                    onChangeProject((prev) => ({ ...prev, accentColor: sw.hex }))
                  }
                  title={sw.name}
                  className={`w-5 h-5 rounded-full border transition ${
                    project.accentColor.toLowerCase() === sw.hex.toLowerCase()
                      ? 'ring-2 ring-amber-500 border-stone-900 dark:border-zinc-950 scale-110'
                      : 'border-stone-300 dark:border-zinc-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: sw.hex }}
                />
              ))}
              <input
                type="color"
                value={project.accentColor}
                onChange={(e) =>
                  onChangeProject((prev) => ({ ...prev, accentColor: e.target.value }))
                }
                className="w-5 h-5 rounded-full bg-transparent cursor-pointer border-0"
                title="Color personalizado"
              />
            </div>
          </div>
        </div>

        <div className="pt-1">
          <select
            value={project.typography}
            onChange={(e) =>
              onChangeProject((prev) => ({
                ...prev,
                typography: e.target.value as TypographyPreset,
              }))
            }
            className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-stone-700 dark:text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="helvetica-univers">Tipografía: Helvética / Univers (Suiza 70s–80s)</option>
            <option value="garamond-serif">Tipografía: Garamond Serif (Editorial UK)</option>
            <option value="condensed-80s">Tipografía: Condensada Técnica (80s)</option>
            <option value="classical-dg">Tipografía: Clásica Imperial (DG)</option>
            <option value="typewriter-mono">Tipografía: Máquina de Escribir (Mixtape)</option>
          </select>
        </div>
      </section>

      {/* 4. PORTADA Y ENCUADRE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Arte de Portada
          </span>
          <button
            type="button"
            onClick={() =>
              onChangeProject((prev) => ({
                ...prev,
                coverFraming: { zoom: 1, panX: 0, panY: 0, filter: 'none' },
              }))
            }
            className="text-[11px] text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-300 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Restablecer
          </button>
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-200/80 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 font-medium text-xs transition shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Subir Imagen
          </button>
          <input
            type="text"
            value={project.coverUrl.startsWith('data:') ? '' : project.coverUrl}
            onChange={(e) =>
              onChangeProject((prev) => ({ ...prev, coverUrl: e.target.value }))
            }
            placeholder="O pegar URL de imagen..."
            className="flex-1 bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-stone-700 dark:text-zinc-300 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <div>
            <div className="flex justify-between text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
              <span>Zoom</span>
              <span className="font-mono">{project.coverFraming.zoom.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.05"
              value={project.coverFraming.zoom}
              onChange={(e) =>
                onChangeProject((prev) => ({
                  ...prev,
                  coverFraming: {
                    ...prev.coverFraming,
                    zoom: parseFloat(e.target.value),
                  },
                }))
              }
              className="w-full accent-amber-500 h-1 bg-stone-200 dark:bg-zinc-800 rounded-lg"
            />
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
              <span>Horizontal</span>
              <span className="font-mono">{project.coverFraming.panX}%</span>
            </div>
            <input
              type="range"
              min="-80"
              max="80"
              step="2"
              value={project.coverFraming.panX}
              onChange={(e) =>
                onChangeProject((prev) => ({
                  ...prev,
                  coverFraming: {
                    ...prev.coverFraming,
                    panX: parseInt(e.target.value, 10),
                  },
                }))
              }
              className="w-full accent-amber-500 h-1 bg-stone-200 dark:bg-zinc-800 rounded-lg"
            />
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
              <span>Vertical</span>
              <span className="font-mono">{project.coverFraming.panY}%</span>
            </div>
            <input
              type="range"
              min="-80"
              max="80"
              step="2"
              value={project.coverFraming.panY}
              onChange={(e) =>
                onChangeProject((prev) => ({
                  ...prev,
                  coverFraming: {
                    ...prev.coverFraming,
                    panY: parseInt(e.target.value, 10),
                  },
                }))
              }
              className="w-full accent-amber-500 h-1 bg-stone-200 dark:bg-zinc-800 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { id: 'none', label: 'Normal' },
              { id: 'warm-70s', label: 'Cálido' },
              { id: 'high-contrast', label: 'Contraste' },
              { id: 'monochrome', label: 'B/N' },
            ] as { id: CoverFilter; label: string }[]
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() =>
                onChangeProject((prev) => ({
                  ...prev,
                  coverFraming: { ...prev.coverFraming, filter: f.id },
                }))
              }
              className={`py-1 rounded text-[11px] border transition ${
                project.coverFraming.filter === f.id
                  ? 'bg-amber-500/10 dark:bg-zinc-800 border-amber-500 text-stone-900 dark:text-zinc-100'
                  : 'bg-white/70 dark:bg-zinc-900/30 border-stone-200 dark:border-zinc-800/80 text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* 5. COLLAPSIBLE TECHNICAL & EDITORIAL CREDITS */}
      <section className="pt-2 border-t border-stone-200 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails((v) => !v)}
          className="w-full flex items-center justify-between py-1.5 text-left text-[11px] font-mono uppercase tracking-widest text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 transition"
        >
          <span>Catálogo, Sello, Dolby y Notas</span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
                  Catálogo
                </label>
                <input
                  type="text"
                  value={project.catalogNumber}
                  onChange={(e) =>
                    onChangeProject((prev) => ({ ...prev, catalogNumber: e.target.value }))
                  }
                  className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-stone-800 dark:text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
                  Sello / Marca
                </label>
                <input
                  type="text"
                  value={project.recordLabel}
                  onChange={(e) =>
                    onChangeProject((prev) => ({ ...prev, recordLabel: e.target.value }))
                  }
                  className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 dark:text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
                  Reducción Ruido
                </label>
                <select
                  value={project.dolbySystem}
                  onChange={(e) =>
                    onChangeProject((prev) => ({
                      ...prev,
                      dolbySystem: e.target.value as CassetteProject['dolbySystem'],
                    }))
                  }
                  className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-stone-800 dark:text-zinc-200"
                >
                  <option value="B-NR">Dolby B-NR</option>
                  <option value="C-NR">Dolby C-NR</option>
                  <option value="HX-PRO">Dolby HX Pro</option>
                  <option value="NONE">Sin Dolby</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
                  Bias / EQ
                </label>
                <select
                  value={project.tapeBias}
                  onChange={(e) =>
                    onChangeProject((prev) => ({
                      ...prev,
                      tapeBias: e.target.value as CassetteProject['tapeBias'],
                    }))
                  }
                  className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-stone-800 dark:text-zinc-200"
                >
                  <option value="Normal (Fe2O3) 120µs">Normal 120µs</option>
                  <option value="CrO2 (Type II) 70µs">CrO₂ 70µs</option>
                  <option value="Metal (Type IV) 70µs">Metal 70µs</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
                  Año
                </label>
                <input
                  type="text"
                  value={project.releaseYear}
                  onChange={(e) =>
                    onChangeProject((prev) => ({ ...prev, releaseYear: e.target.value }))
                  }
                  className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-stone-800 dark:text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
                  Pie Frontal
                </label>
                <input
                  type="text"
                  value={project.stereoText}
                  onChange={(e) =>
                    onChangeProject((prev) => ({ ...prev, stereoText: e.target.value }))
                  }
                  className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 dark:text-zinc-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
                Créditos (Interior J+1)
              </label>
              <input
                type="text"
                value={project.productionCredits}
                onChange={(e) =>
                  onChangeProject((prev) => ({ ...prev, productionCredits: e.target.value }))
                }
                className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 dark:text-zinc-300"
              />
            </div>

            <div>
              <label className="block text-[10px] text-stone-500 dark:text-zinc-500 mb-1">
                Notas Editoriales (Interior J+2)
              </label>
              <textarea
                rows={2}
                value={project.linerNotes}
                onChange={(e) =>
                  onChangeProject((prev) => ({ ...prev, linerNotes: e.target.value }))
                }
                className="w-full bg-white dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 dark:text-zinc-300"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-stone-600 dark:text-zinc-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={project.showCropMarks}
                  onChange={(e) =>
                    onChangeProject((prev) => ({ ...prev, showCropMarks: e.target.checked }))
                  }
                  className="rounded accent-amber-500"
                />
                Guías de corte
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={project.showDimensionGuides}
                  onChange={(e) =>
                    onChangeProject((prev) => ({
                      ...prev,
                      showDimensionGuides: e.target.checked,
                    }))
                  }
                  className="rounded accent-amber-500"
                />
                Cotas en mm
              </label>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
