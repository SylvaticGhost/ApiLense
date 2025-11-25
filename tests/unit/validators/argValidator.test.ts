import { assertEquals } from '@std/assert';
import { ArgValidator } from '../../../src/validators/argValidator.ts';

Deno.test('hasType: string passes for string field', () => {
  const arg = { s: 'hello' };
  const validator = new ArgValidator(arg);
  validator.for(
    (a) => a.s,
    (v) => v.defineName('string field').hasType('string'),
  );
  assertEquals(validator.getResult() === undefined, true);
});

Deno.test('hasType: number passes for number field', () => {
  const arg = { n: 42 };
  const validator = new ArgValidator(arg);
  validator.for(
    (a) => a.n,
    (v) => v.defineName('number field').hasType('number'),
  );
  assertEquals(validator.getResult() === undefined, true);
});

Deno.test('hasType: boolean passes for boolean field', () => {
  const arg = { b: true };
  const validator = new ArgValidator(arg);
  validator.for(
    (a) => a.b,
    (v) => v.defineName('boolean field').hasType('boolean'),
  );
  assertEquals(validator.getResult() === undefined, true);
});

Deno.test('hasType: object passes for object field', () => {
  const arg = { o: { a: 1 } };
  const validator = new ArgValidator(arg);
  validator.for(
    (a) => a.o,
    (v) => v.defineName('object field').hasType('object'),
  );
  assertEquals(validator.getResult() === undefined, true);
});

Deno.test('hasType: undefined passes for undefined field', () => {
  const arg = { u: undefined };
  const validator = new ArgValidator(arg);
  validator.for(
    (a) => a.u,
    (v) => v.defineName('undefined field').hasType('undefined'),
  );
  assertEquals(validator.getResult() === undefined, true);
});

Deno.test('hasType: function passes for function field', () => {
  const arg = { fn: () => {} };
  const validator = new ArgValidator(arg);
  validator.for(
    (a) => a.fn,
    (v) => v.defineName('function field').hasType('function'),
  );
  assertEquals(validator.getResult() === undefined, true);
});

Deno.test('hasType: bigint passes for bigint field', () => {
  const arg = { bg: 1n };
  const validator = new ArgValidator(arg);
  validator.for(
    (a) => a.bg,
    (v) => v.defineName('bigint field').hasType('bigint'),
  );
  assertEquals(validator.getResult() === undefined, true);
});

Deno.test('hasType: symbol passes for symbol field', () => {
  const sym = Symbol('x');
  const arg = { s: sym };
  const validator = new ArgValidator(arg);
  validator.for(
    (a) => a.s,
    (v) => v.defineName('symbol field').hasType('symbol'),
  );
  assertEquals(validator.getResult() === undefined, true);
});

Deno.test('hasType: fails when type does not match', () => {
  const arg = { s: 'text' };
  const validator = new ArgValidator(arg);
  validator.for(
    (a) => a.s,
    (v) => v.defineName('string field').hasType('number'),
  );
  assertEquals(validator.getResult() !== undefined, true);
});
