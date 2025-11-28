import { ensureDir } from '@std/fs/ensure-dir';

export async function initTestDatabaseWithPrisma(
  volumePath: string,
  prismaSchemaPath: string,
  testDbFile: string,
) {
  await ensureDir(volumePath);

  try {
    await Deno.remove(testDbFile);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  const command = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '-A',
      'npm:prisma',
      'db',
      'push',
      '--schema',
      prismaSchemaPath,
    ],
    env: {
      DATABASE_URL: `file:${testDbFile}`,
    },
  });

  const { code, stderr } = await command.output();

  if (code !== 0) {
    const errText = new TextDecoder().decode(stderr);
    throw new Error(`Prisma db push failed: ${errText}`);
  }
}
