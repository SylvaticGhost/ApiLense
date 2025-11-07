import { assert } from '@std/assert';
import { TemplateFilling } from '../../../src/core/templateFilling.ts';
import { Endpoint } from '../../../src/core/endpoint.ts';

const json: string = `
{
  "name": "parse cord t4_8",
  "schemaId": 8,
  "endpointName": "GET /api/map/parse-cords",
  "endpointPath": "/api/map/parse-cords",
  "method": "GET",
  "params": [
    {
      "name": "url",
      "value": "https://maps.app.goo.gl/8bvaSxEqDc8n1niD8"
    }
  ],
  "bodyFilling": null
}`;

Deno.test('parse template filling from json', () => {
  const filling = TemplateFilling.fromJson(json);
  assert(filling !== null);
  assert(filling !== undefined);
  assert(filling.name === 'parse cord t4_8');
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
