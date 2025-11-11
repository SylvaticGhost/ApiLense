import { ApiCallReport } from './apiCallReport.ts';

export class TestReport {
  mode: 'single' | 'multiple' | 'progression';
  reports: ApiCallReport | ApiCallReport[][];

  private constructor(
    mode: 'single' | 'multiple' | 'progression',
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

  static progression(reports: ApiCallReport[][]): TestReport {
    return new TestReport('progression', reports);
  }
}
