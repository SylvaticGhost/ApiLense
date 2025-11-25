import { HttpMethod } from '../../core/enums.ts';

export const COLORS = {
  BLACK: 'black',
  RED: 'red',
  GREEN: 'green',
  YELLOW: 'yellow',
  BLUE: 'blue',
  MAGENTA: 'magenta',
  CYAN: 'cyan',
  WHITE: 'white',
  GRAY: 'gray',
  RESET: 'reset',
};

export type ColorName = keyof typeof COLORS;

const colorCodes: Record<ColorName, string> = {
  BLACK: '\x1b[30m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  GRAY: '\x1b[90m',
  RESET: '\x1b[0m',
};

const HttpMethodsColorMap: Record<HttpMethod, ColorName> = {
  GET: 'GREEN',
  POST: 'BLUE',
  PUT: 'YELLOW',
  DELETE: 'RED',
  PATCH: 'MAGENTA',
  OPTIONS: 'CYAN',
  HEAD: 'GRAY',
};

export class ColorProvider {
  static getColorCode(colorName: ColorName): string {
    return colorCodes[colorName];
  }

  static getHttpMethodColor(method: HttpMethod): ColorName {
    return HttpMethodsColorMap[method] || 'GRAY';
  }

  static RESET_CODE = '\x1b[0m';
}
