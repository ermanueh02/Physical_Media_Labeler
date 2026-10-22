import { TemplateId } from '../types/cassette';

/**
 * Generates minimalist, iconic 1970s/1980s graphic design LP cover art (Swiss / Bauhaus / Saville / Hipgnosis / ECM style)
 * with generous negative space and zero visual clutter.
 */
export function getPresetCoverSvgDataUrl(preset: TemplateId | 'synthwave' | 'darkside'): string {
  let svg = '';

  switch (preset) {
    case 'cbs-epic':
      // Minimalist late-70s warm sunset circle on deep slate (CBS / ECM / Bauhaus style)
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#18181A"/>
        <circle cx="500" cy="480" r="240" fill="#B83227"/>
        <rect x="260" y="540" width="480" height="190" fill="#18181A"/>
        <line x1="200" y1="540" x2="800" y2="540" stroke="#F3ECDA" stroke-width="4"/>
        <line x1="260" y1="595" x2="740" y2="595" stroke="#E8993E" stroke-width="2.5" opacity="0.7"/>
      </svg>`;
      break;

    case 'emi-harvest':
      // Minimalist 1973 prism geometry on matte charcoal
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
      // Clean Peter Saville / Factory Records 1983 color-block minimalism
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#0F172A"/>
        <rect x="220" y="220" width="560" height="560" fill="#D9381E"/>
        <rect x="360" y="360" width="280" height="280" fill="#F8FAFC"/>
      </svg>`;
      break;

    case 'deutsche-grammophon':
      // Minimalist acoustic gold ring on warm obsidian
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#141210"/>
        <circle cx="500" cy="500" r="240" fill="none" stroke="#E5B822" stroke-width="5"/>
        <circle cx="500" cy="500" r="190" fill="none" stroke="#E5B822" stroke-width="1.5" opacity="0.5"/>
        <circle cx="500" cy="500" r="12" fill="#E5B822"/>
      </svg>`;
      break;

    case 'mixtape-tdk-maxell':
    default:
      // Clean Braun / Dieter Rams / Maxell gold-and-charcoal horizontal stripes
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
