import { Endpoint } from '../../../src/core/endpoint.ts';
import { assert, assertEquals } from '@std/assert';

const stringToParse = `
{
    "name": "GET /api/map/parse-cords",
    "method": "GET",
    "path": "/api/map/parse-cords",
    "template": {
      "params": [
        {
          "name": "url",
          "type": "string",
          "required": false,
          "description": "shortened url",
          "paramType": "query"
        }
      ],
      "bodyFields": []
    },
    "responses": [ 200, 400, 422, 500 ]
  }
`;

Deno.test('parse json written endpoint to object', () => {
  const endpoint = Endpoint.fromStoredJson(stringToParse);
  assert(endpoint !== null);
  assert(endpoint !== undefined);
  assertEquals(endpoint.path, '/api/map/parse-cords');
});
