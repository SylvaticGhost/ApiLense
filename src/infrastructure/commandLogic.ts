import { exit } from 'node:process';
import { Guard } from '../utils/guard.ts';
import { Result } from '../utils/result.ts';
import { ArgValidator } from '../validators/argValidator.ts';

export class CommandLogic<TArgs, TInput, TResult> {
  constructor(
    private validationFunc: (argValidator: ArgValidator<TArgs>) => Result,
    private logicFunc: (input: TInput) => Promise<Result>,
    private resultDisplayFunc: (result: Result) => void,
  ) {}

  static define<TArgs, TInput, TResult>(): CommandLogicBuilderValidationStep<
    TArgs,
    TInput,
    TResult
  > {
    return new CommandLogicBuilder<TArgs, TInput, TResult>();
  }

  async execute(args: TArgs): Promise<void> {
    const argValidator = new ArgValidator<TArgs>(args);
    const validationResult = this.validationFunc?.(argValidator);

    if (validationResult.isFailure()) {
      this.logFailure(validationResult);
      return;
    }

    const input = validationResult.castValueStrict<TInput>();
    Guard.against.nullOrUndefined(input, 'input');
    const logicResult = await this.logicFunc(input);

    if (logicResult.isFailure()) {
      this.logFailure(logicResult);
    } else {
      this.resultDisplayFunc(logicResult);
    }
  }

  private logFailure(result: Result): void {
    console.error(`Error: ${result.errorMessage}`);
  }
}

class CommandLogicBuilder<TArgs, TInput, TResult>
  implements
    CommandLogicBuilderValidationStep<TArgs, TInput, TResult>,
    CommandLogicBuilderLogicStep<TArgs, TInput, TResult>,
    CommandLogicBuilderResultDisplayStep<TArgs, TInput, TResult>
{
  private validation?: (argValidator: ArgValidator<TArgs>) => Result;
  private logic?: (input: TInput) => Promise<Result>;
  private resultDisplay?: (result: Result) => void;

  withValidation(
    argValidatorConfig: (argValidator: ArgValidator<TArgs>) => Result,
  ): CommandLogicBuilderLogicStep<TArgs, TInput, TResult> {
    this.validation = argValidatorConfig;
    return this;
  }

  withLogic(
    logicFunc: (input: TInput) => Promise<Result>,
  ): CommandLogicBuilderResultDisplayStep<TArgs, TInput, TResult> {
    this.logic = logicFunc;
    return this;
  }

  withResultDisplay(
    resultDisplayFunc: (result: Result) => void,
  ): CommandLogic<TArgs, TInput, TResult> {
    this.resultDisplay = resultDisplayFunc;
    return this.build();
  }

  withResultDisplayMap(
    statementDefinerConf: (definer: ResultDisplayStatementDefiner) => void,
  ): CommandLogic<TArgs, TInput, TResult> {
    this.resultDisplay = (result: Result) => {
      const definer = new ResultDisplayStatementDefiner(result);
      statementDefinerConf(definer);
    };
    return this.build();
  }

  build(): CommandLogic<TArgs, TInput, TResult> {
    if (!this.validation) {
      throw new Error('Validation function is not defined');
    }
    if (!this.logic) {
      throw new Error('Logic function is not defined');
    }
    if (!this.resultDisplay) {
      throw new Error('Result display function is not defined');
    }

    return new CommandLogic<TArgs, TInput, TResult>(
      this.validation,
      this.logic,
      this.resultDisplay,
    );
  }
}

class ResultDisplayStatementDefiner {
  constructor(private readonly result: Result) {}
  private skip: boolean = false;

  variant<TOut>(outDisplayFunc: (output: TOut) => void) {
    if (this.skip) return this;

    const output = this.result.castValue<TOut>();
    console.info('Variant output:', output);

    if (output !== null && output !== undefined) {
      outDisplayFunc(output);
      this.skip = true;
    }

    return this;
  }
}

interface CommandLogicBuilderValidationStep<TArgs, TInput, TResult> {
  withValidation(
    argValidatorConfig: (argValidator: ArgValidator<TArgs>) => Result,
  ): CommandLogicBuilderLogicStep<TArgs, TInput, TResult>;
}

interface CommandLogicBuilderLogicStep<TArgs, TInput, TResult> {
  withLogic(
    logicFunc: (input: TInput) => Promise<Result>,
  ): CommandLogicBuilderResultDisplayStep<TArgs, TInput, TResult>;
}

interface CommandLogicBuilderResultDisplayStep<TArgs, TInput, TResult> {
  withResultDisplay(
    resultDisplayFunc: (result: Result) => void,
  ): CommandLogic<TArgs, TInput, TResult>;

  withResultDisplayMap(
    statementDefinerConf: (definer: ResultDisplayStatementDefiner) => void,
  ): CommandLogic<TArgs, TInput, TResult>;
}
