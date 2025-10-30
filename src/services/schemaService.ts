import { LoadSchemaArgs } from '../contracts/schemaCommandsArgs.ts';
import { Result } from '../utils/result.ts';
import { StringValidators } from '../validators/stringValidators.ts';
import { SchemaFileRepository } from '../repositories/schemaFileRepo.ts';
import { GroupRepository } from '../repositories/groupRepo.ts';
import { SchemaRepository } from '../repositories/schemaRepo.ts';
import { ApiSchema } from '../core/apiSchema.ts';
import { parseApiSchemaFromText } from '../mapper/schemaParser.ts';
import { Endpoint } from '../core/endpoint.ts';
import { EndpointRepository } from '../repositories/endpointRepository.ts';
import { EndpointMetaDataRepository } from '../repositories/enpointMetaDataRepository.ts';

export class SchemaService {
  constructor(
    private readonly schemaFileRepo: SchemaFileRepository,
    private readonly groupRepo: GroupRepository,
    private readonly schemaRepo: SchemaRepository,
    private readonly endpointRepo: EndpointRepository,
    private readonly endpointMetaDataRepository: EndpointMetaDataRepository,
  ) {}

  async loadSchema(args: LoadSchemaArgs): Promise<Result> {
    if (args.url) {
      return await this.loadSchemaFromSource(
        args.url,
        args,
        StringValidators.validateSwaggerUrl,
        this.schemaFileRepo.getSchemaJsonFromUrl,
        ApiSchema.createByUrl,
      );
    } else if (args.file) {
      return await this.loadSchemaFromSource(
        args.file,
        args,
        StringValidators.validateFilePath,
        this.schemaFileRepo.getSchemaJsonFromFile,
        ApiSchema.createByFile,
      );
    } else {
      return Result.failure('Either url or file must be provided', 400);
    }
  }

  /**
   * Loads an API schema from a specified source, validates it, retrieves its content,
   * parses endpoints, checks group existence, ensures schema name uniqueness, writes the schema file,
   * constructs the schema object, and saves it to the repository.
   *
   * @param input - The source identifier (e.g., file path, URL, etc.) for the schema.
   * @param args - Arguments for loading the schema, including group and optional name.
   * @param validationFunc - Function to validate the input source.
   * @param retrievalFunc - Asynchronous function to retrieve the schema content from the source.
   * @param fabricFunc - Factory function to create an `ApiSchema` instance.
   * @returns A `Promise` resolving to a `Result` containing the new schema ID on success, or an error result on failure.
   */
  private async loadSchemaFromSource(
    input: string,
    args: LoadSchemaArgs,
    validationFunc: (input: string) => Result,
    retrievalFunc: (input: string) => Promise<string>,
    fabricFunc: (
      id: number,
      name: string,
      groupId: number | undefined,
      source: string,
    ) => ApiSchema,
  ): Promise<Result> {
    const validationResult = validationFunc(input);
    if (validationResult.isFailure()) {
      return validationResult;
    }

    const content: string = await retrievalFunc(input);

    const groupCheckResult = await this.CheckGroupExists(args.group);
    if (groupCheckResult.isFailure()) {
      return groupCheckResult;
    }

    const groupId = groupCheckResult.castValue<number>() ?? undefined;

    if (args.name && (await this.schemaRepo.isNameUsed(args.name))) {
      return Result.badRequest(`Schema with name ${args.name} already exists`);
    }

    const newSchemaId = (await this.schemaRepo.lastId()) + 1;
    const schemaName = args.name ?? `Schema_${newSchemaId}`;

    const endpoints: Endpoint[] = await parseApiSchemaFromText(content);
    const schema = fabricFunc(newSchemaId, schemaName, groupId, input);

    await this.schemaRepo.save(schema);
    await this.endpointRepo.saveSchemaEndpoints(newSchemaId, endpoints);

    const metaDatas = endpoints.map((e) => e.toMetaData(newSchemaId));
    await this.endpointMetaDataRepository.saveAll(metaDatas);

    return Result.success(newSchemaId);
  }

  private async CheckGroupExists(
    groupRef: string | undefined,
  ): Promise<Result> {
    if (!groupRef) {
      return Result.success();
    }

    let groupId = Number(groupRef);
    if (!isNaN(groupId)) {
      const groupExists = await this.groupRepo.exists(groupId);
      if (!groupExists) {
        return Result.badRequest(`Group with id ${groupId} does not exist`);
      }
    } else {
      const group = await this.groupRepo.getByName(groupRef);
      if (!group) {
        return Result.badRequest(`Group with name ${groupRef} does not exist`);
      }

      groupId = group.id;
    }
    return Result.success(groupId);
  }
}
