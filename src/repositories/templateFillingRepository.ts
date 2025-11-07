import { HttpMethod } from '../core/enums.ts';
import { TemplateFilling } from '../core/templateFilling.ts';
import { FileSystemBasedRepository } from './Bases/fileSystemBasedRepository.ts';

export class TemplateFillingRepository extends FileSystemBasedRepository {
  save(templateFilling: TemplateFilling): Promise<void> {
    const filePath = templateFilling.filePath();
    return super.writeObjectToFile(filePath, templateFilling);
  }

  checkIfNameUsed(templateFilling: TemplateFilling): Promise<boolean> {
    return super.fileExistst(templateFilling.filePath());
  }

  get(
    schemaId: number,
    endpointName: string,
    templateName: string,
  ): Promise<TemplateFilling | null> {
    const filePath = TemplateFilling.filePath(
      schemaId,
      endpointName,
      templateName,
    );
    console.debug(`Retrieving template filling from ${filePath}`);
    return super.readObjectFromFileWithFactory<TemplateFilling>(
      filePath,
      TemplateFilling.fromJson,
    );
  }
}
