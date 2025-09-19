import { GroupRepository } from '../repositories/groupRepo.ts';
import { SchemaRepository } from '../repositories/schemaRepo.ts';
import { SchemaFileRepository } from '../repositories/schemaFileRepo.ts';
import { DependencyContainer } from './dependencyContainer.ts';
import { SchemaService } from '../services/schemaService.ts';
import { PrismaClient } from '../../prisma/generated/client.ts';

export class DependencyRegistration {
  constructor(private readonly container: DependencyContainer) {}

  async registerAll(): Promise<void> {
    await this.container.registerAsync(async () => {
      const prismaClient = new PrismaClient();
      await prismaClient.$connect();
      return prismaClient;
    }, 'PrismaClient');

    this.container.registerDbRepo(
      (c) => new GroupRepository(c),
      'GroupRepository',
    );

    this.container.registerDbRepo(
      (c) => new SchemaRepository(c),
      'SchemaRepository',
    );

    this.container.register(
      () => new SchemaFileRepository(),
      'SchemaFileRepository',
    );

    this.container.register((c) => {
      const groupRepo = c.resolve<GroupRepository>('GroupRepository');
      const schemaRepo = c.resolve<SchemaRepository>('SchemaRepository');
      const schemaFileRepo = c.resolve<SchemaFileRepository>(
        'SchemaFileRepository',
      );
      return new SchemaService(schemaFileRepo, groupRepo, schemaRepo);
    }, 'SchemaService');
  }
}
