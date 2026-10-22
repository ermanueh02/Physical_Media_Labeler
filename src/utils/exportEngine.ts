import { jsPDF } from 'jspdf';
import { CassetteProject, PdfExportMode, PHYSICAL_SPECS } from '../types/cassette';
import { ensureDataUrl } from './vintageArtwork';

/**
 * Rasterizes an SVG DOM element into a high-resolution PNG Data URL at the specified pixel dimensions.
 */
export async function renderSvgElementToPngDataUrl(
  svgElement: SVGSVGElement,
  viewBoxX: number,
  viewBoxY: number,
  viewBoxW: number,
  viewBoxH: number,
  pixelWidth: number,
  pixelHeight: number
): Promise<string> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`);
  clone.setAttribute('width', `${pixelWidth}`);
  clone.setAttribute('height', `${pixelHeight}`);

  const images = Array.from(clone.querySelectorAll('image'));
  for (const img of images) {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href');
    if (href && !href.startsWith('data:')) {
      const safeDataUrl = await ensureDataUrl(href);
      img.setAttribute('href', safeDataUrl);
    }
  }

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(svgBlob);

  try {
    return await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto Canvas 2D'));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = (err) => reject(err);
      img.src = blobUrl;
    });
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function drawPageHeaderAndRuler(
  pdf: jsPDF,
  pageW: number,
  pageH: number,
  sheetTitle: string,
  paperRecommendation: string,
  project: CassetteProject
) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(25, 25, 25);
  pdf.text(sheetTitle, 14, 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(90, 90, 90);
  pdf.text(
    `${paperRecommendation} • Imprimir al 100% de escala ("Tamaño real", sin ajustar a página).`,
    14,
    18.5
  );

  // 50 mm Physical Verification Ruler at Top-Right
  const rulerX = pageW - 64;
  const rulerY = 14;
  pdf.setDrawColor(20, 20, 20);
  pdf.setLineWidth(0.25);
  pdf.line(rulerX, rulerY, rulerX + 50, rulerY);
  for (let mm = 0; mm <= 50; mm += 5) {
    const tickH = mm % 10 === 0 ? 2.2 : 1.2;
    pdf.line(rulerX + mm, rulerY - tickH, rulerX + mm, rulerY);
  }
  pdf.setFontSize(6);
  pdf.text('REGLA DE VERIFICACIÓN: 50.0 mm (1:1)', rulerX, rulerY + 3.2);

  // Footer
  pdf.setFontSize(6.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text(
    `Norelco Studio • ${project.albumTitle} (${project.catalogNumber}) • Plantilla: ${project.templateId.toUpperCase()}`,
    14,
    pageH - 8
  );
}

function drawRegistrationMark(pdf: jsPDF, rx: number, ry: number) {
  pdf.setDrawColor(40, 40, 40);
  pdf.setLineWidth(0.18);
  pdf.circle(rx, ry, 1.8, 'S');
  pdf.circle(rx, ry, 0.7, 'S');
  pdf.line(rx - 2.8, ry, rx + 2.8, ry);
  pdf.line(rx, ry - 2.8, rx, ry + 2.8);
}

/**
 * Generates an A4 print-ready PDF at exact 1:1 millimeter scale (300 DPI).
 * Separates the J-Card (cardstock sheet) from the Cassette Labels (adhesive sticker sheet).
 */
export async function exportPrintReadyPdfA4(
  project: CassetteProject,
  jcardSvgEl: SVGSVGElement,
  labelsSvgEl: SVGSVGElement,
  mode: PdfExportMode = 'separate-2-pages'
): Promise<void> {
  const extraPanelsCount =
    project.foldFormat === 'j-plus-2' ? 2 : project.foldFormat === 'j-plus-1' ? 1 : 0;

  const flapW = PHYSICAL_SPECS.FLAP_WIDTH_MM; // 19
  const spineW = PHYSICAL_SPECS.SPINE_WIDTH_MM; // 12.5
  const frontW = PHYSICAL_SPECS.FRONT_WIDTH_MM; // 65
  const panelW = PHYSICAL_SPECS.EXTRA_PANEL_WIDTH_MM; // 65
  const jcardW = flapW + spineW + frontW + extraPanelsCount * panelW;
  const jcardH = PHYSICAL_SPECS.JCARD_HEIGHT_MM; // 102 mm

  const labelW = PHYSICAL_SPECS.LABEL_WIDTH_MM; // 89 mm
  const labelH = PHYSICAL_SPECS.LABEL_HEIGHT_MM; // 42 mm
  const pxPerMm = PHYSICAL_SPECS.MM_TO_PX_300DPI;

  const isJCardLandscape = jcardW > 190 && mode !== 'labels-only';
  const pdf = new jsPDF({
    orientation: isJCardLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Helper to render the J-Card Sheet (Cartulina) on the current PDF page
  const renderJCardSheetPage = async (pageW: number, pageH: number) => {
    drawPageHeaderAndRuler(
      pdf,
      pageW,
      pageH,
      `HOJA 1: ENCARTE J-CARD (${jcardW} × ${jcardH} mm) — ${project.albumTitle.toUpperCase()}`,
      'SOPORTE RECOMENDADO: Cartulina / Papel Satinado 180–250 g/m²',
      project
    );

    const jcardPxW = Math.round(jcardW * pxPerMm);
    const jcardPxH = Math.round(jcardH * pxPerMm);

    const jcardDataUrl = await renderSvgElementToPngDataUrl(
      jcardSvgEl,
      0,
      0,
      jcardW,
      jcardH,
      jcardPxW,
      jcardPxH
    );

    const jcardX = (pageW - jcardW) / 2;
    const jcardY = (pageH - jcardH) / 2 - 6;

    pdf.addImage(jcardDataUrl, 'PNG', jcardX, jcardY, jcardW, jcardH);

    // Exterior Crop Marks (Red)
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.2);
    const cropLen = 6;
    const cropGap = 1.5;

    // 4 Corners
    pdf.line(jcardX - cropGap - cropLen, jcardY, jcardX - cropGap, jcardY);
    pdf.line(jcardX, jcardY - cropGap - cropLen, jcardX, jcardY - cropGap);

    pdf.line(jcardX + jcardW + cropGap, jcardY, jcardX + jcardW + cropGap + cropLen, jcardY);
    pdf.line(jcardX + jcardW, jcardY - cropGap - cropLen, jcardX + jcardW, jcardY - cropGap);

    pdf.line(jcardX - cropGap - cropLen, jcardY + jcardH, jcardX - cropGap, jcardY + jcardH);
    pdf.line(jcardX, jcardY + jcardH + cropGap, jcardX, jcardY + jcardH + cropGap + cropLen);

    pdf.line(
      jcardX + jcardW + cropGap,
      jcardY + jcardH,
      jcardX + jcardW + cropGap + cropLen,
      jcardY + jcardH
    );
    pdf.line(
      jcardX + jcardW,
      jcardY + jcardH + cropGap,
      jcardX + jcardW,
      jcardY + jcardH + cropGap + cropLen
    );

    // Fold Tick Marks (Cyan)
    pdf.setDrawColor(14, 165, 233);
    const foldOffsets = [flapW, flapW + spineW];
    if (extraPanelsCount >= 1) foldOffsets.push(flapW + spineW + frontW);
    if (extraPanelsCount >= 2) foldOffsets.push(flapW + spineW + frontW + panelW);

    for (const offset of foldOffsets) {
      const fx = jcardX + offset;
      pdf.line(fx, jcardY - cropGap - 4, fx, jcardY - cropGap);
      pdf.line(fx, jcardY + jcardH + cropGap, fx, jcardY + jcardH + cropGap + 4);
    }

    drawRegistrationMark(pdf, jcardX - 8, jcardY + jcardH / 2);
    drawRegistrationMark(pdf, jcardX + jcardW + 8, jcardY + jcardH / 2);

    // Dimension & Folding Instructions under J-Card
    pdf.setFontSize(7);
    pdf.setTextColor(70, 70, 70);
    pdf.text(
      `COTAS DE CORTE Y HENDIDO: Solapa 19.0 mm  |  Lomo 12.5 mm  |  Frontal 65.0 mm${
        extraPanelsCount > 0 ? `  |  +${extraPanelsCount} Panel(es) Interior(es) de 65.0 mm` : ''
      }  (Alto: 102.0 mm)`,
      pageW / 2,
      jcardY + jcardH + 10,
      { align: 'center' }
    );
    pdf.setFontSize(6.5);
    pdf.setTextColor(110, 110, 110);
    pdf.text(
      'Líneas rojas exteriores: corte con cúter/guillotina. Marcas azules superiores/inferiores: hendido y plegado hacia el interior de la caja Norelco.',
      pageW / 2,
      jcardY + jcardH + 14.5,
      { align: 'center' }
    );
  };

  // Helper to render the Adhesive Labels Sheet (Pegatina) on the current PDF page
  const renderLabelsSheetPage = async (pageW: number, pageH: number, sheetLabelNumber: string) => {
    drawPageHeaderAndRuler(
      pdf,
      pageW,
      pageH,
      `${sheetLabelNumber}: ETIQUETAS ADHESIVAS CARA A Y CARA B (89 × 42 mm) — ${project.albumTitle.toUpperCase()}`,
      'SOPORTE RECOMENDADO: Papel Adhesivo / Pegatina A4 (Mate o Satinado)',
      project
    );

    const labelPxW = Math.round(labelW * pxPerMm);
    const labelPxH = Math.round(labelH * pxPerMm);

    const labelADataUrl = await renderSvgElementToPngDataUrl(
      labelsSvgEl,
      0,
      0,
      labelW,
      labelH,
      labelPxW,
      labelPxH
    );

    const labelBDataUrl = await renderSvgElementToPngDataUrl(
      labelsSvgEl,
      0,
      labelH + 12,
      labelW,
      labelH,
      labelPxW,
      labelPxH
    );

    const drawLabelPairWithCrops = (startY: number, setTitle: string) => {
      const lx = (pageW - labelW) / 2;
      const lyA = startY;
      const lyB = startY + labelH + 12;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`${setTitle} — CARA A (89.0 × 42.0 mm)`, lx, lyA - 2);
      pdf.addImage(labelADataUrl, 'PNG', lx, lyA, labelW, labelH);

      pdf.text(`${setTitle} — CARA B (89.0 × 42.0 mm)`, lx, lyB - 2);
      pdf.addImage(labelBDataUrl, 'PNG', lx, lyB, labelW, labelH);

      pdf.setDrawColor(220, 38, 38);
      pdf.setLineWidth(0.2);
      for (const ly of [lyA, lyB]) {
        pdf.line(lx - 5, ly, lx - 1.2, ly);
        pdf.line(lx, ly - 5, lx, ly - 1.2);
        pdf.line(lx + labelW + 1.2, ly, lx + labelW + 5, ly);
        pdf.line(lx + labelW, ly - 5, lx + labelW, ly - 1.2);
        pdf.line(lx - 5, ly + labelH, lx - 1.2, ly + labelH);
        pdf.line(lx, ly + labelH + 1.2, lx, ly + labelH + 5);
        pdf.line(lx + labelW + 1.2, ly + labelH, lx + labelW + 5, ly + labelH);
        pdf.line(lx + labelW, ly + labelH + 1.2, lx + labelW, ly + labelH + 5);
      }

      drawRegistrationMark(pdf, lx - 9, lyA + labelH / 2);
      drawRegistrationMark(pdf, lx + labelW + 9, lyB + labelH / 2);
    };

    // Primary Pair of Stickers (Cara A + Cara B)
    drawLabelPairWithCrops(34, 'JUEGO PRINCIPAL DE ETIQUETAS');

    // Second Spare Pair of Stickers on the same A4 sticker sheet so adhesive paper is utilized practically
    if (pageH >= 280) {
      drawLabelPairWithCrops(156, 'JUEGO DE REPUESTO (COPIA ADICIONAL)');
    }
  };

  if (mode === 'jcard-only') {
    const pageW = isJCardLandscape ? 297 : 210;
    const pageH = isJCardLandscape ? 210 : 297;
    await renderJCardSheetPage(pageW, pageH);
  } else if (mode === 'labels-only') {
    await renderLabelsSheetPage(210, 297, 'HOJA DE PEGATINAS');
  } else {
    // 'separate-2-pages': Page 1 = J-Card (Cartulina), Page 2 = Labels (Pegatina)
    const page1W = isJCardLandscape ? 297 : 210;
    const page1H = isJCardLandscape ? 210 : 297;
    await renderJCardSheetPage(page1W, page1H);

    pdf.addPage('a4', 'portrait');
    await renderLabelsSheetPage(210, 297, 'HOJA 2');
  }

  const safeFileName =
    project.albumTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'cassette';

  const suffix =
    mode === 'jcard-only'
      ? 'jcard-cartulina-a4'
      : mode === 'labels-only'
      ? 'etiquetas-pegatina-a4'
      : 'completo-2-hojas-a4';

  pdf.save(`${safeFileName}-${suffix}.pdf`);
}

/**
 * Generates a 2000 x 2000 px Square (1:1) PNG image suitable for a Spotify digital playlist cover.
 */
export async function exportSquarePlaylistCover2000px(
  project: CassetteProject,
  jcardSvgEl: SVGSVGElement,
  labelsSvgEl: SVGSVGElement
): Promise<void> {
  const SIZE = 2000;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el canvas 2000x2000');

  const grad = ctx.createRadialGradient(SIZE * 0.5, SIZE * 0.45, 100, SIZE * 0.5, SIZE * 0.5, 1350);
  grad.addColorStop(0, '#27272A');
  grad.addColorStop(0.6, '#141417');
  grad.addColorStop(1, '#09090B');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const jcardCropW = 12.5 + 65; // 77.5 mm
  const jcardCropH = 102;
  const targetJCardH = 1480;
  const targetJCardW = Math.round((jcardCropW / jcardCropH) * targetJCardH);

  const jcardPngUrl = await renderSvgElementToPngDataUrl(
    jcardSvgEl,
    19,
    0,
    jcardCropW,
    jcardCropH,
    targetJCardW,
    targetJCardH
  );

  const targetLabelW = 920;
  const targetLabelH = Math.round((42 / 89) * targetLabelW);
  const labelPngUrl = await renderSvgElementToPngDataUrl(
    labelsSvgEl,
    0,
    0,
    89,
    42,
    targetLabelW,
    targetLabelH
  );

  const loadImg = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });

  const [jcardImg, labelImg] = await Promise.all([loadImg(jcardPngUrl), loadImg(labelPngUrl)]);

  const jx = 180;
  const jy = 210;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
  ctx.shadowBlur = 65;
  ctx.shadowOffsetX = 28;
  ctx.shadowOffsetY = 36;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(jx - 16, jy - 16, targetJCardW + 32, targetJCardH + 32);
  ctx.restore();

  ctx.drawImage(jcardImg, jx, jy, targetJCardW, targetJCardH);

  const spinePx = Math.round((12.5 / jcardCropW) * targetJCardW);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(jx + spinePx, jy);
  ctx.lineTo(jx + spinePx, jy + targetJCardH);
  ctx.stroke();

  const lx = SIZE - targetLabelW - 140;
  const ly = SIZE - targetLabelH - 210;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 55;
  ctx.shadowOffsetX = 18;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#18181B';
  ctx.fillRect(lx - 14, ly - 14, targetLabelW + 28, targetLabelH + 28);
  ctx.restore();

  ctx.drawImage(labelImg, lx, ly, targetLabelW, targetLabelH);

  ctx.fillStyle = project.accentColor;
  ctx.fillRect(1360, 210, 480, 14);
  ctx.fillStyle = '#F4F4F5';
  ctx.font = 'bold 34px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText(project.recordLabel.toUpperCase(), 1360, 272);
  ctx.fillStyle = '#A1A1AA';
  ctx.font = '600 26px "JetBrains Mono", monospace';
  ctx.fillText(`${project.catalogNumber} • ${project.tapeCapacity}`, 1360, 315);
  ctx.fillText(`${project.tapeBias}`, 1360, 352);

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  const safeFileName =
    project.albumTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'cassette-cover';
  link.download = `${safeFileName}-spotify-2000x2000.png`;
  link.href = dataUrl;
  link.click();
}

export function exportProjectJson(project: CassetteProject): void {
  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName =
    project.albumTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'proyecto-cassette';
  link.download = `${safeName}.cassette.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
