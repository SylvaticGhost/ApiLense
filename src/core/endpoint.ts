import { Template } from './template.ts';

export class Endpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  template: Template;

  constructor(
    name: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    template: Template,
  ) {
    this.name = name;
    this.method = method;
    this.path = path;
    this.template = template;
  }

  static createFromJson(data: any): Endpoint {
    const template = Template.createFromJson(data);
    return new Endpoint(
      data.name,
      data.method,
      data.url || data.path,
      template,
    );
  }
}
