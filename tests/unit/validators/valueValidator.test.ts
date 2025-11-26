import { assertEquals } from '@std/assert';
import { ValueValidator } from '../../../src/validators/valueValidator.ts';
import { BODY_FIELD_TYPES } from '../../../src/core/enums.ts';

Deno.test('validate: null with default allowNull (true) returns true', () => {
  assertEquals(ValueValidator.validate(null, BODY_FIELD_TYPES.INT), true);
  assertEquals(ValueValidator.validate(undefined, BODY_FIELD_TYPES.INT), true);
});

Deno.test('validate: null with allowNull = false returns false', () => {
  assertEquals(
    ValueValidator.validate(null, BODY_FIELD_TYPES.INT, false),
    false,
  );
  assertEquals(
    ValueValidator.validate(undefined, BODY_FIELD_TYPES.INT, false),
    false,
  );
});

Deno.test('validate: INT type accepts numeric string', () => {
  assertEquals(ValueValidator.validate('123', BODY_FIELD_TYPES.INT), true);
  assertEquals(ValueValidator.validate('0', BODY_FIELD_TYPES.INT), true);
  assertEquals(ValueValidator.validate('-42', BODY_FIELD_TYPES.INT), true);
});

Deno.test(
  'validate: INT type accepts non-numeric string (current implementation behavior)',
  () => {
    // Current implementation only checks for non-null for the INT case,
    // so non-numeric strings are accepted — test documents this behavior.
    assertEquals(ValueValidator.validate('abc', BODY_FIELD_TYPES.INT), true);
    assertEquals(ValueValidator.validate('123abc', BODY_FIELD_TYPES.INT), true);
  },
);

Deno.test(
  'validate: FLOAT type currently returns false even for numeric input (demonstrates mismatch)',
  () => {
    // Expected behavior might be to validate numbers, but current code returns false
    assertEquals(
      ValueValidator.validate('123.45', BODY_FIELD_TYPES.FLOAT),
      false,
    );
    assertEquals(ValueValidator.validate('0.0', BODY_FIELD_TYPES.FLOAT), false);
  },
);

Deno.test(
  'validate: DATETIME type currently returns false even for valid ISO datetime (demonstrates mismatch)',
  () => {
    assertEquals(
      ValueValidator.validate(
        '2020-01-01T00:00:00Z',
        BODY_FIELD_TYPES.DATETIME,
      ),
      false,
    );
    assertEquals(
      ValueValidator.validate('2021-12-31', BODY_FIELD_TYPES.DATETIME),
      false,
    );
  },
);

Deno.test('validate: STRING type returns true for any string input', () => {
  assertEquals(ValueValidator.validate('hello', BODY_FIELD_TYPES.STRING), true);
  assertEquals(
    ValueValidator.validate('any text', BODY_FIELD_TYPES.STRING),
    true,
  );
});

Deno.test(
  'validate: OBJECT type returns false for JSON string (demonstrates mismatch)',
  () => {
    assertEquals(
      ValueValidator.validate('{"a":1}', BODY_FIELD_TYPES.OBJECT),
      false,
    );
  },
);
