import { Command } from "@cliffy/command";
import { HelpCommand } from "@cliffy/command/help";
import { DependencyContainer } from "./infrastructure/DependencyContainer.ts";
import {
  DependencyRegistration
} from "./infrastructure/dependencyRegistration.ts";

const container = new DependencyContainer();
const registrator = new DependencyRegistration(container);
await registrator.registerAll();

await new Command()
  .name("ApiLens")
  .version("0.1.0")
  .description("Web API performance testing tool")
  .command("help", new HelpCommand().global())
  // schema-load
  .default("help")
  .command("load")
  .description("Load an API schema")
  .option("-f, --file <file:string>", "Path to the schema file")
  .option("-u, --url <url:string>", "URL of the schema")
  .option("-n, --name <name:string>", "Name of the schema")
  .option("-g, --group <group:string>", "Group to assign the schema to")
  .action((options) => {
    console.log("Loading schema from:", options.file ?? options.url);
  })
  // schema-list
  .command("schema-list", "List all loaded schemas")
  .alias("sl")
  .option("-g, --group <group:string>", "Group of schemas to list")
  .action((options) => {
    console.log("Listing all loaded schemas...");
    if (options.group) {
      console.log("Group:", options.group);
    }
  })
  // schema-remove
  .command("schema-remove", "Remove specified schema by ID or name")
  .alias("sr")
  .option("-i, --id <id:string>", "ID of the schema to remove")
  .option("-n, --name <name:string>", "Name of the schema to remove")
  .action((options) => {
    console.log("Removing the specified schema...");
    console.log("Options:", options);
  })
  // schema-update
  .command("schema-update", "Update an existing schema by ID or name")
  .alias("su")
  .option("-i, --id <id:string>", "ID of the schema to update")
  .option("-n, --name <name:string>", "Name of the schema to update")
  .option("-f, --file <file:string>", "Path to the new schema file")
  .option("-u, --url <url:string>", "URL of the new schema")
  .action((options) => {
    console.log("Updating the specified schema...");
    console.log("Options:", options);
  })
  // schema (details)
  .command("schema", "Show API Schema details")
  .alias("s")
  .option("-i, --id <id:string>", "ID of the schema to show")
  .option("-n, --name <name:string>", "Name of the schema to show")
  .action((options) => {
    console.log("Showing schema details...");
    console.log("Options:", options);
  })
  .command("group", "Manage schema groups")
  .alias("g")
  .action(() => {
    console.log("Managing schema groups...");
  })
  .command("group-delete", "Delete a schema group")
  .alias("gd")
  .option("-n, --name <name:string>", "Name of the group to delete")
  .action((options) => {
    console.log("Deleting schema group...");
    console.log("Options:", options);
  })
  .command("group-create", "Create a new schema group")
  .alias("gc")
  .option("-n, --name <name:string>", "Name of the group to create")
  .option("-c, --color <color:string>", "Color of the group")
  .action((options) => {
    console.log("Creating schema group...");
    console.log("Options:", options);
  })
  .command("group-remove", "Remove a schema from a group")
  .alias("gr")
  .option(
    "-n, --name <name:string>",
    "Name of the group to remove the schema from",
  )
  .option("-s, --schema <schema:string>", "Name of the schema to remove")
  .action((options) => {
    console.log("Removing schema from group...");
    console.log("Options:", options);
  })
  .parse(Deno.args);
