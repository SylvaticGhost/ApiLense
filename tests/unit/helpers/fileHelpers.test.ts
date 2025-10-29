import { assertEquals } from '@std/assert';
import { FileHelpers } from '../../../src/helpers/fileHelpers.ts';

Deno.test('getEachDirFromPath: relative multi-segment path', () => {
  const result = FileHelpers.getEachDirFromPath('a/b/c.txt');
  assertEquals(result, ['a', 'a/b']);
});

Deno.test('getEachDirFromPath: absolute path with leading slash', () => {
  const result = FileHelpers.getEachDirFromPath('/a/b/c.txt');
  assertEquals(result, ['/a', '/a/b']);
});

Deno.test('getEachDirFromPath: single segment returns empty array', () => {
  const result = FileHelpers.getEachDirFromPath('a');
  assertEquals(result, []);
});

Deno.test('getEachDirFromPath: empty string returns empty array', () => {
  const result = FileHelpers.getEachDirFromPath('');
  assertEquals(result, []);
});

Deno.test(
  'getEachDirFromPath: trailing slash is handled (ignored empty tail)',
  () => {
    const result = FileHelpers.getEachDirFromPath('a/b/');
    assertEquals(result, ['a', 'a/b']);
  },
);

Deno.test(
  'getEachDirFromPath: root-only path "/" yields no directories',
  () => {
    const result = FileHelpers.getEachDirFromPath('/');
    assertEquals(result, []);
  },
);

Deno.test('getEachDirFromPath: windows-style backslashes are supported', () => {
  const result = FileHelpers.getEachDirFromPath('C:\\a\\b\\c');
  assertEquals(result, ['C:', 'C:/a', 'C:/a/b']);
});

Deno.test('getDirFromFilePath: relative path returns directory', () => {
  const result = FileHelpers.getDirFromFilePath('a/b/c.txt');
  assertEquals(result, 'a/b');
});

Deno.test(
  'getDirFromFilePath: absolute path returns directory with leading slash',
  () => {
    const result = FileHelpers.getDirFromFilePath('/a/b/c.txt');
    assertEquals(result, '/a/b');
  },
);

Deno.test('getDirFromFilePath: trailing slash path returns parent dir', () => {
  const result = FileHelpers.getDirFromFilePath('a/b/');
  assertEquals(result, 'a/b');
});

Deno.test('getDirFromFilePath: single filename returns empty string', () => {
  const result = FileHelpers.getDirFromFilePath('file.txt');
  assertEquals(result, '');
});

Deno.test('getDirFromFilePath: windows-style backslashes are supported', () => {
  const result = FileHelpers.getDirFromFilePath('C:\\a\\b\\c.txt');
  assertEquals(result, 'C:/a/b');
});
