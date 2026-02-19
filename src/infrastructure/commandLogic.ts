import { PureArgs } from '../contracts/commonArgs.ts';
import { Guard } from '../utils/guard.ts';
import { Result } from '../utils/result.ts';
import { ArgValidator } from '../validators/argValidator.ts';

export class CommandLogic<TArgs extends PureArgs, TInput, TResult> {
  constructor(
    private validationFunc: (argValidator: ArgValidator<TArgs>) => Result,
    private logicFunc: (input: TInput) => Promise<Result>,
    private resultDisplayFunc?: (result: Result) => void,
    private resultDisplayAsyncFunc?: (result: Result) => Promise<void>,
  ) {
    if (!resultDisplayFunc && !resultDisplayAsyncFunc)
      throw new Error('At least one result display function must be provided');
  }

  static define<
    TArgs extends PureArgs,
    TInput,
    TResult,
  >(): CommandLogicBuilderValidationStep<TArgs, TInput, TResult> {
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

    if (args.json) {
      const json = logicResult.json();
      console.log(json);
      return;
    }

    if (logicResult.isFailure()) {
      this.logFailure(logicResult);
    } else if (this.resultDisplayAsyncFunc) {
      await this.resultDisplayAsyncFunc(logicResult);
    } else if (this.resultDisplayFunc) {
      this.resultDisplayFunc(logicResult);
    } else {
      throw new Error('No result display function defined');
    }
  }

  private logFailure(result: Result): void {
    console.error(`Error: ${result.errorMessage}`);
  }
}

class CommandLogicBuilder<TArgs extends PureArgs, TInput, TResult>
  implements
    CommandLogicBuilderValidationStep<TArgs, TInput, TResult>,
    CommandLogicBuilderLogicStep<TArgs, TInput, TResult>,
    CommandLogicBuilderResultDisplayStep<TArgs, TInput, TResult>
{
  private validation?: (argValidator: ArgValidator<TArgs>) => Result;
  private logic?: (input: TInput) => Promise<Result>;
  private resultDisplay?: (result: Result) => void;
  private resultDisplayAsync?: (result: Result) => Promise<void>;

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

  withResultLogging(
    successMessageCreator: (result: Result) => string,
  ): CommandLogic<TArgs, TInput, TResult> {
    this.resultDisplay = (result: Result) => {
      const successMessage = successMessageCreator(result);
      if (result.isSuccess()) {
        console.log(successMessage);
      } else {
        console.error(`Error: ${result.errorMessage}`);
      }
    };
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

  withResultDisplayAsync(
    resultDisplayFunc: (result: Result) => Promise<void>,
  ): CommandLogic<TArgs, TInput, TResult> {
    this.resultDisplayAsync = resultDisplayFunc;
    this.resultDisplay = (result: Result) => {
      resultDisplayFunc(result).catch((err) => {
        console.error('Error in result display:', err);
      });
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
    if (!this.resultDisplay && !this.resultDisplayAsync) {
      throw new Error('Result display function is not defined');
    }

    return new CommandLogic<TArgs, TInput, TResult>(
      this.validation,
      this.logic,
      this.resultDisplay,
      this.resultDisplayAsync,
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

interface CommandLogicBuilderValidationStep<
  TArgs extends PureArgs,
  TInput,
  TResult,
> extends CommandLogicBuilderLogicStep<TArgs, TInput, TResult> {
  withValidation(
    argValidatorConfig: (argValidator: ArgValidator<TArgs>) => Result,
  ): CommandLogicBuilderLogicStep<TArgs, TInput, TResult>;
}

interface CommandLogicBuilderLogicStep<
  TArgs extends PureArgs,
  TInput,
  TResult,
> {
  withLogic(
    logicFunc: (input: TInput) => Promise<Result>,
  ): CommandLogicBuilderResultDisplayStep<TArgs, TInput, TResult>;
}

interface CommandLogicBuilderResultDisplayStep<
  TArgs extends PureArgs,
  TInput,
  TResult,
> {
  withResultDisplay(
    resultDisplayFunc: (result: Result) => void,
  ): CommandLogic<TArgs, TInput, TResult>;

  withResultLogging(
    successMessageCreator: (result: Result) => string,
  ): CommandLogic<TArgs, TInput, TResult>;

  withResultDisplayAsync(
    resultDisplayFunc: (result: Result) => Promise<void>,
  ): CommandLogic<TArgs, TInput, TResult>;

  withResultDisplayMap(
    statementDefinerConf: (definer: ResultDisplayStatementDefiner) => void,
  ): CommandLogic<TArgs, TInput, TResult>;
}
