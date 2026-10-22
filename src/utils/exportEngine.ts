import { jsPDF } from 'jspdf';
import { CassetteProject, PHYSICAL_SPECS } from '../types/cassette';
import { ensureDataUrl } from './vintageArtwork';

/**
 * Rasterizes an SVG DOM element into a high-resolution PNG Data URL at the specified pixel dimensions.
 * Automatically clones the SVG, sets explicit viewBox & pixel dimensions, and ensures images are inlined.
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

  // Inline any external <image href="..."> as data URLs so canvas is never tainted
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

/**
 * Generates an A4 print-ready PDF at exact 1:1 millimeter scale (300 DPI raster + vector crop/registration marks)
 */
export async function exportPrintReadyPdfA4(
  project: CassetteProject,
  jcardSvgEl: SVGSVGElement,
  labelsSvgEl: SVGSVGElement
): Promise<void> {
  const extraPanelsCount =
    project.foldFormat === 'j-plus-2' ? 2 : project.foldFormat === 'j-plus-1' ? 1 : 0;

  const flapW = PHYSICAL_SPECS.FLAP_WIDTH_MM; // 19
  const spineW = PHYSICAL_SPECS.SPINE_WIDTH_MM; // 12.5
  const frontW = PHYSICAL_SPECS.FRONT_WIDTH_MM; // 65
  const panelW = PHYSICAL_SPECS.EXTRA_PANEL_WIDTH_MM; // 65
  const jcardW = flapW + spineW + frontW + extraPanelsCount * panelW; // 96.5, 161.5, or 226.5 mm
  const jcardH = PHYSICAL_SPECS.JCARD_HEIGHT_MM; // 102 mm

  const labelW = PHYSICAL_SPECS.LABEL_WIDTH_MM; // 89 mm
  const labelH = PHYSICAL_SPECS.LABEL_HEIGHT_MM; // 42 mm

  // Use landscape A4 (297 x 210 mm) if J+2 (226.5 mm) is selected so it fits at strict 1:1 scale
  const isLandscape = jcardW > 190;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageW = isLandscape ? 297 : 210;
  const pageH = isLandscape ? 210 : 297;

  // Header Technical Print Sheet Info
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(25, 25, 25);
  pdf.text(
    `HOJA TÉCNICA DE IMPRESIÓN 1:1 (300 DPI) — ${project.albumTitle.toUpperCase()} (${project.catalogNumber})`,
    12,
    11
  );
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.2);
  pdf.setTextColor(90, 90, 90);
  pdf.text(
    `IMPORTANTE: Imprimir en papel A4 al 100% de escala ("Tamaño real" / "Escala 100%", desactivar "Ajustar a página").`,
    12,
    15.2
  );

  // 50 mm Physical Verification Ruler at Top-Right
  const rulerX = pageW - 65;
  const rulerY = 12;
  pdf.setDrawColor(20, 20, 20);
  pdf.setLineWidth(0.25);
  pdf.line(rulerX, rulerY, rulerX + 50, rulerY);
  for (let mm = 0; mm <= 50; mm += 5) {
    const tickH = mm % 10 === 0 ? 2.2 : 1.2;
    pdf.line(rulerX + mm, rulerY - tickH, rulerX + mm, rulerY);
  }
  pdf.setFontSize(6);
  pdf.text('REGLA DE VERIFICACIÓN FÍSICA: 50.0 mm EXACTOS (1:1)', rulerX, rulerY + 3.2);

  // 1. Render exact J-Card crop (0, 0, jcardW, jcardH) at 300 DPI
  const pxPerMm = PHYSICAL_SPECS.MM_TO_PX_300DPI;
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
  const jcardY = 24;

  // Place J-Card at exact 1:1 physical millimeter dimensions
  pdf.addImage(jcardDataUrl, 'PNG', jcardX, jcardY, jcardW, jcardH);

  // Vector Exterior Crop Marks & Fold Guides for J-Card
  pdf.setDrawColor(220, 38, 38); // Precision Red Crop Marks
  pdf.setLineWidth(0.2);
  const cropLen = 5;
  const cropGap = 1.5;

  // 4 outer corners
  // Top-Left
  pdf.line(jcardX - cropGap - cropLen, jcardY, jcardX - cropGap, jcardY);
  pdf.line(jcardX, jcardY - cropGap - cropLen, jcardX, jcardY - cropGap);
  // Top-Right
  pdf.line(jcardX + jcardW + cropGap, jcardY, jcardX + jcardW + cropGap + cropLen, jcardY);
  pdf.line(jcardX + jcardW, jcardY - cropGap - cropLen, jcardX + jcardW, jcardY - cropGap);
  // Bottom-Left
  pdf.line(jcardX - cropGap - cropLen, jcardY + jcardH, jcardX - cropGap, jcardY + jcardH);
  pdf.line(jcardX, jcardY + jcardH + cropGap, jcardX, jcardY + jcardH + cropGap + cropLen);
  // Bottom-Right
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

  // Vector Fold Tick Marks (Lomo 19mm, Portada 31.5mm, Paneles extra)
  pdf.setDrawColor(14, 165, 233); // Cyan Fold Marks
  const foldOffsets = [flapW, flapW + spineW];
  if (extraPanelsCount >= 1) foldOffsets.push(flapW + spineW + frontW);
  if (extraPanelsCount >= 2) foldOffsets.push(flapW + spineW + frontW + panelW);

  for (const offset of foldOffsets) {
    const fx = jcardX + offset;
    pdf.line(fx, jcardY - cropGap - 3.5, fx, jcardY - cropGap);
    pdf.line(fx, jcardY + jcardH + cropGap, fx, jcardY + jcardH + cropGap + 3.5);
  }

  // Vector Registration Targets (Marcas de Registro)
  const drawRegistrationMark = (rx: number, ry: number) => {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.18);
    pdf.circle(rx, ry, 1.8, 'S');
    pdf.circle(rx, ry, 0.7, 'S');
    pdf.line(rx - 2.8, ry, rx + 2.8, ry);
    pdf.line(rx, ry - 2.8, rx, ry + 2.8);
  };

  drawRegistrationMark(jcardX - 7, jcardY + jcardH / 2);
  drawRegistrationMark(jcardX + jcardW + 7, jcardY + jcardH / 2);

  // Dimension Label under J-Card
  pdf.setFontSize(6.5);
  pdf.setTextColor(80, 80, 80);
  pdf.text(
    `J-CARD DESPLEGADA: ${jcardW} mm × ${jcardH} mm (Solapa: 19 mm | Lomo: 12.5 mm | Frontal: 65 mm${
      extraPanelsCount > 0 ? ` | +${extraPanelsCount} Panel(es) de 65 mm` : ''
    })`,
    jcardX,
    jcardY + jcardH + 6.5
  );

  // 2. Render Cassette Labels A & B (each 89 mm x 42 mm) at 300 DPI
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
    labelH + 12, // Side B starts at y = 42 + 12 = 54 mm in CassetteLabelsSvgRenderer
    labelW,
    labelH,
    labelPxW,
    labelPxH
  );

  if (isLandscape) {
    // Place Label A and Label B side-by-side below the J-Card on Landscape A4
    const labelsY = jcardY + jcardH + 14;
    const gapX = 14;
    const totalLabelsW = labelW * 2 + gapX;
    const startX = (pageW - totalLabelsW) / 2;

    pdf.addImage(labelADataUrl, 'PNG', startX, labelsY, labelW, labelH);
    pdf.addImage(labelBDataUrl, 'PNG', startX + labelW + gapX, labelsY, labelW, labelH);

    // Crop marks around Label A & B
    pdf.setDrawColor(220, 38, 38);
    for (const lx of [startX, startX + labelW + gapX]) {
      pdf.line(lx - 4, labelsY, lx - 1, labelsY);
      pdf.line(lx, labelsY - 4, lx, labelsY - 1);
      pdf.line(lx + labelW + 1, labelsY, lx + labelW + 4, labelsY);
      pdf.line(lx + labelW, labelsY - 4, lx + labelW, labelsY - 1);
      pdf.line(lx - 4, labelsY + labelH, lx - 1, labelsY + labelH);
      pdf.line(lx, labelsY + labelH + 1, lx, labelsY + labelH + 4);
      pdf.line(lx + labelW + 1, labelsY + labelH, lx + labelW + 4, labelsY + labelH);
      pdf.line(lx + labelW, labelsY + labelH + 1, lx + labelW, labelsY + labelH + 4);
    }

    pdf.setFontSize(6.5);
    pdf.text(
      `ETIQUETAS ADHESIVAS DE CARTUCHO (CARA A Y CARA B): 89.0 mm × 42.0 mm CADA UNA`,
      startX,
      labelsY + labelH + 6
    );
  } else {
    // Portrait A4: Stack Label A and Label B centered below the J-Card
    const labelX = (pageW - labelW) / 2;
    const labelAY = jcardY + jcardH + 16;
    const labelBY = labelAY + labelH + 12;

    pdf.addImage(labelADataUrl, 'PNG', labelX, labelAY, labelW, labelH);
    pdf.addImage(labelBDataUrl, 'PNG', labelX, labelBY, labelW, labelH);

    pdf.setDrawColor(220, 38, 38);
    for (const ly of [labelAY, labelBY]) {
      pdf.line(labelX - 4, ly, labelX - 1, ly);
      pdf.line(labelX, ly - 4, labelX, ly - 1);
      pdf.line(labelX + labelW + 1, ly, labelX + labelW + 4, ly);
      pdf.line(labelX + labelW, ly - 4, labelX + labelW, ly - 1);
      pdf.line(labelX - 4, ly + labelH, labelX - 1, ly + labelH);
      pdf.line(labelX, ly + labelH + 1, labelX, ly + labelH + 4);
      pdf.line(labelX + labelW + 1, ly + labelH, labelX + labelW + 4, ly + labelH);
      pdf.line(labelX + labelW, ly + labelH + 1, labelX + labelW, ly + labelH + 4);
    }

    drawRegistrationMark(labelX - 8, labelAY + labelH / 2);
    drawRegistrationMark(labelX + labelW + 8, labelBY + labelH / 2);

    pdf.setFontSize(6.5);
    pdf.text(
      `ETIQUETA CARA A (89.0 × 42.0 mm)`,
      labelX,
      labelAY - 2
    );
    pdf.text(
      `ETIQUETA CARA B (89.0 × 42.0 mm)`,
      labelX,
      labelBY - 2
    );
  }

  // Footer
  pdf.setFontSize(6);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    `Generado con Norelco Studio • Plantilla: ${project.templateId.toUpperCase()} • ${project.tapeCapacity} • ${project.tapeBias}`,
    12,
    pageH - 6
  );

  const safeFileName =
    project.albumTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'cassette-jcard';

  pdf.save(`${safeFileName}-jcard-a4-300dpi.pdf`);
}

