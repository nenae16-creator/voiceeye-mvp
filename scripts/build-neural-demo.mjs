import { build } from 'vite';
import { mkdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve('portable/neural');
await build({ configFile: false, root, base: './', build: { outDir: '../voiceeye-neural-demo', emptyOutDir: true }, worker: { format: 'es' } });
const output = resolve('portable/voiceeye-neural-demo');
await mkdir(output + '/assets', { recursive: true });
await cp(root + '/assets', output + '/assets', { recursive: true, filter: path => !path.includes('whisper-tiny') && !path.includes('whisper-base') });
console.log('Local neural voice demo built:', output);
