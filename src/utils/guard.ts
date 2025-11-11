class GuardClause {
  zero(variable: number, variableName: string): void {
    if (variable === 0) {
      throw new Error(`${variableName} must be non-zero.`);
    }
  }

  negative(variable: number, variableName: string): void {
    if (!variable || variable < 0) {
      throw new Error(
        `${variableName} must be non-negative. value is ${variable}`,
      );
    }
  }

  negativeOrZero(variable: number, variableName: string): void {
    if (!variable || variable <= 0) {
      throw new Error(
        `${variableName} must be non-negative or non-zero. value is ${variable}`,
      );
    }
  }

  nullOrEmpty(variable: string | null | undefined, variableName: string): void {
    if (variable === null || variable === undefined || variable.length == 0) {
      throw new Error(`${variableName} must be not null or empty.`);
    }
  }

  nullOrUndefined(
    variable: any | null | undefined,
    variableName: string,
  ): void {
    if (variable === null && variable === undefined) {
      throw new Error(`${variableName} must be not null or undefined.`);
    }
  }

  notEqual<T>(var1: T, var2: T, var1Name: string, var2Name: string) {
    if (var1 !== var2)
      throw new Error(
        `variable ${var1Name} (value: ${var1}) doesn't equal ${var2Name} (value: ${var2})`,
      );
  }
}

export class Guard {
  static against = new GuardClause();
}
