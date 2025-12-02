import { ApiCallReport } from '../../src/core/apiCallReport.ts';
import { StatAnalizer } from '../../src/core/statAnalizer.ts';

function geneterateApiCallReports(i: number, j: number): ApiCallReport[][] {
  const result: ApiCallReport[][] = [];
  for (let thread = 0; thread < i; thread++) {
    const threadReports: ApiCallReport[] = [];
    for (let call = 0; call < j; call++) {
      const report: ApiCallReport = {
        statusCode: 200,
        responseBody: undefined as unknown as string,
        timeTakenMs: Math.floor(Math.random() * 1000),
        requestId: crypto.randomUUID(),
      };
      threadReports.push(report);
    }
    result.push(threadReports);
  }
  return result;
}

function registerStatAnalyzerBench(i: number, j: number) {
  const dataset = geneterateApiCallReports(i, j);
  Deno.bench(
    `StatAnalizer#getNumericStatistics (${i}, ${j}), total ${i * j}`,
    () => {
      const analizer = new StatAnalizer(dataset);
      analizer.getNumericStatistics();
    },
  );
}

registerStatAnalyzerBench(10, 1000);
registerStatAnalyzerBench(30, 3000);
registerStatAnalyzerBench(40, 4000);
registerStatAnalyzerBench(50, 5000);
registerStatAnalyzerBench(60, 6000);
registerStatAnalyzerBench(70, 7000);
registerStatAnalyzerBench(80, 8000);
registerStatAnalyzerBench(90, 9000);
registerStatAnalyzerBench(100, 10000);
registerStatAnalyzerBench(110, 11000);
