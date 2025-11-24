import { Command } from '@cliffy/command';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { IDispatcher } from '../infrastructure/mainDispatcher.ts';
import { TemplateFillingService } from '../services/templateFillingService.ts';
import { TemplateFillingNewArgs } from '../contracts/templateFillingCommandsArgs.ts';
import { TemplateFilling } from '../core/templateFilling.ts';
import { CommandLogic } from '../infrastructure/commandLogic.ts';
import { Guard } from '../utils/guard.ts';
import { StringBuilder } from '../utils/stringBuilder.ts';
import { FileUrl } from '../utils/types/fileUrl.ts';
import { colors } from '@cliffy/ansi/colors';
import { tty } from '@cliffy/ansi/tty';

interface TemplateFillingNewPureArgs {
  schema?: string | undefined;
  endpoint?: string | undefined;
  name?: string | undefined;
}

export class TemplateFillingDispatcher implements IDispatcher {
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
            TemplateFillingNewPureArgs,
            TemplateFillingNewArgs,
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
                  return {
                    schemaId: Number(args.schema!),
                    endpointName: args.endpoint!,
                    templateName: args.name,
                  } as TemplateFillingNewArgs;
                }),
            )
            .withLogic(async (input) => {
              Guard.against.nullOrUndefined(input.schemaId, 'schemaId');
              Guard.against.negative(input.schemaId, 'schemaId');
              Guard.against.nullOrUndefined(input.endpointName, 'endpointName');

              return await this.templateFillingService.createEndpointTemplate(
                input,
              );
            })
            .withResultDisplay((result) => {
              const filling = result.castValueStrict<TemplateFilling>();
              const filePath = filling.filePath();
              const sb = new StringBuilder()
                .appendLine(
                  colors.green('✅ Successfully created endpoint filling '),
                )
                .appendLine(`Name: ${filling.name}`)
                .appendLine(`Schema ID: ${filling.schemaId}`)
                .appendLine(`Endpoint: ${filling.endpointName}`)
                .appendLine(`Stored at: ${filePath}`)
                .appendLine(new FileUrl(filePath, 'Click to open').toString());

              console.log(sb.toString());
            })
            .execute(options),
      );
  }
}
