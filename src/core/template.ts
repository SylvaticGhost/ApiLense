export interface EndpointParam {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export class Template {
  params: EndpointParam[];
  body?: Record<string, any>;

  constructor(params: EndpointParam[], body?: Record<string, any>) {
    this.params = params;
    this.body = body;
  }

  static createFromJson(data: any): Template {
    const params: EndpointParam[] = (data.params || []).map((p: any) => ({
      name: p.name,
      type: p.type ?? 'string',
      required: p.required ?? false,
      description: p.description,
    }));

    return new Template(params, data.body ?? undefined);
  }
}
