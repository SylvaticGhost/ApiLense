import { Command } from '@cliffy/command';
import { IDispatcher } from '../infrastructure/mainDispatcher.ts';
import { CommandLogic } from '../infrastructure/commandLogic.ts';
import { ApiCallReport } from '../core/apiCallReport.ts';
import { DependencyContainer } from '../infrastructure/dependencyContainer.ts';
import { TestService } from '../services/testService.ts';
import { colors } from '@cliffy/ansi/colors';
import { StatementPrinter } from '../utils/printers/statementPrinter.ts';
import { StringBuilder } from '../utils/stringBuilder.ts';
import { RunEndpointCommandArgs } from '../contracts/testCommandArgs.ts';
import { TestReport } from '../core/testReport.ts';

interface RunEndpointCommandArgsPure {
  schema?: number | undefined;
  endpoint?: string | undefined;
  template?: string | undefined;
  printOutput?: boolean | undefined;
  numberOfRequests?: number | undefined;
  concurrency?: number | undefined;
  delayMs?: number | undefined;
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
      .option('--print-output <printOutput:boolean>', 'Whether to print output')
      .option(
        '-n --number-of-requests <numberOfRequests:number>',
        'Number of requests to run',
      )
      .option(
        '-c --concurrency <concurrency:number>',
        'Number of concurrent requests',
      )
      .option('-d --delay-ms <delayMs:number>', 'Delay between requests in ms')
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
                  return {
                    schema: a.schema!,
                    endpoint: a.endpoint!,
                    template: a.template!,
                    numberOfRequests: a.numberOfRequests ?? 1,
                    concurrency: a.concurrency ?? 1,
                    delayMs: a.delayMs ?? 0,
                  } as RunEndpointCommandArgs;
                }),
            )
            .withLogic(async (input: RunEndpointCommandArgs) => {
              return await this.testService.runEndpoint(input);
            })
            .withResultDisplay((result) => {
              const testReport = result.castValueStrict<TestReport>();
              if (testReport.mode === 'single') {
                const report = testReport.reports as ApiCallReport;
                const sb = new StringBuilder()
                  .appendLine()
                  .appendLine(colors.bold('📄 API Call Report:'))
                  .appendLine(
                    `Status: ${StatementPrinter.statusCodeColor(report.statusCode)}`,
                  )
                  .appendLine(`Response Time: ${report.timeTakenMs} ms`)
                  .appendBuilderIf(options.printOutput, (sb) =>
                    sb
                      .appendLine('Response Body 📩:')
                      .appendStringifiedObject(report.responseBody),
                  )
                  .appendLine();
                console.info(sb.toString());
              }

              if (testReport.mode === 'multiple') {
                const reportsByThread = testReport.reports as ApiCallReport[][];
                const sb = new StringBuilder()
                  .appendLine()
                  .appendLine(
                    colors.bold(
                      `📄 API Call Reports for ${reportsByThread.length} threads:`,
                    ),
                  );

                reportsByThread.forEach((reports, threadIndex) => {
                  sb.appendLine()
                    .appendLine(
                      colors.underline(`-- Thread ${threadIndex + 1} --`),
                    )
                    .appendLine();

                  reports.forEach((report, reportIndex) => {
                    sb.appendLine(colors.bold(`Request ${reportIndex + 1}:`))
                      .appendLine(
                        `Status: ${StatementPrinter.statusCodeColor(
                          report.statusCode,
                        )}`,
                      )
                      .appendLine(`Response Time: ${report.timeTakenMs} ms`)
                      .appendBuilderIf(options.printOutput, (sb) =>
                        sb
                          .appendLine('Response Body 📩:')
                          .appendStringifiedObject(report.responseBody),
                      );
                  });
                });

                console.info(sb.toString());
              }
            })
            .execute(options),
      );
  }
}
