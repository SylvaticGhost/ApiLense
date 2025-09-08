import { Result } from "../utils/result.ts";

export class StringValidators {
  static validateSwaggerUrl(url: string): Result {
    if(!url || url.trim() === "")
      return Result.badRequest("URL cannot be empty");

    const lastPart = url.split('/').pop();
    if (!lastPart || (!lastPart.endsWith('.json') && !lastPart.endsWith('.yaml') && !lastPart.endsWith('.yml'))) {
      return Result.badRequest("URL must point to a .json, .yaml, or .yml file");
    }

    return Result.success();
  }

  static validateFilePath(filePath: string): Result {
    if (!filePath || filePath.trim() === "")
      return Result.badRequest("File path cannot be empty");

    try {
      console.log("Validating file path:", filePath);
      Deno.stat(filePath).then();
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        return Result.badRequest(`File not found at path: ${filePath}`);
      } else {
        throw Result.failure("Error accessing file: " + filePath);
      }
    }
    return Result.success();
  }
}
