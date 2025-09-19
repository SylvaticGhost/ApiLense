import {  } from '@std/fs';
import { ensureDir } from '@std/fs';

export class SchemaFileRepository {
  private static Location: string = "/Users/Kostia/code/ApiLens/volume/schemas";

  async getSchemaJsonFromUrl(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.text();
  }

  async writeSchemaFile(fileName: string, content: string) {
    await ensureDir(SchemaFileRepository.Location); // make sure dir exists
    const fullPath = `${SchemaFileRepository.Location}/${fileName}.json`;
    await Deno.writeTextFile(fullPath, content);
  }

  async getSchemaJsonFromFile(filePath: string) {
    const content = await Deno.readTextFile(filePath);
    return JSON.parse(content);
  }
}
