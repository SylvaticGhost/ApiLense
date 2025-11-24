import { Result } from '../utils/result.ts';
import { NumberValidator } from './fieldValidators/numberValidator.ts';
import { StringValidator } from './fieldValidators/stringValidator.ts';

export class ArgValidator<TArg> {
  constructor(private readonly arg: TArg) {}

  private result?: Result;

  for<TField>(
    accessor: (arg: TArg) => TField,
    validateFunc: (validator: IFieldValidatorDefineNameStep<TField>) => void,
  ): ArgValidator<TArg> {
    if (this.result) {
      return this;
    }

    const field = accessor(this.arg);
    const validator = new FieldValidator(field);
    validateFunc(validator);
    this.result = validator.getResult();
    return this;
  }

  getResult(): Result | undefined {
    return this.result;
  }

  map<TOut>(mapper: (arg: TArg) => TOut): Result {
    if (this.result) {
      return this.result;
    }

    const mapped = mapper(this.arg);
    return Result.success(mapped);
  }
}

class FieldValidator<TField>
  implements
    IFieldValidatorDefineNameStep<TField>,
    IFieldValidatorConstraintStep<TField>,
    IFieldValidatorConstraintWithFinalizeStep<TField>
{
  constructor(private readonly field: TField) {}

  private result?: Result;
  private fieldName?: string;
  private skip: boolean = false;

  defineName(name: string): FieldValidator<TField> {
    this.fieldName = name;
    return this;
  }

  optional(): FieldValidator<TField> {
    if (this.field === undefined || this.field === null) this.skip = true;
    return this;
  }

  should(
    condition: (field: TField) => boolean,
    errorMessage: string,
  ): FieldValidator<TField> {
    if (!this.result && !condition(this.field) && !this.skip) {
      this.result = Result.badRequest(errorMessage);
    }
    return this;
  }

  withMap<TNew>(
    mapper: (field: TField) => TNew | undefined,
    validateFunc: (validator: FieldValidator<TNew>) => void,
  ): FieldValidator<TField> {
    const newField: TNew | undefined = mapper(this.field);

    if (this.result || this.skip) return this;

    if (!newField) {
      this.result = Result.badRequest('Invalid type of argument');
      return this;
    }

    const newValidator = new FieldValidator<TNew>(newField);

    if (this.fieldName) {
      newValidator.defineName(this.fieldName);
    }

    validateFunc(newValidator);
    const newResult = newValidator.getResult();

    this.result ??= newResult;
    return this;
  }

  hasType(
    typeName:
      | 'undefined'
      | 'object'
      | 'boolean'
      | 'number'
      | 'string'
      | 'bigint'
      | 'symbol'
      | 'function',
  ): FieldValidator<TField> {
    return this.should(
      (field) => typeof field === typeName,
      `Field ${this.fieldName} must be of type ${typeName}`,
    );
  }

  asNumber(numValidatorConf: (numValidator: NumberValidator) => void): void {
    if (this.result || this.skip) return;

    const numberValidator = new NumberValidator(this.field, this.fieldName);
    numValidatorConf(numberValidator);
    const numberValidationResult = numberValidator.getResult();
    this.result ??= numberValidationResult;
  }

  asString(stringValidatorConf: (strValidator: StringValidator) => void): void {
    if (this.result || this.skip) return;

    const stringValidator = new StringValidator(this.field, this.fieldName);
    stringValidatorConf(stringValidator);
    const stringValidationResult = stringValidator.getResult();
    this.result ??= stringValidationResult;
  }

  notNull(): FieldValidator<TField> {
    return this.should(
      (field) => field !== null && field !== undefined,
      `Field ${this.fieldName} must not be null or undefined`,
    );
  }

  getResult(): Result | undefined {
    return this.result;
  }
}

interface IFieldValidatorDefineNameStep<TField> {
  defineName(name: string): IFieldValidatorConstraintWithFinalizeStep<TField>;
}

interface IFieldValidatorConstraintStep<TField> {
  should(
    condition: (field: TField) => boolean,
    errorMessage: string,
  ): IFieldValidatorConstraintWithFinalizeStep<TField>;

  optional(): IFieldValidatorConstraintWithFinalizeStep<TField>;

  withMap<TNew>(
    mapper: (field: TField) => TNew | undefined,
    validateFunc: (validator: IFieldValidatorConstraintStep<TNew>) => void,
  ): IFieldValidatorConstraintWithFinalizeStep<TField>;

  hasType(
    typeName:
      | 'undefined'
      | 'object'
      | 'boolean'
      | 'number'
      | 'string'
      | 'bigint'
      | 'symbol'
      | 'function',
  ): IFieldValidatorConstraintWithFinalizeStep<TField>;

  notNull(): IFieldValidatorConstraintWithFinalizeStep<TField>;

  asNumber(numValidatorConf: (numValidator: NumberValidator) => void): void;

  asString(stringValidatorConf: (strValidator: StringValidator) => void): void;
}

interface IFieldValidatorConstraintWithFinalizeStep<TField>
  extends IFieldValidatorConstraintStep<TField> {
  getResult(): Result | undefined;
}
