import { TemplateId } from '../types/cassette';

/**
 * Generates minimalist, iconic 1970s/1980s graphic design LP cover art
 * with generous negative space and zero visual clutter.
 */
export function getPresetCoverSvgDataUrl(preset: TemplateId | 'synthwave' | 'darkside'): string {
  let svg = '';

  switch (preset) {
    case 'awesome-mix-quill':
      // Peter Quill / Star-Lord 1970s Supertape Cosmic Striping Artwork
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#181512"/>
        <circle cx="500" cy="460" r="290" fill="#F48C06" opacity="0.16"/>
        <rect x="0" y="310" width="1000" height="75" fill="#FAA307"/>
        <rect x="0" y="400" width="1000" height="90" fill="#E85D04"/>
        <rect x="0" y="505" width="1000" height="95" fill="#D00000"/>
        <rect x="0" y="615" width="1000" height="55" fill="#9D0208"/>
        <circle cx="500" cy="485" r="190" fill="#EADFC5" stroke="#181512" stroke-width="18"/>
        <circle cx="500" cy="485" r="55" fill="#181512"/>
      </svg>`;
      break;

    case 'full-bleed-art':
      // Full-bleed warm 70s Autumn illustration (inspired by Autumn Tape II / #FCD8B7)
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <defs>
          <linearGradient id="autumnSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FCD8B7"/>
            <stop offset="55%" stop-color="#F4A261"/>
            <stop offset="100%" stop-color="#E76F51"/>
          </linearGradient>
        </defs>
        <rect width="1000" height="1000" fill="url(#autumnSky)"/>
        <circle cx="500" cy="430" r="240" fill="#FFF3E0" opacity="0.88"/>
        <path d="M 0 680 Q 260 580 540 660 T 1000 620 L 1000 1000 L 0 1000 Z" fill="#9B2226" opacity="0.85"/>
        <path d="M 0 760 Q 340 690 660 760 T 1000 730 L 1000 1000 L 0 1000 Z" fill="#3D1E1E"/>
        <line x1="0" y1="840" x2="1000" y2="840" stroke="#FCD8B7" stroke-width="4" opacity="0.4"/>
      </svg>`;
      break;

    case 'cbs-epic':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#18181A"/>
        <circle cx="500" cy="480" r="240" fill="#B83227"/>
        <rect x="260" y="540" width="480" height="190" fill="#18181A"/>
        <line x1="200" y1="540" x2="800" y2="540" stroke="#F3ECDA" stroke-width="4"/>
        <line x1="260" y1="595" x2="740" y2="595" stroke="#E8993E" stroke-width="2.5" opacity="0.7"/>
      </svg>`;
      break;

    case 'emi-harvest':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#141413"/>
        <line x1="0" y1="575" x2="432" y2="475" stroke="#FAF7F0" stroke-width="8"/>
        <polygon points="562,445 1000,360 1000,382 567,457" fill="#D9381E"/>
        <polygon points="567,457 1000,382 1000,404 572,469" fill="#E8993E"/>
        <polygon points="572,469 1000,404 1000,426 577,481" fill="#E5B822"/>
        <polygon points="577,481 1000,426 1000,448 582,493" fill="#2E7D5B"/>
        <polygon points="582,493 1000,448 1000,470 587,505" fill="#2B5B84"/>
        <polygon points="500,310 660,585 340,585" fill="#141413" stroke="#FAF7F0" stroke-width="8"/>
      </svg>`;
      break;

    case 'warner-sire':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#0F172A"/>
        <rect x="220" y="220" width="560" height="560" fill="#D9381E"/>
        <rect x="360" y="360" width="280" height="280" fill="#F8FAFC"/>
      </svg>`;
      break;

    case 'deutsche-grammophon':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#141210"/>
        <circle cx="500" cy="500" r="240" fill="none" stroke="#E5B822" stroke-width="5"/>
        <circle cx="500" cy="500" r="190" fill="none" stroke="#E5B822" stroke-width="1.5" opacity="0.5"/>
        <circle cx="500" cy="500" r="12" fill="#E5B822"/>
      </svg>`;
      break;

    case 'ecm-records':
      // Minimalist ECM Nordic horizon landscape
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="620" fill="#DCE4EC"/>
        <rect y="620" width="1000" height="380" fill="#1E293B"/>
        <line x1="0" y1="620" x2="1000" y2="620" stroke="#94A3B8" stroke-width="2"/>
      </svg>`;
      break;

    case 'factory-benelux':
      // Industrial Saville diagonal hazard / architectural bars
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#18181B"/>
        <line x1="200" y1="800" x2="800" y2="200" stroke="#E2E8F0" stroke-width="36"/>
        <line x1="280" y1="880" x2="880" y2="280" stroke="#64748B" stroke-width="12"/>
      </svg>`;
      break;

    case 'blue-note-rvg':
      // Reid Miles Blue Note duotone block
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#0C1928"/>
        <rect x="140" y="140" width="340" height="720" fill="#0284C7"/>
        <circle cx="670" cy="500" r="170" fill="#F3ECDA"/>
      </svg>`;
      break;

    case 'basf-chromdioxid':
      // Clean BASF warm orange/black technical block
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#18181B"/>
        <rect x="0" y="340" width="1000" height="180" fill="#EA580C"/>
        <rect x="0" y="550" width="1000" height="60" fill="#FAF7F0"/>
      </svg>`;
      break;

    case 'sub-pop-indie':
      // Stark monochrome indie woodcut / halftone geometric frame
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#141413"/>
        <rect x="180" y="180" width="640" height="640" fill="none" stroke="#F3ECDA" stroke-width="18"/>
        <circle cx="500" cy="500" r="160" fill="#B83227"/>
      </svg>`;
      break;

    case 'tdk-d-index':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#F9F8F4"/>
        <rect x="0" y="0" width="1000" height="180" fill="#D5D4CE"/>
        <polygon points="0,0 420,0 360,180 0,180" fill="#18181B"/>
        <line x1="0" y1="180" x2="1000" y2="180" stroke="#18181B" stroke-width="8"/>
        <line x1="80" y1="360" x2="920" y2="360" stroke="#52525B" stroke-width="4" stroke-dasharray="12 16"/>
        <line x1="80" y1="540" x2="920" y2="540" stroke="#52525B" stroke-width="4" stroke-dasharray="12 16"/>
        <line x1="80" y1="720" x2="920" y2="720" stroke="#52525B" stroke-width="4" stroke-dasharray="12 16"/>
      </svg>`;
      break;

    case 'mixtape-tdk-maxell':
    default:
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#181817"/>
        <rect x="140" y="380" width="720" height="70" fill="#B89241"/>
        <rect x="140" y="475" width="720" height="28" fill="#D4AF37"/>
        <rect x="140" y="528" width="720" height="10" fill="#F3ECDA"/>
      </svg>`;
      break;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Converts an external image URL to a Base64 Data URL so that SVG -> Canvas -> PDF/PNG exports
 * never fail with tainted canvas CORS errors.
 */
export async function ensureDataUrl(url: string): Promise<string> {
  if (!url) return getPresetCoverSvgDataUrl('cbs-epic');
  if (url.startsWith('data:')) return url;

  const tryFetchAsDataUrl = async (target: string): Promise<string> => {
    const res = await fetch(target);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Failed to read blob'));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  try {
    return await tryFetchAsDataUrl(url);
  } catch {
    try {
      return await tryFetchAsDataUrl(`/api/image-proxy?url=${encodeURIComponent(url)}`);
    } catch {
      try {
        return await tryFetchAsDataUrl(`https://wsrv.nl/?url=${encodeURIComponent(url)}`);
      } catch {
        return url;
      }
    }
  }
}

