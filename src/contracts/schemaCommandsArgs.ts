import { HttpMethod } from '../core/enums.ts';
import { PagedListArgs } from './commonArgs.ts';

export interface LoadSchemaArgs {
  url?: string;
  file?: string;
  name?: string;
  group?: string;
}

export interface SchemaRemoveArgs {
  id: number;
}

export interface SchemaListArgs extends PagedListArgs {
  group?: string;
  detailed?: boolean;
}

export interface SchemaEndpointsListArgs extends PagedListArgs {
  schemaId: number;
  method?: HttpMethod;
}
