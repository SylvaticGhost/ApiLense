import { Template } from './template.ts';
import { HTTP_METHODS, type HttpMethod } from './enums.ts';

export class EndpointMetaData {
  schemaId: number;
  name: string;
  method: HttpMethod;
  path: string;

  constructor(
    schemaId: number,
    name: string,
    method: HttpMethod,
    path: string,
  ) {
    this.schemaId = schemaId;
    this.name = name;
    this.method = method;
    this.path = path;
  }
}

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

  toMetaData(schemaId: number): EndpointMetaData {
    return new EndpointMetaData(schemaId, this.name, this.method, this.path);
  }

  static fileName(path: string, method: HttpMethod): string {
    return `${path.replace(/\//g, '_')}_${method}.json`;
  }

  fileName(): string {
    return Endpoint.fileName(this.path, this.method);
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
