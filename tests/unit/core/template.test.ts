import { assert } from '@std/assert';
import { TemplateFilling } from '../../../src/core/templateFilling.ts';

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
