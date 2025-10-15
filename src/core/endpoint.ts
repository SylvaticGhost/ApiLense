import { Template } from './template.ts';
import { HTTP_METHODS, type HttpMethod } from './constants.ts';

export class Endpoint {
  name: string;
  method: HttpMethod;
  path: string;
  template: Template;

  constructor(
    name: string,
    method: HttpMethod,
    path: string,
    template: Template,
  ) {
    this.name = name;
    this.method = method;
    this.path = path;
    this.template = template;
  }

  static createFromJson(data: any): Endpoint {
    const rawMethod = (data.method ?? '').toUpperCase();
    if (!(rawMethod in HTTP_METHODS)) {
      throw new Error(`Unsupported HTTP method: "${data.method}"`);
    }

    const path = data.url ?? data.path;
    if (!path || typeof path !== 'string') {
      throw new Error(`Endpoint path/url is required`);
    }

    const template = Template.createFromJson(data);
    return new Endpoint(
      data.name ?? path,
      rawMethod as HttpMethod,
      path,
      template,
    );
  }
}
