import {  } from '@std/fs';

export class SchemaFileRepository {
  private static Location: string = "../../volume/schemas/";

  async getSchemaJsonFromUrl(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.json();
  }

  async writeSchemaFile(fileName: string, content: string) {
    fileName += ".json";
    await Deno.writeTextFile(SchemaFileRepository.Location + fileName, content);
  }

  async getSchemaJsonFromFile(filePath: string) {
    const content = await Deno.readTextFile(filePath);
    return JSON.parse(content);
  }
}
