import { Endpoint } from '../core/endpoint.ts';

export class EndpointRepository {
  constructor() {}

  async saveSchemaEndpoints(
    schemaId: number,
    endpoints: Endpoint[],
  ): Promise<void> {
    await this.EnsureSchemaDirectory(schemaId);
    for (const endpoint of endpoints) {
      const filePath = this.getFilePath(schemaId, endpoint);
      await Deno.writeTextFile(filePath, JSON.stringify(endpoint, null, 2));
    }
  }

  private getFilePath(schemaId: number, endpoint: Endpoint): string {
    return `volume/schemas/${schemaId}/endpoints/${endpoint.path.replace(/\//g, '_')}_${endpoint.method}.json`;
  }

  private async EnsureSchemaDirectory(schemaId: number): Promise<void> {
    const dirPath = `volume/lsschemas/${schemaId}/endpoints`;
    await Deno.mkdir(dirPath, { recursive: true });
  }
}
