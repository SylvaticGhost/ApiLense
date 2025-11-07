import { colors } from '@cliffy/ansi/colors';

export class StatementPrinter {
  static statusCodeColor(statusCode: number): string {
    if (statusCode >= 500) return `❌⚙️ ${colors.red(statusCode.toString())}`;
    if (statusCode >= 400)
      return `❌📲 ${colors.rgb24(statusCode.toString(), 0xffa500)}`;
    if (statusCode >= 300) return `🔀 ${colors.cyan(statusCode.toString())}`;
    if (statusCode >= 200) return `✅ ${colors.green(statusCode.toString())}`;
    return colors.gray(statusCode.toString());
  }
}
