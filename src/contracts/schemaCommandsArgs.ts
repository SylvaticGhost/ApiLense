/**
 * Аргументи для команди 'schema-load'.
 */
export interface LoadSchemaArgs {
  file?: string;
  url?: string;
  name?: string;
  group?: string;
}

/**
 * Аргументи для команди 'schema-list'.
 */
export interface ListSchemaArgs {
  group?: string;
  page: number; // Сторінка (завжди буде, за замовчуванням 1)
  size?: number; // Кількість (необов'язково)
}

/**
 * DTO (Data Transfer Object) для одного елемента списку схем.
 */
export interface SchemaListItemDto {
  id: number;
  name: string;
  source: string; // Поле, що зберігає url або шлях до файлу
  createdAt: Date;
  modifiedAt: Date; // Використовуємо для "last usage"
  groupName?: string; // Назва групи
}