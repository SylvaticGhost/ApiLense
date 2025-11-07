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
}
