import { Table } from 'https://deno.land/x/cliffy@v0.25.4/table/mod.ts';
import { colors } from '@cliffy/ansi/colors';
import { NumericStartReport } from '../core/numericStartReport.ts';
import { NumericStatAnalizer } from '../core/statAnalizer.ts';

export class PlotService {
  displayStatusCodeDistribution(
    data: Map<number, number>,
    maxLength: number = 50,
  ): void {
    if (data.size === 0) return;

    const maxCount = Math.max(...Array.from(data.values()));
    if (maxCount === -Infinity) return;

    const table = new Table().header(['Code', 'Count', 'Chart']).body([]);

    for (const [code, count] of data.entries()) {
      // 2. Нормалізація: розраховуємо довжину стовпчика
      const barLength = Math.round((count / maxCount) * maxLength);

      // 3. Створення "стовпчика" з символів (наприклад, █)
      const bar = '█'.repeat(barLength);

      // 4. Визначаємо колір залежно від статус-коду для кращої візуалізації
      let coloredBar: string;
      if (code >= 200 && code < 300) {
        coloredBar = colors.green(bar); // Успіх
      } else if (code >= 400 && code < 500) {
        coloredBar = colors.yellow(bar); // Помилка клієнта
      } else if (code >= 500) {
        coloredBar = colors.red(bar); // Помилка сервера
      } else {
        coloredBar = colors.gray(bar);
      }

      table.push([
        colors.bold(String(code)), // Статус-код
        count.toString(), // Кількість
        `${coloredBar} (${((count / maxCount) * 100).toFixed(1)}%)`, // Графік та відсоток
      ]);
    }

    console.log(colors.bold('\n📊 Status code distribution:'));
    table.padding(1).border(true).render();
  }

