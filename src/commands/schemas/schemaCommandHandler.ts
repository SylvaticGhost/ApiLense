import { CommandLogic } from '../../infrastructure/commandLogic.ts';
import { DependencyContainer } from '../../infrastructure/dependencyContainer.ts';
import { SchemaService } from '../../services/schemaService.ts';

export class SchemaCommandHandler {
  private readonly schemaService: SchemaService;
  constructor(private readonly container: DependencyContainer) {
    this.schemaService = this.container.resolve<SchemaService>('SchemaService');
  }

  async loadSchema(args: any): Promise<void> {
    const commandLogic = CommandLogic.define();
  }
}
