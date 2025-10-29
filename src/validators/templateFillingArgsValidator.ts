import { Result } from '../utils/result.ts';

export class TemplateFillingArgsValidator {
  static validateArgs(args: any): Result {
    const name = args.templateName;
    if (typeof name !== 'string' || name.trim() === '')
      return Result.badRequest('Template name must be a non-empty string');

    const schemaId = args.schemaId;
    if (
      !schemaId ||
      typeof schemaId !== 'number' ||
      isNaN(schemaId) ||
      schemaId <= 0
    )
      return Result.badRequest('Schema ID must be a positive number');

    const endpointName = args.endpointName;
    if (typeof endpointName !== 'string' || endpointName.trim() === '')
      return Result.badRequest('Endpoint name must be a non-empty string');
  }
}
