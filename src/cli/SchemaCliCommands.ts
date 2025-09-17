import {CliCommandCatalog} from "./CliCommandCatalog.ts";
import {Command} from '@cliffy/command';

export class SchemaCliCommands extends CliCommandCatalog {
  constructor(commandBuilder: Command) {
    super(commandBuilder);
  }


}
