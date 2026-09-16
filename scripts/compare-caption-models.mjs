import { pipeline, env } from '@huggingface/transformers';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
env.allowRemoteModels = false;
env.localModelPath = resolve('portable/neural/assets/stt') + '/';
const source = process.argv[2];
const bytes = await readFile(source);
const rate = bytes.readUInt32LE(24);
let offset = 12, pcm;
while (offset < bytes.length) {
  const size = bytes.readUInt32LE(offset + 4);
  if (bytes.toString('ascii', offset, offset + 4) === 'data') {
    pcm = new Float32Array(size / 2);
    for (let i = 0; i < pcm.length; i++) pcm[i] = bytes.readInt16LE(offset + 8 + i * 2) / 32768;
    break;
  }
  offset += 8 + size + size % 2;
}
const input = new Float32Array(Math.floor(pcm.length * 16000 / rate));
for (let i = 0; i < input.length; i++) {
  const at = i * rate / 16000, left = Math.floor(at), mix = at - left;
  input[i] = pcm[left] * (1 - mix) + (pcm[left + 1] || 0) * mix;
}
const results = [];
for (const name of ['whisper-base', 'whisper-small']) {
  const model = await pipeline('automatic-speech-recognition', name, { dtype: 'q8', device: 'cpu' });
  const start = performance.now();
  const output = await model(input, { language: 'korean', task: 'transcribe' });
  results.push({ model: name, text: output.text, seconds: (performance.now() - start) / 1000 });
  console.log(JSON.stringify(results.at(-1))); await model.dispose();
}
await writeFile('artifacts/caption-model-comparison.json', JSON.stringify({ source, results }, null, 2));
