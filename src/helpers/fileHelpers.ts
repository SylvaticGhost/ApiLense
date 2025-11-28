export class FileHelpers {
  static getEachDirFromPath(filePath: string): string[] {
    if (!filePath) return [];

    const parts = filePath.replace(/\\/g, '/').split('/');
    const dirs: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      const dir = parts.slice(0, i).join('/');
      if (dir === '') continue;
      dirs.push(dir);
    }
    return dirs;
  }

  static transformFileName(name: string) {
    return name.replace(/\//g, '_');
  }

  static getDirFromFilePath(filePath: string): string {
    const parts = filePath.replace(/\\/g, '/').split('/');
    parts.pop();
    return parts.join('/');
  }

  static async getFilesInDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    try {
      for await (const dirEntry of Deno.readDir(dirPath)) {
        if (dirEntry.isFile) {
          files.push(`${dirPath}/${dirEntry.name}`);
        }
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return [];
      }
      throw error;
    }
    return files;
  }
}
