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
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
      return threadReports;
    });

    const results = await Promise.all(threadPromises);
    return results;
  }
}
