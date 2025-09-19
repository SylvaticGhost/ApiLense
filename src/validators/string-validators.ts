import { Result } from "../utils/result.ts";

export class StringValidators {
  static validateSwaggerUrl(url: string): Result {
    //TODO: @SofiaDivine Implement URL validation logic
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
