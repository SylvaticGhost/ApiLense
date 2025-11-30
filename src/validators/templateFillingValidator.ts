import { BodyField } from '../core/bodyField.ts';
import { BODY_FIELD_TYPES } from '../core/enums.ts';
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

    for (const templateField of bodyTemplate) {
      const key = templateField.name;
      const value = (bodyFilling as any)[key];
      if (value === undefined || value === null) continue; // allow missing/nullable

      const fieldValidationResult = this.validateBodyField(value, templateField);
      if (fieldValidationResult) return fieldValidationResult;
    }

    return undefined;
  }

  private static validateBodyField(fieldFilling: any, fieldTemplate: BodyField): Result | undefined {
    // If template expects an object
    if (fieldTemplate.typing === BODY_FIELD_TYPES.OBJECT) {
      if (fieldTemplate.valueKind === 'array') {
        if (!Array.isArray(fieldFilling))
          return Result.badRequest(`Field '${fieldTemplate.name}' is expected to be an array`);
        // validate each item against nested fields
        if (fieldTemplate.nestedFields && fieldTemplate.nestedFields.length > 0) {
          for (const item of fieldFilling) {
            for (const nestedTemplate of fieldTemplate.nestedFields) {
              const childValue = item[nestedTemplate.name];
              if (childValue === undefined || childValue === null) continue;
              const res = this.validateBodyField(childValue, nestedTemplate);
              if (res) return res;
            }
          }
        }
        return undefined;
      } else {
        // object expected
        if (typeof fieldFilling !== 'object' || Array.isArray(fieldFilling) || fieldFilling === null)
          return Result.badRequest(`Field '${fieldTemplate.name}' is expected to be an object`);
        if (fieldTemplate.nestedFields && fieldTemplate.nestedFields.length > 0) {
          for (const nestedTemplate of fieldTemplate.nestedFields) {
            const childValue = fieldFilling[nestedTemplate.name];
            if (childValue === undefined || childValue === null) continue;
            const res = this.validateBodyField(childValue, nestedTemplate);
            if (res) return res;
          }
        }
        return undefined;
      }
    } else {
      // primitive expected - accept various types without strict type checking for now
      // If template has no nested fields and expects primitives, we won't reject
      return undefined;
    }
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
