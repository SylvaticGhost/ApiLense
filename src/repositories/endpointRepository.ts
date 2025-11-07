import { Endpoint } from '../core/endpoint.ts';
import { FileSystemBasedRepository } from './Bases/fileSystemBasedRepository.ts';

export class EndpointRepository extends FileSystemBasedRepository {
  getEndpoint(schemaId: number, enpointPath: string): Promise<Endpoint | null> {
    enpointPath = enpointPath.replace(/\//g, '_');
    let filePath = `volume/schemas/${schemaId}/endpoints/${enpointPath}`;
    if (!filePath.endsWith('.json')) filePath += '.json';
    return super.readObjectFromFileWithFactory<Endpoint>(
      filePath,
      Endpoint.fromStoredJson,
    );
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

  private getFilePath(schemaId: number, endpoint: Endpoint) {
    return `volume/schemas/${schemaId}/endpoints/${endpoint.fileName()}`;
  }

  private ensureSchemaDirectory(schemaId: number): Promise<void> {
    const dirPath = `volume/schemas/${schemaId}/endpoints`;
    return super.ensureDirectoryExists(dirPath);
  }
}
