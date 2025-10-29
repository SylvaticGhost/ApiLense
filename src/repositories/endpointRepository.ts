import { Endpoint } from '../core/endpoint.ts';
import { FileSystemBasedRepository } from './Bases/fileSystemBasedRepository.ts';

export class EndpointRepository extends FileSystemBasedRepository {
  getEndpoint(schemaId: number, enpointPath: string): Promise<Endpoint | null> {
    enpointPath = enpointPath.replace(/\//g, '_');
    const filePath = `volume/schemas/${schemaId}/endpoints/${enpointPath}.json`;
    return super.readObjectFromFile<Endpoint>(filePath);
  }

  async saveSchemaEndpoints(
    schemaId: number,
    endpoints: Endpoint[],
  ): Promise<void> {
    await this.ensureSchemaDirectory(schemaId);
    for (const endpoint of endpoints) {
      const filePath = this.getFilePath(schemaId, endpoint);
      await super.writeObjectToFile(filePath, endpoint);
    }
  }

  private getFilePath(schemaId: number, endpoint: Endpoint): string {
    return `volume/schemas/${schemaId}/endpoints/${endpoint.path.replace(/\//g, '_')}_${endpoint.method}.json`;
  }

  private ensureSchemaDirectory(schemaId: number): Promise<void> {
    const dirPath = `volume/schemas/${schemaId}/endpoints`;
    return super.ensureDirectoryExists(dirPath);
  }
}
