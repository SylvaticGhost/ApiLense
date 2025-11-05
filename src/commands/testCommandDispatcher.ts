import { Command } from '@cliffy/command';
import { IDispatcher } from '../infrastructure/mainDispatcher.ts';
import { CommandLogic } from '../infrastructure/commandLogic.ts';
import { ApiCallReport } from '../core/apiCallReport.ts';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { TestService } from '../services/testService.ts';

interface RunEndpointCommandArgsPure {
  schema?: number | undefined;
  endpoint?: string | undefined;
  template?: string | undefined;
}

interface RunEndpointCommandArgs {
  schema: number;
  endpoint: string;
  template: string;
}

export class TestCommandDispatcher implements IDispatcher {
  private readonly testService: TestService;

  constructor(
    private readonly command: Command,
    private readonly container: DependencyContainer,
  ) {
    this.testService = this.container.resolve<TestService>('TestService');
  }

  registerCommands(): void {
    this.command
      .command('test', 'A test command')
      .alias('run-test')
      .option('-s, --schema <schema:number>', 'The schema to use for the test')
      .option('-e, --endpoint <endpoint:string>', 'The endpoint to test')
      .option('-t, --template <template:string>', 'The template to apply')
      .action(
        async (options) =>
          await CommandLogic.define<
            RunEndpointCommandArgsPure,
            RunEndpointCommandArgs,
            ApiCallReport
          >()
            .withValidation((argValidator) =>
              argValidator
                .for(
                  (a) => a.schema,
                  (v) =>
                    v
                      .defineName('schemd id')
                      .notNull()
                      .should(
                        (a) => a! > 0,
                        'Schema id must be positive number',
                      ),
                )
                .for(
                  (a) => a.endpoint,
                  (v) => v.defineName('endpoint').notNull().hasType('string'),
                )
                .for(
                  (a) => a.template,
                  (v) => v.defineName('template').optional().hasType('string'),
                )
                .map((a) => {
                  return {
                    schema: a.schema!,
                    endpoint: a.endpoint!,
                    template: a.template!,
                  } as RunEndpointCommandArgs;
                }),
            )
            .withLogic(async (input: RunEndpointCommandArgs) => {
              return await this.testService.runEndpoint(
                input.schema,
                input.endpoint,
                input.template,
              );
            })
            .withResultDisplay((result) => {
              const report = result.castValueStrict<ApiCallReport>();
              console.log('API Call Report:');
              console.log(`Status: ${report.statusCode}`);
              console.log(`Response Time: ${report.timeTakenMs} ms`);
              console.log('Response Body:');
              console.log(report.responseBody);
            })
            .execute(options),
      );
  }
}
