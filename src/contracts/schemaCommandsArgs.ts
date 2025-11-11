export interface LoadSchemaArgs {
  file?: string;
  url?: string;
  name?: string;
  group?: string;
}

export interface ListSchemaArgs {
  group?: string;
  page: number;
  size?: number;
}

export interface SchemaListItemDto {
  id: number;
  name: string;
  source: string;
  createdAt: Date;
  modifiedAt: Date;
  groupName?: string;
}