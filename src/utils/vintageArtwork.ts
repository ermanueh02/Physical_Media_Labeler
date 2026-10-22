import { TemplateId } from '../types/cassette';

/**
 * Generates minimalist, iconic 1970s/1980s graphic design LP cover art
 * with generous negative space and zero visual clutter.
 */
export function getPresetCoverSvgDataUrl(preset: TemplateId | 'synthwave' | 'darkside'): string {
  let svg = '';

  switch (preset) {
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
