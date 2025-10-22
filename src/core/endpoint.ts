import { Template } from './template.ts';
import { HTTP_METHODS, type HttpMethod } from './enums.ts';

export class Endpoint {
  name: string;
  method: HttpMethod;
  path: string;
  template: Template;
  responses: number[] = [];

  constructor(
    name: string,
    method: HttpMethod,
    path: string,
    template: Template,
    responses: number[] = [],
  ) {
    this.name = name;
    this.method = method;
    this.path = path;
    this.template = template;
    this.responses = responses;
  }

  static createFromJson(data: any): Endpoint {
    const rawMethod = (data.method ?? '').toUpperCase();
    if (!(rawMethod in HTTP_METHODS)) {
      throw new Error(`Unsupported HTTP method: "${data.method}"`);
    }

    const path = data.url ?? data.path;
    if (!path || typeof path !== 'string') {
      throw new Error('Endpoint path/url is required');
    }

    const template = Template.createFromJson(data);
    const responses = Array.isArray(data.responses)
      ? data.responses
          .map((x: any) => Number(x))
          .filter((n: unknown) => Number.isFinite(n))
      : [];

    return new Endpoint(
      data.name ?? path,
      rawMethod as HttpMethod,
      path,
      template,
      responses,
    );
  }
}
