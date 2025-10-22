import { Result } from '../result.ts';

export class SchemaCommandPrinters {
  static updateSchema(result: any) {
    throw new Error("Method not implemented.");
  }
  static loadSchema(result: Result) {
    if (result.isSuccess()) {
      console.log('Schema loaded successfully.');
    } else {
      console.error('Failed to load schema:', result.errorMessage);
    }
  }
}
