import { ApiCallReport } from '../../core/apiCallReport.ts';
import { TestReport } from '../../core/testReport.ts';
import { PlotService } from '../../services/plotService.ts';
import { StringBuilder } from '../stringBuilder.ts';
import { colors } from '@cliffy/ansi/colors';
import { StatementPrinter } from './statementPrinter.ts';
import { StatAnalizer } from '../../core/statAnalizer.ts';
import { NumericStatAnalizer } from '@api-lense/api-lense-math';
import { AggregatedResult } from '../../core/aggregatedResult.ts';

export class TestResultPrinter {
  constructor(
    private readonly plotService: PlotService,
    private readonly printOutput: boolean,
    private readonly analize: boolean,
  ) {}

  print(testReport: TestReport) {
    if (testReport.mode === 'single') this.printSingleTestReport(testReport);
    else if (testReport.mode === 'multiple')
      this.printMultipleTestReport(testReport);
    else if (testReport.mode === 'progression')
      this.printProgressionTestReport(testReport);
    else throw new Error('Invalid mode');
  }

  private printSingleTestReport(testReport: TestReport) {
    const report = testReport.reports as ApiCallReport;
    const sb = new StringBuilder()
      .appendLine()
      .appendLine(colors.bold('📄 API Call Report:'))
      .appendLine(
        `Status: ${StatementPrinter.statusCodeColor(report.statusCode)}`,
      )
      .appendLine(`Response Time: ${report.timeTakenMs} ms`)
      .appendBuilderIf(this.printOutput, (sb) =>
        sb
          .appendLine('Response Body 📩:')
          .appendStringifiedObject(report.responseBody),
      )
      .appendLine();
    console.info(sb.toString());
  }

  private printMultipleTestReport(testReport: TestReport) {
    const reportsByThread = testReport.reports as ApiCallReport[][];
    const sb = new StringBuilder()
      .appendLine()
      .appendLine(
        colors.bold(
          `📄 API Call Reports for ${reportsByThread[0].length} calls in ${reportsByThread.length} threads:`,
        ),
      );

    if (this.printOutput) {
      reportsByThread.forEach((reports, threadIndex) => {
        sb.appendLine()
          .appendLine(colors.underline(`-- Thread ${threadIndex + 1} --`))
          .appendLine();

        reports.forEach((report, reportIndex) => {
          sb.appendLine(colors.bold(`Request ${reportIndex + 1}:`))
            .appendLine(
              `Status: ${StatementPrinter.statusCodeColor(report.statusCode)}`,
            )
            .appendLine(`Response Time: ${report.timeTakenMs} ms`);
        });
      });
    }

    console.info(sb.toString());

    if (this.analize) {
      const statAnalizer = new StatAnalizer(reportsByThread);
      this.plotService.displayStatusCodeDistribution(
        statAnalizer.statusCodeDistribution(),
      );

      const numericStartReport = statAnalizer.getNumericStatistics();

      this.plotService.displayControlChart(
        statAnalizer.flatLatencyList(),
        numericStartReport,
      );

      if (reportsByThread.length > 1)
        this.plotService.displayNumericStatisticsByThread(
          statAnalizer.getNumericStatisticByThread(),
        );
    }
  }

  private printProgressionTestReport(testReport: TestReport) {
    const reports: ApiCallReport[][] = testReport.reports as ApiCallReport[][];
    const sb = new StringBuilder();
    const maxConcurrency =
      reports.length > 0 ? reports[reports.length - 1].length : 0;
    sb.appendLine(
      `📄 API Call Reports in progression from 1 to ${maxConcurrency}`,
    );

    if (this.printOutput) {
      reports.forEach((reportsByIteration, index) => {
        sb.appendLine()
          .appendLine(colors.underline(`-- Iteration ${index + 1} --`))
          .appendLine();

        reportsByIteration.forEach((report, reportIndex) => {
          sb.appendLine(colors.bold(`Request ${reportIndex + 1}:`))
            .appendLine(
              `Status: ${StatementPrinter.statusCodeColor(report.statusCode)}`,
            )
            .appendLine(`Response Time: ${report.timeTakenMs} ms`);
        });
      });
    }

    console.info(sb.toString());

    const aggregatedResults: AggregatedResult[] = [];
    reports.forEach((reportsByIteration, index) => {
      const analizer = new NumericStatAnalizer(
        reportsByIteration.map((r) => r.timeTakenMs),
      );
      aggregatedResults.push({
        x: index + 1,
        avgLatency: analizer.getAverage(),
        maxLatency: analizer.getMax(),
        minLatency: analizer.getMin(),
      });
    });

    this.plotService.displayLoadTestStatisticsTable(aggregatedResults);
  }
}
