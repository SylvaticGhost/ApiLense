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

  static getDirFromFilePath(filePath: string): string {
    const parts = filePath.replace(/\\/g, '/').split('/');
    parts.pop();
    return parts.join('/');
  }
}
