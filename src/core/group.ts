import { ApiSchema } from './ApiSchema.ts';

export class Group {
  id: number;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  Schemas: ApiSchema[];

  constructor(
    id: number,
    name: string,
    createdAt: Date,
    updatedAt: Date,
    color?: string,
    schemas?: ApiSchema[],
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.Schemas = schemas ?? [];
  }
}
