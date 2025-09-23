deno task hook
deno task init-db

DB_PATH=$(realpath ../volume/apilens.db)
SCHEMA_PATH=$(realpath ../volume/schemas)

cd ..

cat "DATABASE_URL=file:/$DB_PATH" > .env
cat "SCHEMA_PATH=$SCHEMA_PATH" >> .env

deno task prisma-generate
