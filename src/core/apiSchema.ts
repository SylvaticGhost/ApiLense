import { Group } from './group.ts';
import { SchemaLastUsing } from './schemaLastUsing.ts';

export class ApiSchema {
  id: number;
  name: string;
  groupId?: number;
  group?: Group;
  createdAt: Date;
  updatedAt: Date;
  url?: string;
  filePath?: string;
  lastUsing?: SchemaLastUsing;
  source: any;
  sourceType: any;

  constructor(
    id: number,
    name: string,
    createdAt: Date,
    updatedAt: Date,
    groupId?: number,
    url: string | undefined = undefined,
    filePath: string | undefined = undefined,
    group: Group | undefined = undefined,
    lastUsing: SchemaLastUsing | undefined = undefined,
  ) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.filePath = filePath;
    this.groupId = groupId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.lastUsing = lastUsing;
    this.group = group;
  }

  static createByUrl(id: number, name: string, groupId: number | undefined, url: string) {
    const schema = new ApiSchema(id, name, new Date(), new Date(), groupId, url);
    schema.sourceType = 'URL';
    schema.source = url;
    return schema;
  }

  static createByFile(id: number, name: string, groupId: number | undefined, filePath: string) {
    const schema = new ApiSchema(id, name, new Date(), new Date(), groupId, undefined, filePath);
    schema.sourceType = 'FILE';
    schema.source = filePath;
    return schema;
  }
}