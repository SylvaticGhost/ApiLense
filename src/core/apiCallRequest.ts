import { ApiSchema } from './apiSchema.ts';
import { Endpoint } from './endpoint.ts';
import { HTTP_METHODS, HttpMethod, PARAM_TYPE } from './enums.ts';
import { TemplateFilling } from './templateFilling.ts';

export class ApiCallRequest {
  id: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body: any | null;

  private constructor(
    id: string,
    url: string,
    method: HttpMethod,
    headers: Record<string, string>,
    body: any | null,
  ) {
    this.id = id;
    this.url = url;
    this.method = method;
    this.headers = headers;
    this.body = body;
  }

  canHaveBody(): boolean {
    return (
      this.method !== HTTP_METHODS.GET && this.method !== HTTP_METHODS.HEAD
    );
  }

  static create(
    schema: ApiSchema,
    endpoint: Endpoint,
    filling: TemplateFilling | null,
  ): ApiCallRequest {
    let url = `${schema.baseUrl() ?? ''}${endpoint.path}`;

    const headers: Record<string, string> = {};

    if (filling) {
      for (const param of endpoint.template.params) {
        if (param.paramType === PARAM_TYPE.HEADER)
          headers[param.name] = filling.getParamValue(param.name) ?? '';
        else if (param.paramType === PARAM_TYPE.PATH)
          url = url.replace(
            `{${param.name}}`,
            filling.getParamValue(param.name) ?? '',
          );
        else if (param.paramType === PARAM_TYPE.QUERY)
          url += `?${param.name}=${filling.getParamValue(param.name) ?? ''}`;
      }
    }

    const requestId = crypto.randomUUID();

    return new ApiCallRequest(
      requestId,
      url,
      endpoint.method,
      headers,
      filling?.bodyFilling,
    );
  }
}
