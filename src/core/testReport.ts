import { ApiCallReport } from './apiCallReport.ts';

export class TestReport {
  mode: 'single' | 'multiple';
  reports: ApiCallReport | ApiCallReport[][];

  constructor(
    mode: 'single' | 'multiple',
    reports: ApiCallReport | ApiCallReport[][],
  ) {
    this.mode = mode;
    this.reports = reports;
  }

  static single(report: ApiCallReport): TestReport {
    return new TestReport('single', report);
  }

  static multiple(reportsByThread: ApiCallReport[][]): TestReport {
    return new TestReport('multiple', reportsByThread);
  }
}
