export interface LoadSchemaArgs {
  url?: string;
  file?: string;
  name?: string;
  group?: string;
}

export interface SchemaRemoveArgs {
  id: number;
}

export interface SchemaListArgs {
  group?: string;
  page: number;
  size: number;
  detailed?: boolean;
}