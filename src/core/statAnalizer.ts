import { ApiCallReport } from './apiCallReport.ts';
import { NumericStartReport } from './numericStartReport.ts';

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

export class NumericStatAnalizer {
  constructor(private readonly data: number[]) {}

  getMin(): number {
    return Math.min(...this.data);
  }

  getMax(): number {
    return Math.max(...this.data);
  }

  getAverage(): number {
    const sum = this.data.reduce((a, b) => a + b, 0);
    return sum / this.data.length;
  }

  getPercentile(percentile: number): number {
    const sorted = [...this.data].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    if (Math.floor(index) === index) {
      return sorted[index];
    } else {
      const lower = sorted[Math.floor(index)];
      const upper = sorted[Math.ceil(index)];
      return lower + (upper - lower) * (index - Math.floor(index));
    }
  }

  getMedian(): number {
    return this.getPercentile(50);
  }

  getQ1(): number {
    return this.getPercentile(25);
  }

  getQ3(): number {
    return this.getPercentile(75);
  }

  getIQR(): number {
    return this.getQ3() - this.getQ1();
  }

  getStdDev(): number {
    const avg = this.getAverage();
    const squareDiffs = this.data.map((value) => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff =
      squareDiffs.reduce((a, b) => a + b, 0) / this.data.length;
    return Math.sqrt(avgSquareDiff);
  }

  CV(): number {
    return this.getStdDev() / this.getAverage();
  }

  getNumericStatistics(): NumericStartReport {
    return {
      min: this.getMin(),
      max: this.getMax(),
      average: this.getAverage(),
      median: this.getMedian(),
      stdDev: this.getStdDev(),
      Q1: this.getQ1(),
      Q3: this.getQ3(),
      IQR: this.getIQR(),
      P95: this.getPercentile(95),
      P99: this.getPercentile(99),
    };
  }
}
