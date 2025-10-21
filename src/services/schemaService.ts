import { LoadSchemaArgs } from '../contracts/schemaCommandsArgs.ts';
import { Result } from '../utils/result.ts';
import { StringValidators } from '../validators/stringValidators.ts';
import { SchemaFileRepository } from '../repositories/schemaFileRepo.ts';
import { GroupRepository } from '../repositories/groupRepo.ts';
import { SchemaRepository } from '../repositories/schemaRepo.ts';
import { ApiSchema } from '../core/apiSchema.ts';
import { Group } from "../core/group.ts";

export type SchemaListItem = {
  id: number;
  name: string;
  group?: Group;
  createdAt: Date;
  updatedAt: Date;
};

export class SchemaService {
  [x: string]: any;
  removeSchema(_args: { id: string | undefined; name: string | undefined; }) {
    throw new Error("Method not implemented.");
  }
  constructor(
    private readonly schemaFileRepo: SchemaFileRepository,
    private readonly groupRepo: GroupRepository,
    private readonly schemaRepo: SchemaRepository,
  ) {}

  async getSchemas(options: { groupName?: string; page?: number; size?: number }): Promise<SchemaListItem[]> {
    const schemasFromDb = await this.schemaRepo.findMany(options);

    return schemasFromDb.map(s => ({
      id: s.id,
      name: s.name,
      group: s.Group ? new Group(s.Group.id, s.Group.name, s.Group.createdAt, s.Group.updatedAt, s.Group.color, []) : undefined,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

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
    fabricFunc: (id: number, name: string, groupId: number | undefined, source: string) => ApiSchema,
  ): Promise<Result> {
    const validationResult = validationFunc(input);
    if (validationResult.isFailure()) {
      return validationResult;
    }

    const content = await retrievalFunc(input);

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

    await this.schemaFileRepo.writeSchemaFile(schemaName, content);

    const schema = fabricFunc(newSchemaId, schemaName, groupId, input);
    await this.schemaRepo.save(schema);

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
