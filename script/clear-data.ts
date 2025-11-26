import { rmdir } from 'node:fs/promises';

await rmdir('volume', { recursive: true });
console.log('Data directory cleared.');
