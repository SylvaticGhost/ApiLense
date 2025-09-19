import { GroupRepository } from "../repositories/group-repo.ts";
import { SchemaRepository } from "../repositories/schema-repo.ts";
import { SchemaFileRepository } from "../repositories/schema-file-repo.ts";
import { DependencyContainer } from "./DependencyContainer.ts";
import { SchemaService } from "../services/schema-service.ts";
import { PrismaClient } from "../../prisma/generated/client.ts";

export class DependencyRegistration {
  constructor(private readonly container: DependencyContainer) {}

  async registerAll(): Promise<void> {
    await this.container.registerAsync(async () => {
      const prismaClient = new PrismaClient();
      await prismaClient.$connect();
      return prismaClient;
    }, "PrismaClient");

    this.container.registerDbRepo(
      (c) => new GroupRepository(c),
      "GroupRepository",
    );

    this.container.registerDbRepo(
      (c) => new SchemaRepository(c),
      "SchemaRepository",
    );

    this.container.register(
      () => new SchemaFileRepository(),
      "SchemaFileRepository",
    );

    this.container.register(
      (c) => {
        const groupRepo = c.resolve<GroupRepository>("GroupRepository");
        const schemaRepo = c.resolve<SchemaRepository>("SchemaRepository");
        const schemaFileRepo = c.resolve<SchemaFileRepository>(
          "SchemaFileRepository",
        );
        return new SchemaService(schemaFileRepo, groupRepo, schemaRepo);
      },
      "SchemaService",
    );
  }
}
