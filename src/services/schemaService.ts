import {
  LoadSchemaArgs,
  ListSchemaArgs,
  SchemaListItemDto,
} from '../contracts/schemaCommandsArgs.ts';
import { Result } from '../utils/result.ts';
import { StringValidators } from '../validators/stringValidators.ts';
import { SchemaFileRepository } from '../repositories/schemaFileRepo.ts';
import { GroupRepository } from '../repositories/groupRepo.ts';
import { SchemaRepository } from '../repositories/schemaRepo.ts';
import { ApiSchema } from '../core/apiSchema.ts';
import { Group } from '../core/group.ts';
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
    const groupId = groupCheckResult.value;
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

  async getSchemas(args: ListSchemaArgs): Promise<Result> {
    const groupResult = await this.CheckGroupExists(args.group);
    if (groupResult.isFailure()) {
      return groupResult;
    }
    const groupId = groupResult.value;

    const schemasFromDb = await this.schemaRepo.find({
      groupId: groupId,
      page: args.page,
      size: args.size,
    });

    const dtos: SchemaListItemDto[] = schemasFromDb.map((s) => ({
      id: s.id,
      name: s.name,
      source: s.url || s.filePath || 'No Source',
      createdAt: s.createdAt,
      modifiedAt: s.updatedAt,
      groupName: s.Group ? s.Group.name : 'No Group',
    }));

    return Result.success(dtos);
  }

  private async CheckGroupExists(
    groupRef: string | undefined,
  ): Promise<Result> {
    if (!groupRef) {
      return Result.success(undefined);
    }

    let group: Group | null = null;
    const groupId = Number(groupRef);

    if (!isNaN(groupId)) {
      group = await this.groupRepo.getById(groupId);
      if (!group) {
        return Result.badRequest(`Group with id ${groupId} does not exist`);
      }
    } else {
      group = await this.groupRepo.getByName(groupRef);
      if (!group) {
        return Result.badRequest(`Group with name ${groupRef} does not exist`);
      }
    }

    return Result.success(group.id);
  }
}