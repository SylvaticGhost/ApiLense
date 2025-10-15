import { assertEquals } from '@std/assert';
import { parseApiSchemaFromText } from '../src/mapper/schemaParser.ts';
import { HTTP_METHODS, BODY_FIELD_TYPES } from '../src/core/constants.ts';

Deno.test(
  'parseApiSchemaFromText parses endpoints with nested body fields',
  async () => {
    const schemaJson = JSON.stringify({
      endpoints: [
        {
          name: 'createUser',
          method: 'POST',
          url: '/users',
          body: {
            name: 'string',
            age: 'int',
            profile: {
              bio: 'string',
              hobbies: ['string'],
            },
          },
        },
      ],
    });

    const endpoints = await parseApiSchemaFromText(schemaJson);
    const e = endpoints[0];
    assertEquals(e.method, HTTP_METHODS.POST);
    assertEquals(e.template.bodyFields.length, 3);

    const [name, age, profile] = e.template.bodyFields;
    assertEquals(name.typing, BODY_FIELD_TYPES.STRING);
    assertEquals(age.typing, BODY_FIELD_TYPES.INT);
    assertEquals(profile.valueKind, 'object');
    assertEquals(profile.nestedFields.length, 2);
  },
);
