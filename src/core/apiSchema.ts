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
    return new ApiSchema(id, name, new Date(), new Date(), groupId, url);
  }

  static createByFile(id: number, name: string, groupId: number | undefined, filePath: string) {
    return new ApiSchema(id, name, new Date(), new Date(), groupId, undefined, filePath);
  }
}
