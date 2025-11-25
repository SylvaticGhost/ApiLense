import { BodyField } from '../core/bodyField.ts';
import { EndpointParam, Template } from '../core/template.ts';
import { ParamFilling, TemplateFilling } from '../core/templateFilling.ts';
import { CompareRailway } from '../utils/railway.ts';
import { Result } from '../utils/result.ts';
import { ValueValidator } from './valueValidator.ts';

export class TemplateFillingValidator {
  static isValid(templateFilling: TemplateFilling, template: Template): Result {
    return new CompareRailway<TemplateFilling, Template>(
      templateFilling,
      template,
    )
      .forkWith(this.validateParams(templateFilling.params, template.params))
      .forkWith(
        this.ValidateBodyFilling(
          templateFilling.bodyFilling,
          template.bodyFields,
        ),
      )
      .getResultOrDefault(Result.success())!;
  }

  private static ValidateBodyFilling(
    bodyFilling: object | null,
    bodyTemplate: BodyField[],
  ): Result | undefined {
    if (!bodyFilling) return undefined;

    for (const [key, value] of Object.entries(bodyFilling)) {
      const templateField = bodyTemplate.find((f) => f.name === key);
      if (!templateField)
        return Result.badRequest(`Unexpected field '${key}' in body filling`);

      const fieldValidationResult = this.validateBodyField(
        value,
        templateField,
      );
      if (fieldValidationResult) return fieldValidationResult;
    }

    return undefined;
  }

  private static validateBodyField(
    fieldFilling: any,
    fieldTemplate: BodyField,
  ): Result | undefined {
    return new CompareRailway<any, BodyField>(fieldFilling, fieldTemplate)
      .forkBySecond(
        (e) =>
          e.typing === 'object' &&
          Array.isArray(e.nestedFields) &&
          e.nestedFields.length > 0,
        Result.badRequest(
          `Field '${fieldTemplate.name}' is expected to be an object`,
        ),
      )
      .forkBySecond(
        (e) =>
          e.valueKind === 'array' &&
          Array.isArray(e.nestedFields) &&
          e.nestedFields.length > 0,
        Result.badRequest(
          `Field '${fieldTemplate.name}' is expected to be an array`,
        ),
      )
      .getResultOrDefault();
  }

  private static validateParams(
    paramsFilling: ParamFilling[],
    paramsTemplate: EndpointParam[],
  ): Result | undefined {
    for (const param of paramsFilling) {
      const templateParam = paramsTemplate.find((p) => p.name === param.name);
      if (!templateParam)
        return Result.badRequest(`Unexpected param '${param.name}' in filling`);

      const paramValidationResult = this.validateParam(param, templateParam);
      if (paramValidationResult) return paramValidationResult;
    }

    return undefined;
  }

  private static validateParam(
    paramFilling: ParamFilling,
    paramTemplate: EndpointParam,
  ): Result | undefined {
    return new CompareRailway<ParamFilling, EndpointParam>(
      paramFilling,
      paramTemplate,
    )
      .forkCompare(
        (f, e) => f.name !== e.name,
        Result.badRequest(
          `Param name mismatch: expected '${paramTemplate.name}', got '${paramFilling.name}'`,
        ),
      )
      .forkCompare(
        (f, e) => !ValueValidator.validate(f.value, e.type as any, !e.required),
        Result.badRequest(
          `Param value for '${paramTemplate.name}' is not valid for type '${paramTemplate.type}'`,
        ),
      )
      .getResultOrDefault();
  }
}
