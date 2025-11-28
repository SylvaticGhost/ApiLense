import {
  ColorName,
  ColorProvider,
} from '../infrastructure/providers/colorProvider.ts';
import NamedColorProvider from '../infrastructure/providers/namedColorProvider.ts';

export class StringBuilder {
  private str: string = '';

  appendLine(line: string = ''): StringBuilder {
    this.str += line + '\n';
    return this;
  }

  append(text: string): StringBuilder {
    this.str += text;
    return this;
  }

  appendStringifiedObject(obj: any): StringBuilder {
    const objStr = JSON.stringify(JSON.parse(obj), null, 2);
    this.str += objStr;
    return this;
  }

  appendBuilderIf(
    condition: boolean | undefined,
    builderFunc: (stringBuilder: StringBuilder) => void,
  ): StringBuilder {
    if (condition) {
      const builder = new StringBuilder();
      builderFunc(builder);
      this.str += builder.toString();
    }
    return this;
  }

  toString(): string {
    return this.str;
  }

  appendColor(text: string, color: ColorName): StringBuilder {
    const colorCode = ColorProvider.getColorCode(color);
    this.str += `${colorCode}${text}${ColorProvider.RESET_CODE}`;
    return this;
  }

  appendHexColor(
    text: string,
    hexCode: string,
    placing: 'foreground' | 'background' = 'foreground',
  ): StringBuilder {
    const colorCode =
      placing === 'foreground'
        ? NamedColorProvider.ansiForegroundFromHex(hexCode)
        : NamedColorProvider.ansiBackgroundFromHex(hexCode);
    this.str += `${colorCode}${text}${NamedColorProvider.RESET}`;
    return this;
  }
}
