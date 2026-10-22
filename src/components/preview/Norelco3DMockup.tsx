import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CassetteProject } from '../../types/cassette';
import { JCardSvgRenderer } from '../svg/JCardSvgRenderer';
import { SingleCassetteLabelSvg } from '../svg/CassetteLabelsSvgRenderer';

interface Norelco3DMockupProps {
  project: CassetteProject;
}

export const Norelco3DMockup: React.FC<Norelco3DMockupProps> = ({ project }) => {
  const [rotY, setRotY] = useState<number>(-26);
  const [rotX, setRotX] = useState<number>(10);
  const [activeSide, setActiveSide] = useState<'A' | 'B'>('A');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; rX: number; rY: number }>({
    x: 0,
    y: 0,
    rX: 10,
    rY: -26,
  });

  const scale = 3.8;
  const frontW = Math.round(65 * scale); // 247 px
  const spineW = Math.round(12.5 * scale); // 48 px
  const flapW = Math.round(19 * scale); // 72 px
  const cardH = Math.round(102 * scale); // 388 px

  const extraPanelsCount =
    project.foldFormat === 'j-plus-2' ? 2 : project.foldFormat === 'j-plus-1' ? 1 : 0;
  const totalUnfoldedMm = 19 + 12.5 + 65 + extraPanelsCount * 65;
  const totalUnfoldedPx = Math.round(totalUnfoldedMm * scale);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, rX: rotX, rY: rotY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotY(Math.max(-165, Math.min(165, dragStart.rY + dx * 0.55)));
    setRotX(Math.max(-35, Math.min(45, dragStart.rX - dy * 0.35)));
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative flex-1 flex flex-col lg:flex-row items-center justify-center gap-16 p-10 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ perspective: '1400px' }}
    >
      {/* 3D Norelco Plastic Case */}
      <div
        className="relative transition-transform duration-75 ease-out"
        style={{
          width: `${frontW}px`,
          height: `${cardH}px`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {/* FRONT FACE (65 mm x 102 mm) */}
        <div
          className="absolute inset-0 rounded-[2px] overflow-hidden shadow-2xl"
          style={{
            width: `${frontW}px`,
            height: `${cardH}px`,
            transform: `translateZ(${spineW / 2}px)`,
            backfaceVisibility: 'hidden',
            border: '2px solid rgba(255,255,255,0.22)',
            backgroundColor: '#18181b',
          }}
        >
          <div
            style={{
              width: `${totalUnfoldedPx}px`,
              height: `${cardH}px`,
              transform: `translateX(-${flapW + spineW}px)`,
            }}
          >
            <JCardSvgRenderer
              project={project}
              includePrintGuides={false}
              idPrefix="mockup3d-front"
            />
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(125deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 42%, rgba(0,0,0,0.06) 70%, rgba(255,255,255,0.08) 100%)',
              boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.14)',
            }}
          />
        </div>

        {/* SPINE FACE (12.5 mm x 102 mm) */}
        <div
          className="absolute top-0 left-0 overflow-hidden"
          style={{
            width: `${spineW}px`,
            height: `${cardH}px`,
            transformOrigin: 'left center',
            transform: `translateZ(${spineW / 2}px) rotateY(-90deg)`,
            border: '2px solid rgba(255,255,255,0.26)',
            backgroundColor: '#18181b',
          }}
        >
          <div
            style={{
              width: `${totalUnfoldedPx}px`,
              height: `${cardH}px`,
              transform: `translateX(-${flapW}px)`,
            }}
          >
            <JCardSvgRenderer
              project={project}
              includePrintGuides={false}
              idPrefix="mockup3d-spine"
            />
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.2) 100%)',
            }}
          />
        </div>

        {/* RIGHT OPENING EDGE */}
        <div
          className="absolute top-0 right-0"
          style={{
            width: `${spineW}px`,
            height: `${cardH}px`,
            transformOrigin: 'right center',
            transform: `translateZ(${spineW / 2}px) rotateY(90deg)`,
            background:
              'repeating-linear-gradient(to bottom, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.04) 3px, rgba(0,0,0,0.25) 6px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        />

        {/* BACK FACE (19 mm Flap + Clear Back) */}
        <div
          className="absolute inset-0 rounded-[2px] overflow-hidden"
          style={{
            width: `${frontW}px`,
            height: `${cardH}px`,
            transform: `translateZ(-${spineW / 2}px) rotateY(180deg)`,
            border: '2px solid rgba(255,255,255,0.22)',
            backgroundColor: 'rgba(24, 24, 27, 0.92)',
          }}
        >
          <div className="relative w-full h-full flex">
            <div className="flex-1 h-full bg-zinc-900/90 flex flex-col items-center justify-around py-10">
              <div className="w-8 h-8 rounded-full border border-zinc-600 bg-zinc-950" />
              <div className="w-8 h-8 rounded-full border border-zinc-600 bg-zinc-950" />
            </div>
            <div
              className="h-full overflow-hidden border-l border-zinc-700/50"
              style={{ width: `${flapW}px` }}
            >
              <div style={{ width: `${totalUnfoldedPx}px`, height: `${cardH}px` }}>
                <JCardSvgRenderer
                  project={project}
                  includePrintGuides={false}
                  idPrefix="mockup3d-flap"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Compact Cassette Shell */}
      <div className="w-[340px] sm:w-[380px] drop-shadow-[0_24px_40px_rgba(0,0,0,0.85)] z-10">
        <svg viewBox="0 0 100.4 63.8" className="w-full h-auto">
          <rect
            x="0.5"
            y="0.5"
            width="99.4"
            height="62.8"
            rx="3.2"
            fill="#18181B"
            stroke="#3F3F46"
            strokeWidth="0.5"
          />
          <SingleCassetteLabelSvg
            project={project}
            side={activeSide}
            x={5.7}
            y={4.2}
            showDieCutGuides={false}
            showCassetteMechanics={true}
          />
          <polygon
            points="17,63.3 21.5,48.5 78.9,48.5 83.4,63.3"
            fill="#141416"
            stroke="#27272A"
            strokeWidth="0.5"
          />
          <circle cx="27.5" cy="57.5" r="2.0" fill="#09090B" stroke="#3F3F46" strokeWidth="0.3" />
          <circle cx="72.9" cy="57.5" r="2.0" fill="#09090B" stroke="#3F3F46" strokeWidth="0.3" />
        </svg>
      </div>

      {/* Floating Minimal Bottom Bar */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="fixed bottom-5 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800/90 text-[11px] text-zinc-400 backdrop-blur"
      >
        <button
          type="button"
          onClick={() => {
            setRotY(-26);
            setRotX(10);
          }}
          className="hover:text-zinc-100 transition"
        >
          3/4
        </button>
        <span className="text-zinc-700">·</span>
        <button
          type="button"
          onClick={() => {
            setRotY(-68);
            setRotX(6);
          }}
          className="hover:text-zinc-100 transition"
        >
          Lomo
        </button>
        <span className="text-zinc-700">·</span>
        <button
          type="button"
          onClick={() => {
            setRotY(0);
            setRotX(0);
          }}
          className="hover:text-zinc-100 transition"
        >
          Frontal
        </button>
        <span className="text-zinc-700">·</span>
        <button
          type="button"
          onClick={() => {
            setRotY(-148);
            setRotX(8);
          }}
          className="hover:text-zinc-100 transition"
        >
          Trasera
        </button>
        <span className="text-zinc-700">|</span>
        <button
          type="button"
          onClick={() => setActiveSide((s) => (s === 'A' ? 'B' : 'A'))}
          className="text-amber-400 hover:text-amber-300 font-medium"
        >
          Cara {activeSide}
        </button>
        <button
          type="button"
          onClick={() => {
            setRotY(-26);
            setRotX(10);
          }}
          className="text-zinc-500 hover:text-zinc-200 ml-1"
          title="Restablecer ángulo"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