/**
 * Extracts a harmonious background color, dark accent color, and readable ink color
 * from any cover image URL / Data URL (inspired by vhs.texs.org palette extraction).
 */
export async function extractPaletteFromCoverImage(imageUrl: string): Promise<{
  bgHex: string;
  accentHex: string;
  textHex: string;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No 2d ctx');
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let count = 0;
        let darkR = 24;
        let darkG = 24;
        let darkB = 27;
        let maxSat = -1;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          rSum += r;
          gSum += g;
          bSum += b;
          count++;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          if (sat > maxSat && max > 40 && max < 230) {
            maxSat = sat;
            darkR = r;
            darkG = g;
            darkB = b;
          }
        }

        const avgR = Math.round(rSum / count);
        const avgG = Math.round(gSum / count);
        const avgB = Math.round(bSum / count);

        // Soften towards warm paper tint (like #FCD8B7) if bright, or keep rich tone
        const blendR = Math.round(avgR * 0.65 + 252 * 0.35);
        const blendG = Math.round(avgG * 0.65 + 216 * 0.35);
        const blendB = Math.round(avgB * 0.65 + 183 * 0.35);

        const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
        const bgHex = `#${toHex(blendR)}${toHex(blendG)}${toHex(blendB)}`.toUpperCase();
        const accentHex = `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`.toUpperCase();
        const lum = 0.299 * blendR + 0.587 * blendG + 0.114 * blendB;
        const textHex = lum > 135 ? '#000000' : '#FAF7F0';

        resolve({ bgHex, accentHex, textHex });
      } catch {
        resolve({ bgHex: '#FCD8B7', accentHex: '#18181B', textHex: '#000000' });
      }
    };
    img.onerror = () => {
      resolve({ bgHex: '#FCD8B7', accentHex: '#18181B', textHex: '#000000' });
    };
    img.src = imageUrl;
  });
}
