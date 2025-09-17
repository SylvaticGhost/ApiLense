import { Group } from "./group.ts";
import { SchemaLastUsing } from "./schema-last-using.ts";

export class ApiSchema {
  id: number;
  name: string;
  url: string;
  groupId?: number;
  group?: Group;
  createdAt: Date;
  updatedAt: Date;
  lastUsing?: SchemaLastUsing;

  constructor(
    id: number,
    name: string,
    url: string,
    createdAt: Date,
    updatedAt: Date,
    groupId?: number,
    group: Group | undefined = undefined,
    lastUsing: SchemaLastUsing | undefined = undefined,
  ) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.groupId = groupId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.lastUsing = lastUsing;
    this.group = group;
  }
}
