import { ApiCallReport } from '../core/apiCallReport.ts';
import { ApiCallRequest } from '../core/apiCallRequest.ts';

export class RequestRunner {
  async run(request: ApiCallRequest): Promise<ApiCallReport> {
    const startTime = Date.now();

    const response = await fetch(request.url, {
      method: String(request.method),
      headers: request.headers,
      body: request.body,
    });

    const endTime = Date.now();

    return {
      statusCode: response.status,
      responseBody: await response.text(),
      timeTakenMs: endTime - startTime,
      requestId: request.id,
    };
  }
}
