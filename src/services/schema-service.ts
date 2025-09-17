import { LoadSchemaArgs } from "../contracts/SchemaCommandsContracts.ts";
import { Result } from "../utils/result.ts";
import { StringValidators } from "../validators/string-validators.ts";
import { SchemaFileRepository } from "../repositories/schema-file-repo.ts";
import { GroupRepository } from "../repositories/group-repo.ts";
import { SchemaRepository } from "../repositories/schema-repo.ts";
import { ApiSchema } from "../core/api-schema.ts";

export class SchemaService {
  constructor(
    private readonly schemaFileRepo: SchemaFileRepository,
    private readonly groupRepo: GroupRepository,
    private readonly schemaRepo: SchemaRepository,
  ) {
  }

  async loadSchema(args: LoadSchemaArgs): Promise<Result> {
    if (args.url) {
      return await this.loadSchemaFromSource(args.url, args, StringValidators.validateSwaggerUrl, this.schemaFileRepo.getSchemaJsonFromUrl)
    } else if (args.file) {
      return await this.loadSchemaFromSource(args.file, args, StringValidators.validateFilePath, this.schemaFileRepo.getSchemaJsonFromFile)
    } else {
      return Result.failure("Either url or file must be provided", 400);
    }
  }

  private async loadSchemaFromSource(
    input: string,
    args: LoadSchemaArgs,
    validationFunc: (input: string) => Result,
    retrievalFunc: (input: string) => Promise<string>,
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

    if (args.name && await this.schemaRepo.isNameUsed(args.name)) {
      return Result.badRequest(
        `Schema with name ${args.name} already exists`,
      );
    }

    const newSchemaId = (await this.schemaRepo.lastId()) + 1;
    const schemaName = args.name ?? `Schema_${newSchemaId}`;

    await this.schemaFileRepo.writeSchemaFile(schemaName, content);

    const url = this.extractApiUrl(args.url, content);
    const schema = new ApiSchema(
      newSchemaId,
      schemaName,
      url,
      new Date(),
      new Date(),
      groupId,
    );

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

  //TODO: @SofiaDivine Add extractor of API url from given url or content
  private extractApiUrl(url?: string, content?: string): string {
    return url ?? "";
  }
}
