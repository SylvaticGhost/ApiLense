import { Result } from '../../utils/result.ts';

export class NamedColorProvider {
  // store hex without '#' and uppercase
  static COLORS: Record<string, string> = {
    black: '000000',
    white: 'FFFFFF',
    red: 'FF0000',
    green: '008000',
    lime: '00FF00',
    blue: '0000FF',
    yellow: 'FFFF00',
    cyan: '00FFFF',
    magenta: 'FF00FF',
    gray: '808080',
    orange: 'FFA500',
    purple: '800080',
    pink: 'FFC0CB',
    brown: 'A52A2A',
    teal: '008080',
    olive: '808000',
    navy: '000080',
    maroon: '800000',
    silver: 'C0C0C0',
    gold: 'D4AF37',
    violet: 'EE82EE',
    indigo: '4B0082',
    coral: 'FF7F50',
    khaki: 'F0E68C',
  };

  static normalizeHex(raw: string): string | undefined {
    if (!raw) return undefined;
    const val = raw.trim().replace('#', '');
    if (/^[A-Fa-f0-9]{3}$/.test(val)) {
      // expand
      const r = val[0];
      const g = val[1];
      const b = val[2];
      return (r + r + g + g + b + b).toUpperCase();
    }
    if (/^[A-Fa-f0-9]{6}$/.test(val)) return val.toUpperCase();
    return undefined;
  }

  static getHexForColor(colorName: string): string | undefined {
    if (!colorName) return undefined;
    const key = colorName.trim().toLowerCase();
    return NamedColorProvider.COLORS[key];
  }

  static hasHexForColor(colorName: string): boolean {
    return !!NamedColorProvider.getHexForColor(colorName);
  }

  static findNameForHex(hexCode: string): string | undefined {
    const normalized = NamedColorProvider.normalizeHex(hexCode);
    if (!normalized) return undefined;
    const entry = Object.entries(NamedColorProvider.COLORS).find(
      ([, v]) => v.toUpperCase() === normalized,
    );
    return entry ? entry[0] : undefined;
  }

  static hexToRgb(
    hexCode: string,
  ): { r: number; g: number; b: number } | undefined {
    const normalized = NamedColorProvider.normalizeHex(hexCode);
    if (!normalized) return undefined;
    const r = parseInt(normalized.substr(0, 2), 16);
    const g = parseInt(normalized.substr(2, 2), 16);
    const b = parseInt(normalized.substr(4, 2), 16);
    return { r, g, b };
  }

  static ansiForegroundFromHex(hexCode: string): string {
    return NamedColorProvider.ansiColoring(hexCode, 38);
  }

  static ansiBackgroundFromHex(hexCode: string): string {
    return NamedColorProvider.ansiColoring(hexCode, 48);
  }

  private static ansiColoring(hexCode: string, code: number): string {
    hexCode ??= this.COLORS.gray;
    const rgb = NamedColorProvider.hexToRgb(hexCode);
    if (!rgb) return '';
    return `\x1b[${code};2;${rgb.r};${rgb.g};${rgb.b}m`;
  }

  static RESET = '\x1b[0m';

  static colorizeTextByHex(hexCode: string, text: string): string {
    const rgb = NamedColorProvider.hexToRgb(hexCode);
    if (!rgb) return text;
    // Use foreground (text) color with 24-bit color escape
    return `\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m${text}${NamedColorProvider.RESET}`;
  }

  static fromString(colorNameOrHex: string | undefined): string | undefined {
    let colorHex: string | undefined;
    if (colorNameOrHex) {
      const raw = String(colorNameOrHex).trim();
      const normalizedHex = NamedColorProvider.normalizeHex(raw);
      if (normalizedHex) colorHex = normalizedHex;
      else {
        const hexForName = NamedColorProvider.getHexForColor(raw);
        if (!hexForName) {
          console.error(
            'Color must be either a known color name or valid hex (e.g. #ff00ff)',
          );
          return;
        }
        colorHex = hexForName;
      }
    }
    return colorHex;
  }
}

export default NamedColorProvider;
