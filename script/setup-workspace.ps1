deno task hook
deno task init-db

$DB_PATH = Resolve-Path ../volume/apilens.db | Select-Object -ExpandProperty Path
$SCHEMA_LOCATION = Resolve-Path ../volume/schemas | Select-Object -ExpandProperty Path

Set-Location ..

$DB_PATH = $DB_PATH -replace '\\', '/'
$SCHEMA_LOCATION = $SCHEMA_LOCATION -replace '\\', '/'

"DATABASE_URL=file:$DB_PATH" | Set-Content .env
"SCHEMA_LOCATION=$SCHEMA_LOCATION" | Add-Content .env

deno task prisma-generate