/**
 * Generates a 2000 x 2000 px Square (1:1) PNG image suitable for a Spotify digital playlist cover,
 * showcasing the vintage J-Card front + spine + cassette sticker composition.
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

  // 1. Studio Dark Analog Background with Subtle Radial Vignette
  const grad = ctx.createRadialGradient(SIZE * 0.5, SIZE * 0.45, 100, SIZE * 0.5, SIZE * 0.5, 1350);
  grad.addColorStop(0, '#27272A');
  grad.addColorStop(0.6, '#141417');
  grad.addColorStop(1, '#09090B');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Fine Studio Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 2;
  for (let pos = 0; pos < SIZE; pos += 80) {
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(SIZE, pos);
    ctx.stroke();
  }

  // 2. Render Spine + Front Cover of J-Card (from x = 19 mm to x = 96.5 mm -> width 77.5 mm x height 102 mm)
  const jcardCropW = 12.5 + 65; // 77.5 mm
  const jcardCropH = 102; // 102 mm
  const targetJCardH = 1480;
  const targetJCardW = Math.round((jcardCropW / jcardCropH) * targetJCardH); // ~1124 px

  const jcardPngUrl = await renderSvgElementToPngDataUrl(
    jcardSvgEl,
    19, // start at Spine (skip 19mm back flap for clean front+spine showcase)
    0,
    jcardCropW,
    jcardCropH,
    targetJCardW,
    targetJCardH
  );

  // 3. Render Side A Cassette Label (89 x 42 mm)
  const targetLabelW = 920;
  const targetLabelH = Math.round((42 / 89) * targetLabelW); // ~434 px
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

  // Draw J-Card with Norelco Acrylic Case Frame & Drop Shadow
  const jx = 180;
  const jy = 210;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
  ctx.shadowBlur = 65;
  ctx.shadowOffsetX = 28;
  ctx.shadowOffsetY = 36;

  // Outer Norelco Clear Plastic Bezel
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(jx - 16, jy - 16, targetJCardW + 32, targetJCardH + 32);
  ctx.restore();

  ctx.drawImage(jcardImg, jx, jy, targetJCardW, targetJCardH);

  // Spine Fold Crease Shadow Line
  const spinePx = Math.round((12.5 / jcardCropW) * targetJCardW);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(jx + spinePx, jy);
  ctx.lineTo(jx + spinePx, jy + targetJCardH);
  ctx.stroke();

  // Draw Overlapping Side A Label Card at Bottom Right
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

  // Top-Right Vintage Technical Header Stamp on the 2000x2000 Canvas
  ctx.fillStyle = project.accentColor;
  ctx.fillRect(1360, 210, 480, 14);
  ctx.fillStyle = '#F4F4F5';
  ctx.font = 'bold 34px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText(project.recordLabel.toUpperCase(), 1360, 272);
  ctx.fillStyle = '#A1A1AA';
  ctx.font = '600 26px "JetBrains Mono", monospace';
  ctx.fillText(`${project.catalogNumber} • ${project.tapeCapacity}`, 1360, 315);
  ctx.fillText(`${project.tapeBias}`, 1360, 352);

  // Trigger Download
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

/**
 * Exports the full CassetteProject state as a .json file
 */
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
