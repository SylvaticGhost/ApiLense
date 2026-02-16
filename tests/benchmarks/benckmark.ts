import v8 from 'node:v8';
import process from 'node:process';
import { NumericStatAnalizer } from '@api-lense/api-lense-math';

type RunResult = {
  timeMs: number;
  heapUsedBeforeGcMB: number;
  totalHeapSizeBeforeGcMB: number;
  heapUsedAfterGcMB: number;
  totalHeapSizeAfterGcMB: number;
  cpuUsage: number;
};

export class Benchmark {
  static async run(
    name: string,
    func: () => Promise<void> | void,
    iterations: number = 10,
  ): Promise<void> {
    const results: RunResult[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await func();

      const end = performance.now();

      const timeMs = end - start;
      const cpuUsage = process.cpuUsage();

      const memoryBeforeGc = v8.getHeapStatistics();
      if (typeof (globalThis as any).gc === 'function') {
        (globalThis as any).gc();
      }
      const memoryAfterGc = v8.getHeapStatistics();

      const heapUsedBeforeGcMb =
        Math.round((memoryBeforeGc.used_heap_size / 1024 / 1024) * 100) / 100;
      const totalHeapSizeBeforeGcMb =
        Math.round((memoryBeforeGc.total_heap_size / 1024 / 1024) * 100) / 100;
      const heapUsedAfterGcMb =
        Math.round((memoryAfterGc.used_heap_size / 1024 / 1024) * 100) / 100;
      const totalHeapSizeAfterGcMb =
        Math.round((memoryAfterGc.total_heap_size / 1024 / 1024) * 100) / 100;
      const result: RunResult = {
        timeMs,
        heapUsedBeforeGcMB: heapUsedBeforeGcMb,
        totalHeapSizeBeforeGcMB: totalHeapSizeBeforeGcMb,
        heapUsedAfterGcMB: heapUsedAfterGcMb,
        totalHeapSizeAfterGcMB: totalHeapSizeAfterGcMb,
        cpuUsage: cpuUsage.user + cpuUsage.system,
      };

      results.push(result);
    }

    const mergedResult = this.mergeResults(results);
    this.printResult(mergedResult, name);
  }

  static positionalInlineData(results: RunResult[]): number[][] {
    const timeMsList = results.map((r) => r.timeMs);
    const heapUsedBeforeGcMBList = results.map((r) => r.heapUsedBeforeGcMB);
    const totalHeapSizeBeforeGcMBList = results.map(
      (r) => r.totalHeapSizeBeforeGcMB,
    );
    const heapUsedAfterGcMBList = results.map((r) => r.heapUsedAfterGcMB);
    const totalHeapSizeAfterGcMBList = results.map(
      (r) => r.totalHeapSizeAfterGcMB,
    );
    const cpuUsageList = results.map((r) => r.cpuUsage);

    return [
      timeMsList,
      heapUsedBeforeGcMBList,
      totalHeapSizeBeforeGcMBList,
      heapUsedAfterGcMBList,
      totalHeapSizeAfterGcMBList,
      cpuUsageList,
    ];
  }

  static mergeResults(results: RunResult[]): RunResult {
    const inlined = this.positionalInlineData(results);
    return {
      timeMs: new NumericStatAnalizer(inlined[0]).getAverage(),
      heapUsedBeforeGcMB: new NumericStatAnalizer(inlined[1]).getAverage(),
      totalHeapSizeBeforeGcMB: new NumericStatAnalizer(inlined[2]).getAverage(),
      heapUsedAfterGcMB: new NumericStatAnalizer(inlined[3]).getAverage(),
      totalHeapSizeAfterGcMB: new NumericStatAnalizer(inlined[4]).getAverage(),
      cpuUsage: new NumericStatAnalizer(inlined[5]).getAverage(),
    };
  }

  static printResult(result: RunResult, benchmarkName: string): void {
    console.info(`Benchmark: ${benchmarkName}`);
    console.table({
      'Time (ms)': result.timeMs.toFixed(2),
      'Heap Used Before GC (MB)': result.heapUsedBeforeGcMB.toFixed(2),
      'Total Heap Size Before GC (MB)':
        result.totalHeapSizeBeforeGcMB.toFixed(2),
      'Heap Used After GC (MB)': result.heapUsedAfterGcMB.toFixed(2),
      'Total Heap Size After GC (MB)': result.totalHeapSizeAfterGcMB.toFixed(2),
      'CPU Usage (μs)': result.cpuUsage.toFixed(2),
    });
  }
}
