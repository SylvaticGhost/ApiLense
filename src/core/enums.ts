export type ObjectValues<T> = T[keyof T];

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD',
} as const;

export type HttpMethod = ObjectValues<typeof HTTP_METHODS>;


export const BODY_FIELD_TYPES = {
  INT: 'int',
  FLOAT: 'float',
  DATETIME: 'datetime',
  STRING: 'string',
  OBJECT: 'object',
} as const;

export type BodyFieldType = ObjectValues<typeof BODY_FIELD_TYPES>;

export const BODY_FIELD_TYPE_MAP: Record<string, BodyFieldType> = {
  int: BODY_FIELD_TYPES.INT,
  float: BODY_FIELD_TYPES.FLOAT,
  datetime: BODY_FIELD_TYPES.DATETIME,
  string: BODY_FIELD_TYPES.STRING,
  object: BODY_FIELD_TYPES.OBJECT,
};
