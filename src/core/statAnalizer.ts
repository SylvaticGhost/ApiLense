import { ApiCallReport } from './apiCallReport.ts';
import {
  NumericStatAnalizer,
  NumericStartReport,
} from '@api-lense/api-lense-math';

export class StatAnalizer {
  constructor(private readonly data: ApiCallReport[][]) {}

  private statusCodeDistributionDict: Map<number, number> | null = null;

  statusCodeDistribution(): Map<number, number> {
    this.statusCodeDistributionDict = new Map<number, number>();

    for (const threadReports of this.data) {
      for (const report of threadReports) {
        const count =
          this.statusCodeDistributionDict.get(report.statusCode) || 0;
        this.statusCodeDistributionDict.set(report.statusCode, count + 1);
      }
    }

    return this.statusCodeDistributionDict;
  }

  successPercentage(): number {
    if (!this.statusCodeDistributionDict) {
      this.statusCodeDistributionDict = this.statusCodeDistribution();
    }

    let successCount = 0;
    let totalCount = 0;

    for (const [statusCode, count] of this.statusCodeDistributionDict) {
      totalCount += count;
      if (statusCode >= 200 && statusCode < 300) {
        successCount += count;
      }
    }

    return (successCount / totalCount) * 100;
  }

  flatLatencyList(): number[] {
    const latencies: number[] = [];
    for (const threadReports of this.data) {
      for (const report of threadReports) {
        latencies.push(report.timeTakenMs);
      }
    }
    return latencies;
  }
  private latencyList: number[] | null = null;

  getNumericStatistics(): NumericStartReport {
    this.latencyList = this.flatLatencyList();
    return new NumericStatAnalizer(this.latencyList).getNumericStatistics();
  }

  getNumericStatisticByThread() {
    const statsByThread: NumericStartReport[] = [];
    for (const threadReports of this.data) {
      const latencies: number[] = threadReports.map(
        (report) => report.timeTakenMs,
      );
      const stats = new NumericStatAnalizer(latencies).getNumericStatistics();
      statsByThread.push(stats);
    }
    return statsByThread;
  }
}
