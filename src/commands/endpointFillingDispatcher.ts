import { Command } from '@cliffy/command';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { IDispatcher } from '../infrastructure/mainDispatcher.ts';
import { TemplateFillingService } from '../services/templateFillingService.ts';
import { ArgValidator } from '../validators/argValidator.ts';
import { EndpointFillingNewArgs } from '../contracts/endpointFillingCommandsArgs.ts';
import { Result } from '../utils/result.ts';
import { TemplateFilling } from '../core/templateFilling.ts';
import { CommandLogic } from '../infrastructure/commandLogic.ts';
import { Guard } from '../utils/guard.ts';

interface EndpointFillingNewPureArgs {
  schema?: string | undefined;
  endpoint?: string | undefined;
  name?: string | undefined;
}

export class EndpointFillingDispatcher implements IDispatcher {
  private readonly templateFillingService: TemplateFillingService;

  constructor(
    private readonly command: Command,
    private readonly container: DependencyContainer,
  ) {
    this.templateFillingService =
      this.container.resolve<TemplateFillingService>('TemplateFillingService');
  }

  registerCommands(): void {
    this.command
      .command('filling-new', 'Create a new endpoint filling')
      .alias('fn')
      .option('-s, --schema <schemaId:string>', 'Schema ID to use')
      .option('-e, --endpoint <endpoint:string>', 'Endpoint name to fill')
      .option('-n, --name <name:string>', 'Name of the new filling')
      .action(
        async (options) =>
          await CommandLogic.define<
            EndpointFillingNewPureArgs,
            EndpointFillingNewArgs,
            TemplateFilling
          >()
            .withValidation((argValidator) =>
              argValidator
                .for(
                  (a) => a.name,
                  (validator) => {
                    validator
                      .defineName('template name')
                      .optional()
                      .hasType('string');
                  },
                )
                .for(
                  (a) => a.schema,
                  (validator) => {
                    validator
                      .defineName('schema ID')
                      .notNull()
                      .withMap(
                        (s) => Number(s),
                        (numValidator) => {
                          numValidator.should(
                            (n) => n >= 0,
                            'Schema ID must be non-negative number',
                          );
                        },
                      );
                  },
                )
                .for(
                  (a) => a.endpoint,
                  (validator) => {
                    validator
                      .defineName('endpoint name')
                      .notNull()
                      .hasType('string')
                      .should(
                        (s) => s !== '',
                        'Endpoint name must be a non-empty string',
                      );
                  },
                )
                .map((args) => {
                  console.info(args);
                  return {
                    schemaId: Number(args.schema!),
                    endpointName: args.endpoint!,
                    templateName: args.name,
                  } as EndpointFillingNewArgs;
                }),
            )
            .withLogic(async (input) => {
              Guard.against.nullOrUndefined(input.schemaId, 'schemaId');
              Guard.against.negative(input.schemaId, 'schemaId');
              Guard.against.nullOrUndefined(input.endpointName, 'endpointName');

              return await this.templateFillingService.createEndpointTemplateTemplate(
                input,
              );
            })
            .withResultDisplay((result) => {
              const filling = result.castValue<TemplateFilling>();
              console.log(
                `Successfully created endpoint filling Name: ${filling?.name}`,
              );
            })
            .execute(options),
      );
  }
}
