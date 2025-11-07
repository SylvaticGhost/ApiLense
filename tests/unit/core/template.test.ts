import { assert } from '@std/assert';
import { Template } from '../../../src/core/template.ts';

Deno.test('parse template filling from json', async () => {
  const templateJson: string = await Deno.readTextFile(
    './tests/content/endpoint_template.json',
  );

  const template = Template.createFromStoredJson(templateJson);
  assert(template !== null);
  assert(template !== undefined);
  assert(template.bodyFields.length > 0);

  const locParam = template.bodyFields.find(
    (bf) => bf.name === 'locationSearchParam',
  );
  assert(locParam?.nestedFields.length !== 0);
});