  displayControlChart(
    latencies: number[],
    numericStatistic: NumericStartReport,
    height: number = 20,
  ): void {
    const {
      min: minVal,
      max: maxVal,
      average: avgVal,
      median: medianVal,
      stdDev: stdVal,
      Q1: Q1,
      Q3: Q3,
      IQR: IQR,
    } = numericStatistic;
    const range = maxVal - minVal;

    if (range === 0) {
      return;
    }

    const UCL = Q3 + 1.5 * IQR; // Upper Control Limit
    const LCL = Math.max(0, Q1 - 1.5 * IQR); // Lower Control Limit

    // 1. Функція для масштабування значення до висоти графіку (від 0 до height-1)
    const scale = (value: number) => {
      // Обмежуємо значення, щоб вони не виходили за межі графіку
      const constrainedValue = Math.max(minVal, Math.min(maxVal, value));
      // Масштабування
      return (
        height -
        1 -
        Math.round(((constrainedValue - minVal) / range) * (height - 1))
      );
    };

    // 2. Створення пустої сітки
    const chart: string[][] = Array(height)
      .fill(null)
      .map(() => Array(latencies.length).fill(' '));

    const avgPos = scale(avgVal);
    const medianPos = scale(medianVal);
    const uclPos = scale(UCL);
    const lclPos = scale(LCL);

    // 3. Нанесення контрольних та центральних ліній
    for (let x = 0; x < latencies.length; x++) {
      // Центральна лінія (Середнє) - Синій
      chart[avgPos][x] = colors.blue('-');

      // Верхня контрольна межа (UCL) - Червоний пунктир
      if (uclPos !== avgPos) {
        chart[uclPos][x] = colors.red('=');
      }

      // Нижня контрольна межа (LCL) - Зелений пунктир
      if (lclPos !== avgPos) {
        chart[lclPos][x] = colors.green('=');
      }

      // Медіана (Жовтий) - використовуємо символ '.' для чіткості
      if (medianPos !== avgPos) {
        chart[medianPos][x] = colors.yellow('.');
      }
    }

    // 4. Нанесення точок даних та застосування кольорового кодування
    latencies.forEach((latency, x) => {
      const y = scale(latency);
      let char = colors.cyan('•');

      if (latency > UCL) {
        // Вище верхньої критичної лінії -> Червоний
        char = colors.red.bold('X');
      } else if (latency < LCL) {
        // Нижче нижньої критичної лінії -> Зелений
        char = colors.green.bold('X');
      } else {
        // Всередині контрольних меж -> Стандартний колір
        char = colors.cyan('•');
      }

      // Перевіряємо, чи не замінюємо ми пунктирні лінії контрольних меж точкою
      if (
        chart[y][x] !== colors.red('=') &&
        chart[y][x] !== colors.green('=') &&
        chart[y][x] !== colors.blue('-') &&
        chart[y][x] !== colors.yellow('.')
      ) {
        chart[y][x] = char;
      } else {
        // Якщо точка потрапляє на лінію, просто робимо її жирною
        chart[y][x] = colors.bold(char);
      }
    });

    // 5. Вивід графіку
    console.log(colors.bold('\n📈 Latency control map'));
    console.log();

    for (let y = 0; y < height; y++) {
      const yValue = maxVal - (y / (height - 1)) * range;
      const label = yValue.toFixed(0).padStart(5, ' ') + 'ms |';

      console.log(colors.gray(label) + ' ' + chart[y].join(''));
    }
    console.log('       ' + colors.gray('—'.repeat(latencies.length + 2)));
    console.log('       ' + colors.gray('  Request Number (X)'));

    // 6. Легенда
    console.log(
      `\n${colors.blue('—')} Average: ${avgVal.toFixed(2)}ms`,
      `\n${colors.red('=')} UCL: ${UCL.toFixed(2)}ms`,
      `\n${colors.green('=')} LCL : ${LCL.toFixed(2)}ms`,
      `\n${colors.yellow('.')} Median: ${medianVal.toFixed(2)}ms`,
      `\n σ=${stdVal.toFixed(2)}`,
      `\n Q1=${Q1.toFixed(2)}ms`,
      `\n Q3=${Q3.toFixed(2)}ms`,
      `\n IQR=${IQR.toFixed(2)}ms`,
    );
    console.log(
      `\n${colors.red.bold('X')} Above UCL`,
      `\n${colors.green.bold('X')} Below LCL`,
      `\n${colors.cyan('•')} Within Control Limits`,
    );
  }

  displayNumericStatisticsByThread(statsByThread: NumericStartReport[]): void {
    const medians = statsByThread.map((stats) => stats.median);
    const medianAnalizer = new NumericStatAnalizer(medians);
    const medianCV = medianAnalizer.CV();

    console.log(colors.bold('\n📊 Numeric statistics by thread:'));
    const table = new Table()
      .header([
        'Thread',
        'Min (ms)',
        'Max (ms)',
        'Average (ms)',
        'Median (ms)',
        'Std Dev (ms)',
        'Q1 (ms)',
        'Q3 (ms)',
        'IQR (ms)',
        'P95 (ms)',
        'P99 (ms)',
      ])
      .body([]);

    statsByThread.forEach((stats, index) => {
      table.push([
        (index + 1).toString(),
        stats.min.toFixed(2),
        stats.max.toFixed(2),
        stats.average.toFixed(2),
        stats.median.toFixed(2),
        stats.stdDev.toFixed(2),
        stats.Q1.toFixed(2),
        stats.Q3.toFixed(2),
        stats.IQR.toFixed(2),
        stats.P95.toFixed(2),
        stats.P99.toFixed(2),
      ]);
    });

    console.log(table.toString());
    console.log();
    console.log(
      `Coefficient of Variation (CV) of Medians across threads: ${this.getColorByCV(medianCV)}`,
    );
    console.log();
  }

  private getColorByCV(cv: number): string {
    const percent = (cv * 100).toFixed(2) + '%';
    if (cv < 0.1) return colors.green(percent);
    else if (cv < 0.25) return colors.yellow(percent);
    else return colors.red(percent);
  }
}
