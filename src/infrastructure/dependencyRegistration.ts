import { GroupRepository } from '../repositories/groupRepo.ts';
import { SchemaRepository } from '../repositories/schemaRepo.ts';
import { SchemaFileRepository } from '../repositories/schemaFileRepo.ts';
import { DependencyContainer } from './dependencyContainer.ts';
import { SchemaService } from '../services/schemaService.ts';
import { PrismaClient } from '../../prisma/generated/client.ts';
import { EndpointRepository } from '../repositories/endpointRepository.ts';
import { TemplateFillingRepository } from '../repositories/templateFillingRepository.ts';
import { TemplateFillingService } from '../services/templateFillingService.ts';
import { EndpointMetaDataRepository } from '../repositories/enpointMetaDataRepository.ts';

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

    this.container.registerDbRepo(
      (c) => new EndpointMetaDataRepository(c),
      'EndpointMetaDataRepository',
    );

    this.container.register(() => {
      const location = Deno.env.get('SCHEMA_LOCATION');
      if (!location) {
        throw new Error('SCHEMA_LOCATION is not set');
      }
      return new SchemaFileRepository(location);
    }, 'SchemaFileRepository');

    this.container.register(() => {
      return new EndpointRepository();
    }, 'EndpointRepository');

    this.container.register(() => {
      return new TemplateFillingRepository();
    }, 'TemplateFillingRepository');

    this.container.register((c: DependencyContainer): SchemaService => {
      const groupRepo = c.resolve<GroupRepository>('GroupRepository');
      const schemaRepo = c.resolve<SchemaRepository>('SchemaRepository');
      const schemaFileRepo = c.resolve<SchemaFileRepository>(
        'SchemaFileRepository',
      );
      const endpointRepo = c.resolve<EndpointRepository>('EndpointRepository');
      const endpointMetaDataRepository = c.resolve<EndpointMetaDataRepository>(
        'EndpointMetaDataRepository',
      );

      return new SchemaService(
        schemaFileRepo,
        groupRepo,
        schemaRepo,
        endpointRepo,
        endpointMetaDataRepository,
      );
    }, 'SchemaService');

    this.container.register(
      (c: DependencyContainer): TemplateFillingService => {
        const endpointRepo =
          c.resolve<EndpointRepository>('EndpointRepository');
        const schemaRepo = c.resolve<SchemaRepository>('SchemaRepository');
        const templateFillingRepo = c.resolve<TemplateFillingRepository>(
          'TemplateFillingRepository',
        );
        const endpointMetaDataRepository =
          c.resolve<EndpointMetaDataRepository>('EndpointMetaDataRepository');

        return new TemplateFillingService(
          endpointRepo,
          schemaRepo,
          templateFillingRepo,
          endpointMetaDataRepository,
        );
      },
      'TemplateFillingService',
    );
  }
}
