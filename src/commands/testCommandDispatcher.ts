import { Command } from '@cliffy/command';
import { IDispatcher } from '../infrastructure/mainDispatcher.ts';
import { CommandLogic } from '../infrastructure/commandLogic.ts';
import { ApiCallReport } from '../core/apiCallReport.ts';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { TestService } from '../services/testService.ts';
import { RunEndpointCommandArgs } from '../contracts/testCommandArgs.ts';
import { TestReport } from '../core/testReport.ts';
import { PlotService } from '../services/plotService.ts';
import { TestResultPrinter } from '../utils/printers/testResultPrinter.ts';

interface RunEndpointCommandArgsPure {
  schema?: number | undefined;
  endpoint?: string | undefined;
  template?: string | undefined;
  printOutput?: boolean | undefined;
  numberOfRequests?: number | undefined;
  concurrency?: number | undefined;
  delayMs?: number | undefined;
  analize?: boolean | undefined;
  progression?: boolean | undefined;
}

export class TestCommandDispatcher implements IDispatcher {
  private readonly testService: TestService;
  private readonly plotService: PlotService;

  constructor(
    private readonly command: Command,
    private readonly container: DependencyContainer,
  ) {
    this.testService = this.container.resolve<TestService>('TestService');
    this.plotService = this.container.resolve<PlotService>('PlotService');
  }

  registerCommands(): void {
    this.command
      .command('test', 'A test command')
      .alias('run-test')
      .option('-s, --schema <schema:number>', 'The schema to use for the test')
      .option('-e, --endpoint <endpoint:string>', 'The endpoint to test')
      .option('-t, --template <template:string>', 'The template to apply')
      .option('--print-output', 'Whether to print output')
      .option('-a, --analize', 'Run analysis and show plots')
      .option(
        '-n --number-of-requests <numberOfRequests:number>',
        'Number of requests to run',
      )
      .option(
        '-c --concurrency <concurrency:number>',
        'Number of concurrent requests',
      )
      .option('-d --delay-ms <delayMs:number>', 'Delay between requests in ms')
      .option(
        '-p, --progression',
        'Run in progrssion mode: start with 1 parallel call and increase to max concurrency. Number of request is ignored',
      )
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
                      .asNumber((numV) => numV.isNatural()),
                )
                .for(
                  (a) => a.endpoint,
                  (v) => v.defineName('endpoint').notNull().hasType('string'),
                )
                .for(
                  (a) => a.template,
                  (v) => v.defineName('template').optional().hasType('string'),
                )
                .for(
                  (a) => a.numberOfRequests,
                  (v) =>
                    v
                      .defineName('number of requests')
                      .optional()
                      .asNumber((numV) => numV.isNatural()),
                )
                .for(
                  (a) => a.concurrency,
                  (v) =>
                    v
                      .defineName('concurrency')
                      .optional()
                      .asNumber((numV) => numV.isNatural()),
                )
                .for(
                  (a) => a.delayMs,
                  (v) =>
                    v
                      .defineName('delay ms')
                      .optional()
                      .asNumber((numV) => numV.isNonNegative().isInteger()),
                )
                .map((a) => {
                  const mode: 'single' | 'multiple' | 'progression' =
                    a.numberOfRequests === 1 && a.concurrency === 1
                      ? 'single'
                      : a.progression
                        ? 'progression'
                        : 'multiple';

                  return {
                    schema: a.schema!,
                    endpoint: a.endpoint!,
                    template: a.template!,
                    numberOfRequests: a.numberOfRequests ?? 1,
                    concurrency: a.concurrency ?? 1,
                    delayMs: a.delayMs ?? 0,
                    mode: mode,
                  } as RunEndpointCommandArgs;
                }),
            )
            .withLogic(async (input: RunEndpointCommandArgs) => {
              return await this.testService.runEndpoint(input);
            })
            .withResultDisplay((result) => {
              const testReport = result.castValueStrict<TestReport>();
              const printer = new TestResultPrinter(
                this.plotService,
                options.printOutput ?? false,
                options.analize ?? false,
              );

              printer.print(testReport);
            })
            .execute(options),
      );
  }
}
