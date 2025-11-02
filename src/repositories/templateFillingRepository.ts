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
}
