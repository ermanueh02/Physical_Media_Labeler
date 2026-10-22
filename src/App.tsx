import React, { useEffect, useRef, useState } from 'react';
import {
  Disc,
  Printer,
  ImageDown,
  Save,
  FolderOpen,
  LayoutTemplate,
  Box,
  Tag,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  MonitorDown,
  X,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
} from 'lucide-react';
import {
  CassetteProject,
  MediaFormat,
  PdfExportMode,
  PHYSICAL_SPECS,
  PreviewMode,
  ThemeMode,
} from './types/cassette';
import { SPOTIFY_HISTORICAL_PRESETS } from './utils/spotifyConnector';
import { JCardSvgRenderer } from './components/svg/JCardSvgRenderer';
import { CassetteLabelsSvgRenderer } from './components/svg/CassetteLabelsSvgRenderer';
import { CdInsertsSvgRenderer } from './components/svg/CdInsertsSvgRenderer';
import { CdDiscLabelSvgRenderer } from './components/svg/CdDiscLabelSvgRenderer';
import { Norelco3DMockup } from './components/preview/Norelco3DMockup';
import { CdJewelCase3DMockup } from './components/preview/CdJewelCase3DMockup';
import { EditorialStylePanel } from './components/panels/EditorialStylePanel';
import { TracklistIngestPanel } from './components/panels/TracklistIngestPanel';
import {
  exportCdPrintReadyPdfA4,
  exportPrintReadyPdfA4,
  exportProjectJson,
  exportSquarePlaylistCover2000px,
} from './utils/exportEngine';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function App() {
  const [project, setProject] = useState<CassetteProject>(() =>
    structuredClone(SPOTIFY_HISTORICAL_PRESETS[0].project)
  );
  const [previewMode, setPreviewMode] = useState<PreviewMode>('flat-print');
  const [sidebarSection, setSidebarSection] = useState<'design' | 'tracks'>('design');
  const [flatZoom, setFlatZoom] = useState<number>(1.0);
  const [rotateFlatLandscape, setRotateFlatLandscape] = useState<boolean>(true);
  const [labelsShowMechanics, setLabelsShowMechanics] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Theme Mode ('light' | 'dark' | 'system')
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('norelco-theme-mode') as ThemeMode | null;
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  // PDF Export Mode ('separate-2-pages' | 'jcard-only' | 'labels-only')
  const [showPdfMenu, setShowPdfMenu] = useState<boolean>(false);

  // PWA Installation State
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandaloneApp, setIsStandaloneApp] = useState<boolean>(false);
  const [showPwaGuideModal, setShowPwaGuideModal] = useState<boolean>(false);

  const exportJCardSvgRef = useRef<SVGSVGElement>(null);
  const exportLabelsSvgRef = useRef<SVGSVGElement>(null);
  const exportCdInsertsSvgRef = useRef<SVGSVGElement>(null);
  const exportCdDiscSvgRef = useRef<SVGSVGElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const activeMediaFormat: MediaFormat = project.mediaFormat || 'cassette';
  const isCdMode = activeMediaFormat === 'cd';

  // Apply Light / Dark / System Theme
  useEffect(() => {
    localStorage.setItem('norelco-theme-mode', themeMode);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        themeMode === 'dark' || (themeMode === 'system' && mediaQuery.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [themeMode]);

  useEffect(() => {
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandaloneApp(checkStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPwaPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPwaPrompt(null);
      setIsStandaloneApp(true);
      setShowPwaGuideModal(false);
      triggerToast('Aplicación Norelco Studio instalada en tu equipo.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleInstallPwaClick = async () => {
    if (deferredPwaPrompt) {
      await deferredPwaPrompt.prompt();
      const choice = await deferredPwaPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPwaPrompt(null);
      }
    } else {
      setShowPwaGuideModal(true);
    }
  };

  const handleExportPdf = async (mode: PdfExportMode) => {
    setShowPdfMenu(false);
    setIsExporting('pdf');
    try {
      if (isCdMode) {
        if (!exportCdInsertsSvgRef.current || !exportCdDiscSvgRef.current) return;
        await exportCdPrintReadyPdfA4(
          project,
          exportCdInsertsSvgRef.current,
          exportCdDiscSvgRef.current,
          mode
        );
        const cdLabel =
          mode === 'jcard-only'
            ? 'PDF A4 Solo Carátula + Inlay CD (Cartulina) exportado.'
            : mode === 'labels-only'
            ? 'PDF A4 Solo Galleta CD (Pegatina) exportado.'
            : 'PDF A4 CD en 2 hojas separadas (Cartulina + Pegatina CD) exportado.';
        triggerToast(cdLabel);
      } else {
        if (!exportJCardSvgRef.current || !exportLabelsSvgRef.current) return;
        await exportPrintReadyPdfA4(
          project,
          exportJCardSvgRef.current,
          exportLabelsSvgRef.current,
          mode
        );
        const label =
          mode === 'jcard-only'
            ? 'PDF A4 Solo J-Card (Cartulina) exportado.'
            : mode === 'labels-only'
            ? 'PDF A4 Solo Etiquetas (Pegatina) exportado.'
            : 'PDF A4 en 2 hojas separadas (Cartulina + Pegatina) exportado.';
        triggerToast(label);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error al generar el PDF.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportSquarePng = async () => {
    if (!exportJCardSvgRef.current || !exportLabelsSvgRef.current) return;
    setIsExporting('png');
    try {
      await exportSquarePlaylistCover2000px(
        project,
        exportJCardSvgRef.current,
        exportLabelsSvgRef.current
      );
      triggerToast('Portada 2000×2000 px descargada.');
    } catch (err) {
      console.error(err);
      triggerToast('Error al exportar PNG.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleLoadJsonProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as CassetteProject;
        if (parsed && parsed.albumTitle && Array.isArray(parsed.tracks)) {
          setProject(parsed);
          triggerToast(`Proyecto "${parsed.albumTitle}" cargado.`);
        }
      } catch {
        triggerToast('Archivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  const cycleThemeMode = () => {
    setThemeMode((prev) =>
      prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system'
    );
  };

  const extraPanelsCount =
    project.foldFormat === 'j-plus-2' ? 2 : project.foldFormat === 'j-plus-1' ? 1 : 0;
  const totalUnfoldedWidthMm =
    PHYSICAL_SPECS.FLAP_WIDTH_MM +
    PHYSICAL_SPECS.SPINE_WIDTH_MM +
    PHYSICAL_SPECS.FRONT_WIDTH_MM +
    extraPanelsCount * PHYSICAL_SPECS.EXTRA_PANEL_WIDTH_MM;

  return (
    <div className="min-h-screen h-screen flex flex-col bg-stone-100 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 overflow-hidden transition-colors">
      {/* MINIMAL EDITORIAL HEADER */}
      <header className="h-14 px-5 bg-stone-50 dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-900 flex items-center justify-between gap-4 shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold tracking-widest uppercase text-stone-800 dark:text-zinc-200">
              Norelco Studio
            </span>
          </div>

          {/* FORMAT SWITCHER: CASSETTE vs CD */}
          <div className="flex items-center gap-0.5 bg-stone-200/80 dark:bg-zinc-900 p-0.5 rounded-lg border border-stone-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() =>
                setProject((prev) => ({ ...prev, mediaFormat: 'cassette' }))
              }
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                !isCdMode
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
              }`}
            >
              Cassette
            </button>
            <button
              type="button"
              onClick={() =>
                setProject((prev) => ({ ...prev, mediaFormat: 'cd' }))
              }
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                isCdMode
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
              }`}
            >
              CD
            </button>
          </div>
        </div>

        {/* CENTER VIEW SWITCHER */}
        <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-zinc-900/90 p-1 rounded-lg border border-stone-200 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setPreviewMode('flat-print')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              previewMode === 'flat-print'
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm'
                : 'text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-300'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            {isCdMode ? 'Carátula + Inlay CD' : 'Pliego J-Card'}
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('mockup-3d')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              previewMode === 'mockup-3d'
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm'
                : 'text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-300'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            {isCdMode ? 'Jewel Case 3D' : 'Caja 3D'}
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('labels-view')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              previewMode === 'labels-view'
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-sm'
                : 'text-stone-500 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-300'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            {isCdMode ? 'Galleta CD' : 'Etiquetas A/B'}
          </button>
        </div>

        {/* CLEAN EXPORT, THEME & PWA INSTALL ACTIONS */}
        <div className="flex items-center gap-1.5">
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleLoadJsonProject}
            className="hidden"
          />

          {/* Theme Switcher Button: Claro / Oscuro / Sistema */}
          <button
            type="button"
            onClick={cycleThemeMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-200/70 dark:bg-zinc-900 hover:bg-stone-300/70 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-xs font-medium text-stone-700 dark:text-zinc-300 transition"
            title={`Tema actual: ${
              themeMode === 'system'
                ? 'Automático (Sistema)'
                : themeMode === 'light'
                ? 'Modo Claro'
                : 'Modo Oscuro'
            }. Haz clic para cambiar.`}
          >
            {themeMode === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
            {themeMode === 'dark' && <Moon className="w-3.5 h-3.5 text-amber-400" />}
            {themeMode === 'system' && <Monitor className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400" />}
            <span className="hidden xl:inline text-[11px]">
              {themeMode === 'system' ? 'Auto' : themeMode === 'light' ? 'Claro' : 'Oscuro'}
            </span>
          </button>

          {!isStandaloneApp && (
            <button
              type="button"
              onClick={handleInstallPwaClick}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                deferredPwaPrompt
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-stone-200/70 dark:bg-zinc-900 hover:bg-stone-300/70 dark:hover:bg-zinc-800 border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-zinc-300'
              }`}
              title="Instalar como aplicación de escritorio en Chrome"
            >
              <MonitorDown className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="hidden xl:inline">Instalar App</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="p-2 rounded-lg text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200/60 dark:hover:bg-zinc-900 transition"
            title="Cargar proyecto (.json)"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              exportProjectJson(project);
              triggerToast('Proyecto guardado (.json)');
            }}
            className="p-2 rounded-lg text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200/60 dark:hover:bg-zinc-900 transition"
            title="Guardar proyecto (.json)"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={isExporting !== null}
            onClick={handleExportSquarePng}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-200/70 dark:bg-zinc-900 hover:bg-stone-300/70 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-xs font-medium text-stone-700 dark:text-zinc-300 transition disabled:opacity-50"
            title="Exportar imagen cuadrada 2000×2000 px para Spotify"
          >
            <ImageDown className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400" />
            <span className="hidden md:inline">PNG 1:1</span>
          </button>

          {/* PDF A4 Split Button with Separate Cartulina / Pegatina Options */}
          <div className="relative">
            <button
              type="button"
              disabled={isExporting !== null}
              onClick={() => setShowPdfMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold transition disabled:opacity-50"
              title="Opciones de impresión A4 a escala 1:1 (J-Card en Cartulina y Etiquetas en Pegatina por separado)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isExporting === 'pdf' ? '...' : 'PDF A4'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showPdfMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPdfMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-2xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-zinc-500 border-b border-stone-100 dark:border-zinc-800">
                    Impresión A4 Escala 1:1 (300 DPI)
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExportPdf('jcard-only')}
                    className="w-full px-3 py-2.5 text-left hover:bg-stone-100 dark:hover:bg-zinc-800/80 transition flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-stone-900 dark:text-zinc-100">
                      {isCdMode
                        ? 'Solo Carátula + Inlay CD (Para Cartulina)'
                        : 'Solo J-Card (Para Cartulina)'}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400">
                      {isCdMode
                        ? '1 hoja A4 con Frontal (120×120 mm) + Inlay Trasero (150×118 mm)'
                        : `1 hoja A4 con el encarte desplegado (${totalUnfoldedWidthMm} × 102 mm)`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportPdf('labels-only')}
                    className="w-full px-3 py-2.5 text-left hover:bg-stone-100 dark:hover:bg-zinc-800/80 transition flex flex-col gap-0.5 border-t border-stone-100 dark:border-zinc-800/60"
                  >
                    <span className="font-semibold text-stone-900 dark:text-zinc-100">
                      {isCdMode
                        ? 'Solo Galleta Circular CD (Para Pegatina)'
                        : 'Solo Etiquetas A/B (Para Pegatina)'}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400">
                      {isCdMode
                        ? '1 hoja A4 adhesiva con 2 etiquetas circulares (Ø 116 mm)'
                        : '1 hoja A4 adhesiva con juego principal + repuesto (89 × 42 mm)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportPdf('separate-2-pages')}
                    className="w-full px-3 py-2.5 text-left hover:bg-stone-100 dark:hover:bg-zinc-800/80 transition flex flex-col gap-0.5 border-t border-stone-100 dark:border-zinc-800/60"
                  >
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      PDF Completo en 2 Hojas Separadas
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400">
                      {isCdMode
                        ? 'Pág. 1: Carátula/Inlay (Cartulina) + Pág. 2: Galleta CD (Pegatina)'
                        : 'Pág. 1: J-Card (Cartulina) + Pág. 2: Etiquetas (Pegatina)'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* PWA CHROME INSTALL GUIDE MODAL */}
      {showPwaGuideModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPwaGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MonitorDown className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                  Instalar Norelco Studio en Google Chrome
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPwaGuideModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
              Esta web incluye manifiesto PWA (<code className="text-stone-900 dark:text-zinc-200">manifest.webmanifest</code>) y Service Worker offline para ejecutarse como aplicación de escritorio desde tu URL de GitHub Pages:
            </p>

            <ol className="text-xs text-stone-700 dark:text-zinc-300 space-y-2 list-decimal list-inside bg-stone-100 dark:bg-zinc-950/80 p-3.5 rounded-lg border border-stone-200 dark:border-zinc-800/80">
              <li>
                Abre la URL de GitHub Pages en <strong>Google Chrome</strong> o <strong>Edge</strong>.
              </li>
              <li>
                Haz clic en el icono <strong>Instalar Norelco Studio</strong> situado a la derecha de la barra de direcciones URL.
              </li>
              <li>
                O ve al menú de Chrome (<strong>⋮</strong>) → <strong>Guardar y compartir</strong> → <strong>Instalar página como aplicación...</strong>
              </li>
            </ol>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPwaGuideModal(false)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {statusToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 text-xs text-stone-800 dark:text-zinc-200 shadow-xl">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-full lg:w-[360px] bg-stone-50 dark:bg-zinc-950 border-r border-stone-200 dark:border-zinc-900 flex flex-col shrink-0 overflow-hidden transition-colors">
          <div className="grid grid-cols-2 border-b border-stone-200 dark:border-zinc-900 text-xs font-medium shrink-0">
            <button
              type="button"
              onClick={() => setSidebarSection('design')}
              className={`py-3 text-center border-b-2 transition ${
                sidebarSection === 'design'
                  ? 'border-amber-500 text-stone-900 dark:text-zinc-100'
                  : 'border-transparent text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
              }`}
            >
              Diseño Editorial
            </button>
            <button
              type="button"
              onClick={() => setSidebarSection('tracks')}
              className={`py-3 text-center border-b-2 transition ${
                sidebarSection === 'tracks'
                  ? 'border-amber-500 text-stone-900 dark:text-zinc-100'
                  : 'border-transparent text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
              }`}
            >
              Pistas ({project.tracks.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {sidebarSection === 'design' ? (
              <EditorialStylePanel project={project} onChangeProject={setProject} />
            ) : (
              <TracklistIngestPanel project={project} onChangeProject={setProject} />
            )}
          </div>
        </aside>

        {/* RIGHT PREVIEW CANVAS */}
        <main className="flex-1 flex flex-col bg-stone-200/60 dark:bg-[#0c0c0e] overflow-hidden relative transition-colors">
          {previewMode === 'flat-print' && (
            <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-10">
              {isCdMode ? (
                <div
                  className="transition-all duration-200 ease-out drop-shadow-[0_20px_40px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_24px_48px_rgba(0,0,0,0.75)]"
                  style={{
                    width: `${Math.round(920 * flatZoom)}px`,
                  }}
                >
                  <CdInsertsSvgRenderer
                    project={project}
                    part="both"
                    includePrintGuides={true}
                    idPrefix="preview-cd-flat"
                  />
                </div>
              ) : (
                <div
                  className="transition-all duration-200 ease-out drop-shadow-[0_20px_40px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_24px_48px_rgba(0,0,0,0.75)]"
                  style={{
                    width: `${Math.round((totalUnfoldedWidthMm + 20) * 4.3 * flatZoom)}px`,
                    transform:
                      project.templateId === 'tdk-d-index' && rotateFlatLandscape
                        ? 'rotate(-90deg)'
                        : 'none',
                  }}
                >
                  <JCardSvgRenderer
                    project={project}
                    includePrintGuides={true}
                    idPrefix="preview-flat"
                  />
                </div>
              )}

              {/* Floating Minimal Zoom & Dimension Bar */}
              <div className="fixed bottom-5 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-stone-300 dark:border-zinc-800/90 text-[11px] text-stone-600 dark:text-zinc-400 shadow-lg backdrop-blur">
                <span className="font-mono text-stone-500 dark:text-zinc-500">
                  {isCdMode
                    ? 'Frontal 120×120 mm + Inlay 150×118 mm'
                    : `${totalUnfoldedWidthMm} × 102 mm`}
                </span>
                {!isCdMode && project.templateId === 'tdk-d-index' && (
                  <>
                    <span className="text-stone-300 dark:text-zinc-700">|</span>
                    <button
                      type="button"
                      onClick={() => setRotateFlatLandscape((r) => !r)}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium transition"
                    >
                      {rotateFlatLandscape ? 'Vista Horizontal (TDK)' : 'Vista Vertical'}
                    </button>
                  </>
                )}
                <span className="text-stone-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={() => setFlatZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
                  className="text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono w-10 text-center text-stone-800 dark:text-zinc-300">
                  {Math.round(flatZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setFlatZoom((z) => Math.min(2.0, +(z + 0.15).toFixed(2)))}
                  className="text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {previewMode === 'mockup-3d' &&
            (isCdMode ? (
              <CdJewelCase3DMockup project={project} />
            ) : (
              <Norelco3DMockup project={project} />
            ))}

          {previewMode === 'labels-view' && (
            <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-10">
              <div
                className={`${
                  isCdMode ? 'w-full max-w-[440px]' : 'w-full max-w-[500px]'
                } drop-shadow-[0_20px_40px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_24px_48px_rgba(0,0,0,0.75)]`}
              >
                {isCdMode ? (
                  <CdDiscLabelSvgRenderer
                    project={project}
                    showDieCutGuides={!labelsShowMechanics}
                    showDiscMechanics={labelsShowMechanics}
                    idPrefix="preview-cd-disc"
                  />
                ) : (
                  <CassetteLabelsSvgRenderer
                    project={project}
                    showDieCutGuides={!labelsShowMechanics}
                    showCassetteMechanics={labelsShowMechanics}
                  />
                )}
              </div>

              <div className="fixed bottom-5 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-stone-300 dark:border-zinc-800/90 text-[11px] text-stone-600 dark:text-zinc-400 shadow-lg backdrop-blur">
                <span className="font-mono text-stone-500 dark:text-zinc-500">
                  {isCdMode ? 'Ø 116 mm (Hub Ø 41 mm)' : '89 × 42 mm'}
                </span>
                <span className="text-stone-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={() => setLabelsShowMechanics((v) => !v)}
                  className="text-stone-800 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition"
                >
                  {labelsShowMechanics
                    ? 'Ver troquel limpio'
                    : isCdMode
                    ? 'Simular reflejo policarbonato'
                    : 'Simular bobinas'}
                </button>
              </div>
            </div>
          )}

          {/* OFFSCREEN CLEAN SVG RENDERERS FOR EXPORT */}
          <div
            aria-hidden="true"
            className="fixed pointer-events-none opacity-0 -left-[9999px] -top-[9999px] w-[1000px] h-[1000px] overflow-hidden"
          >
            <JCardSvgRenderer
              svgRef={exportJCardSvgRef}
              project={project}
              includePrintGuides={false}
              idPrefix="export-clean-jcard"
            />
            <CassetteLabelsSvgRenderer
              svgRef={exportLabelsSvgRef}
              project={project}
              showDieCutGuides={false}
              showCassetteMechanics={false}
            />
            <CdInsertsSvgRenderer
              svgRef={exportCdInsertsSvgRef}
              project={project}
              part="both"
              includePrintGuides={false}
              idPrefix="export-clean-cd-inserts"
            />
            <CdDiscLabelSvgRenderer
              svgRef={exportCdDiscSvgRef}
              project={project}
              showDieCutGuides={false}
              showDiscMechanics={false}
              idPrefix="export-clean-cd-disc"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
