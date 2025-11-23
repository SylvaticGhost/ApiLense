import { Result } from '../utils/result.ts';

export class StringValidators {
  static validateSwaggerUrl(url: string): Result {
    if (!url || url.trim() === '')
      return Result.badRequest('URL cannot be empty');

    const lastPart = url.split('/').pop();
    if (
      !lastPart ||
      (!lastPart.endsWith('.json') &&
        !lastPart.endsWith('.yaml') &&
        !lastPart.endsWith('.yml'))
    ) {
      return Result.badRequest(
        'URL must point to a .json, .yaml, or .yml file',
      );
    }

    return Result.success();
  }

  static validateFilePath(filePath: string): Result {
    if (!filePath || filePath.trim() === '')
      return Result.badRequest('File path cannot be empty');

    try {
      console.log('Validating file path:', filePath);
      Deno.stat(filePath).then();
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        return Result.badRequest(`File not found at path: ${filePath}`);
      } else {
        throw Result.failure('Error accessing file: ' + filePath);
      }
    }
    return Result.success();
  }

  static validateName(name: string): Result {
    if (!name || name.trim() === '')
      return Result.badRequest('Name cannot be empty');

    const trimmed = name.trim();
    if (trimmed.length < 2) return Result.badRequest('Name is too short');
    if (trimmed.length > 100) return Result.badRequest('Name is too long (max 100 chars)');

    // Disallow control characters and newlines (check by char code)
    for (let i = 0; i < trimmed.length; i++) {
      const code = trimmed.charCodeAt(i);
      if (code === 13 || code === 10 || code < 32) {
        return Result.badRequest('Name contains invalid characters');
      }
    }

    return Result.success();
  }
}
