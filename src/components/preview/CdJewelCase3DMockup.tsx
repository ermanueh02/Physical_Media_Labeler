import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CassetteProject } from '../../types/cassette';
import { CdInsertsSvgRenderer } from '../svg/CdInsertsSvgRenderer';
import { CdDiscLabelSvgRenderer } from '../svg/CdDiscLabelSvgRenderer';

interface CdJewelCase3DMockupProps {
  project: CassetteProject;
}

export const CdJewelCase3DMockup: React.FC<CdJewelCase3DMockupProps> = ({ project }) => {
  const [rotY, setRotY] = useState<number>(-22);
  const [rotX, setRotX] = useState<number>(8);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; rX: number; rY: number }>({
    x: 0,
    y: 0,
    rX: 8,
    rY: -22,
  });

  // 142 mm x 125 mm x 10 mm standard CD Jewel Case
  const scale = 2.6;
  const caseW = Math.round(142 * scale); // 369 px
  const caseH = Math.round(125 * scale); // 325 px
  const spineDepth = Math.round(10 * scale); // 26 px
  const leftTrayRibWidth = Math.round(18 * scale); // 47 px ribbed dark tray edge
  const bookletW = caseW - leftTrayRibWidth; // 322 px (120 mm square area)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, rX: rotX, rY: rotY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotY(Math.max(-175, Math.min(175, dragStart.rY + dx * 0.55)));
    setRotX(Math.max(-35, Math.min(45, dragStart.rX - dy * 0.35)));
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative flex-1 flex flex-col lg:flex-row items-center justify-center gap-14 p-10 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ perspective: '1400px' }}
    >
      {/* 3D CD JEWEL CASE */}
      <div
        className="relative transition-transform duration-75 ease-out"
        style={{
          width: `${caseW}px`,
          height: `${caseH}px`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {/* FRONT FACE (Ribbed Left Tray Strip + 120x120mm Booklet) */}
        <div
          className="absolute inset-0 rounded-[2px] overflow-hidden shadow-2xl flex"
          style={{
            width: `${caseW}px`,
            height: `${caseH}px`,
            transform: `translateZ(${spineDepth / 2}px)`,
            backfaceVisibility: 'hidden',
            border: '2px solid rgba(255,255,255,0.24)',
            backgroundColor: '#18181b',
          }}
        >
          {/* Classic Dark Charcoal Ribbed Jewel Case Hinge Strip */}
          <div
            className="h-full shrink-0 border-r border-white/15"
            style={{
              width: `${leftTrayRibWidth}px`,
              background:
                'repeating-linear-gradient(90deg, #18181b 0px, #27272a 2px, #09090b 4px)',
            }}
          />

          {/* 120 x 120 mm Front Booklet Insert */}
          <div className="relative h-full" style={{ width: `${bookletW}px` }}>
            <CdInsertsSvgRenderer
              project={project}
              part="front-only"
              includePrintGuides={false}
              idPrefix="cd-mockup3d-front"
            />
          </div>

          {/* Acrylic Plastic Gloss Reflection */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.08) 72%, rgba(255,255,255,0.1) 100%)',
              boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.15)',
            }}
          />
        </div>

        {/* LEFT SPINE (6 mm Inlay Spine) */}
        <div
          className="absolute top-0 left-0 overflow-hidden"
          style={{
            width: `${spineDepth}px`,
            height: `${caseH}px`,
            transformOrigin: 'left center',
            transform: `translateZ(${spineDepth / 2}px) rotateY(-90deg)`,
            border: '1px solid rgba(255,255,255,0.24)',
            backgroundColor: '#18181b',
          }}
        >
          <div
            style={{
              width: `${Math.round(150 * (caseH / 118))}px`,
              height: `${caseH}px`,
            }}
          >
            <CdInsertsSvgRenderer
              project={project}
              part="tray-only"
              includePrintGuides={false}
              idPrefix="cd-mockup3d-spine"
            />
          </div>
        </div>

        {/* BACK FACE (138 x 118 mm Tray Inlay) */}
        <div
          className="absolute inset-0 rounded-[2px] overflow-hidden shadow-2xl"
          style={{
            width: `${caseW}px`,
            height: `${caseH}px`,
            transform: `translateZ(-${spineDepth / 2}px) rotateY(180deg)`,
            border: '2px solid rgba(255,255,255,0.24)',
            backgroundColor: '#18181b',
          }}
        >
          <div
            style={{
              width: `${Math.round(150 * (caseW / 138))}px`,
              height: `${caseH}px`,
              transform: `translateX(-${Math.round(6 * (caseW / 138))}px)`,
            }}
          >
            <CdInsertsSvgRenderer
              project={project}
              part="tray-only"
              includePrintGuides={false}
              idPrefix="cd-mockup3d-back"
            />
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.12) 100%)',
            }}
          />
        </div>
      </div>

      {/* PHYSICAL COMPACT DISC (Ø 116 mm) */}
      <div className="w-[300px] sm:w-[325px] drop-shadow-[0_24px_40px_rgba(0,0,0,0.75)] z-10">
        <CdDiscLabelSvgRenderer
          project={project}
          showDieCutGuides={false}
          showDiscMechanics={true}
          idPrefix="cd-mockup3d-disc"
        />
      </div>

      {/* Floating Minimal Angle Controls */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="fixed bottom-5 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-stone-300 dark:border-zinc-800/90 text-[11px] text-stone-600 dark:text-zinc-400 shadow-lg backdrop-blur"
      >
        <button
          type="button"
          onClick={() => {
            setRotY(-22);
            setRotX(8);
          }}
          className="hover:text-stone-900 dark:hover:text-zinc-100 transition"
        >
          3/4
        </button>
        <span className="text-stone-300 dark:text-zinc-700">·</span>
        <button
          type="button"
          onClick={() => {
            setRotY(0);
            setRotX(0);
          }}
          className="hover:text-stone-900 dark:hover:text-zinc-100 transition"
        >
          Frontal
        </button>
        <span className="text-stone-300 dark:text-zinc-700">·</span>
        <button
          type="button"
          onClick={() => {
            setRotY(-72);
            setRotX(5);
          }}
          className="hover:text-stone-900 dark:hover:text-zinc-100 transition"
        >
          Lomo
        </button>
        <span className="text-stone-300 dark:text-zinc-700">·</span>
        <button
          type="button"
          onClick={() => {
            setRotY(-165);
            setRotX(6);
          }}
          className="hover:text-stone-900 dark:hover:text-zinc-100 transition"
        >
          Inlay Trasero
        </button>
        <button
          type="button"
          onClick={() => {
            setRotY(-22);
            setRotX(8);
          }}
          className="text-stone-400 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-200 ml-1"
          title="Restablecer ángulo"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
