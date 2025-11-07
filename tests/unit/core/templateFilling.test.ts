import { assert } from '@std/assert';
import { TemplateFilling } from '../../../src/core/templateFilling.ts';
import { Endpoint } from '../../../src/core/endpoint.ts';

const json: string = `
{
  "name": "search all 3",
  "schemaId": 8,
  "endpointName": "PUT /api/offer/search",
  "endpointPath": "/api/offer/search",
  "method": "PUT",
  "params": [],
  "bodyFilling":
  {
    "page": 1,
    "pageSize": 6,
    "orderProp": 0,
    "orderDirection": 1,
    "showDeleted": true
  }
}`;

Deno.test('parse template filling from json', () => {
  const filling = TemplateFilling.fromJson(json);
  assert(filling !== null);
  assert(filling !== undefined);
  assert(filling.name === 'search all 3');
  assert(filling.schemaId === 8);
  assert(filling.endpointName === 'PUT /api/offer/search');
  assert(filling.method === 'PUT');
  assert(filling.bodyFilling !== null);
});

Deno.test(
  'create template filling from complex endpoint template',
  async () => {
    const endpointJson: string = await Deno.readTextFile(
      new URL('../../content/endpoint.json', import.meta.url),
    );
    const endpoint = Endpoint.fromStoredJson(endpointJson);
    assert(endpoint !== null);
    assert(endpoint!.template !== null);
    assert(endpoint!.template.bodyFields.length > 0);

    const templateFilling = TemplateFilling.create(
      'test filling',
      1,
      endpoint!,
      endpoint!.template,
    );

    assert(templateFilling !== null);
    assert(templateFilling.endpointName === endpoint!.name);
    assert(templateFilling.schemaId === 1);
    assert(templateFilling.bodyFilling !== null);
  },
);
