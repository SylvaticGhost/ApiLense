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
    return super.readObjectFromFileWithFactory<TemplateFilling>(
      filePath,
      TemplateFilling.fromJson,
    );
  }

  deleteBySchemaId(schemaId: number): Promise<void> {
    const dirPath = `volume/fillings/${schemaId}`;
    return super.deleteDirIfExists(dirPath);
  }
}
