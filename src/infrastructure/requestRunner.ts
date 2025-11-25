import { ApiCallReport } from '../core/apiCallReport.ts';
import { ApiCallRequest } from '../core/apiCallRequest.ts';

export class RequestRunner {
  async run(request: ApiCallRequest): Promise<ApiCallReport> {
    const startTime = Date.now();

    const requestBody =
      request.canHaveBody() && request.body
        ? {
            method: String(request.method),
            headers: request.headers,
            body: JSON.stringify(request.body),
          }
        : {
            method: String(request.method),
            headers: request.headers,
          };
    requestBody.headers['Content-Type'] = 'application/json';
    requestBody.headers['Accept'] = 'application/json';

    const response = await fetch(request.url, requestBody);

    const endTime = Date.now();

    return {
      statusCode: response.status,
      responseBody: await response.text(),
      timeTakenMs: endTime - startTime,
      requestId: request.id,
    };
  }

  async runMultiple(
    requestsByThread: ApiCallRequest[][],
    delayMs: number,
  ): Promise<ApiCallReport[][]> {
    const threadPromises = requestsByThread.map(async (requests) => {
      const threadReports: ApiCallReport[] = [];
      for (const request of requests) {
        const report = await this.run(request);
        threadReports.push(report);
        await this.delay(delayMs);
      }
      return threadReports;
    });

    const results = await Promise.all(threadPromises);
    return results;
  }

  async runConcurently(
    requestsByIter: ApiCallRequest[][],
    delayMs: number = 0,
  ): Promise<ApiCallReport[][]> {
    const reports: ApiCallReport[][] = [];
    for (let i = 0; i < requestsByIter.length; i++) {
      const reportByOneIter: ApiCallReport[] = [];
      const promises = requestsByIter[i].map(async (request) => {
        const report = await this.run(request);
        reportByOneIter.push(report);
      });
      await Promise.all(promises);
      reports.push(reportByOneIter);
      await this.delay(delayMs);
    }
    return reports;
  }

  private async delay(ms: number) {
    if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
