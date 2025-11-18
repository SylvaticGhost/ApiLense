import {} from '@std/fs';
import { ensureDir } from '@std/fs';

export class SchemaFileRepository {
  constructor(private readonly location: string) {}

  async getSchemaJsonFromUrl(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.text();
  }

  async writeSchemaFile(fileName: string, content: string) {
    await ensureDir(this.location); // make sure dir exists
    const fullPath = `${this.location}/${fileName}.json`;
    await Deno.writeTextFile(fullPath, content);
  }

  async getSchemaJsonFromFile(filePath: string) {
    const content = await Deno.readTextFile(filePath);
    return JSON.parse(content);
  }

  // async deleteSchemaFile(
}
