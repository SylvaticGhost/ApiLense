export class SchemaLastUsing {
  schemaId: number;
  lastUsedAt: Date;

  constructor(schemaId: number, lastUsedAt: Date) {
    this.schemaId = schemaId;
    this.lastUsedAt = lastUsedAt;
  }
}
