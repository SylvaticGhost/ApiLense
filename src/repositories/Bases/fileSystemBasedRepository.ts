import { FileHelpers } from '../../helpers/fileHelpers.ts';

export abstract class FileSystemBasedRepository {
  protected ensureDirectoryExists(dirPath: string): Promise<void> {
    return Deno.mkdir(dirPath, { recursive: true });
  }

  protected async fileExistst(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return false;
      }
      throw error;
    }
  }

  protected async writeObjectToFile<T>(
    filePath: string,
    data: T,
  ): Promise<void> {
    await this.ensureDirectoryExists(FileHelpers.getDirFromFilePath(filePath));
    await Deno.writeTextFile(filePath, JSON.stringify(data, null, 2));
  }

  protected async readObjectFromFile<T>(filePath: string): Promise<T> {
    try {
      const text = await Deno.readTextFile(filePath);
      return JSON.parse(text) as T;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }
}
