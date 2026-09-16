import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { pipeline, env } from '@huggingface/transformers';
import { BEATS } from '../portable/neural/meeting-controller.js';
const require = createRequire(import.meta.url);
let source = await readFile('portable/neural/vendor/supertonic-helper.js', 'utf8');
source = source.replace("'onnxruntime-web'", JSON.stringify(pathToFileURL(require.resolve('onnxruntime-node')).href));
source = source.replace('ort.InferenceSession.create(onnxPath, options)', 'ort.InferenceSession.create(new Uint8Array(await (await fetch(onnxPath)).arrayBuffer()), options)');
const helper = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const base = 'http://127.0.0.1:8772/assets/tts';
const { textToSpeech: tts } = await helper.loadTextToSpeech(base + '/onnx', { executionProviders: ['cpu'] });
env.allowRemoteModels = false;
env.localModelPath = resolve('portable/neural/assets/stt') + '/';
const model = await pipeline('automatic-speech-recognition', 'whisper-small', { dtype: 'q8', device: 'cpu' });
const results = [];
for (const [index, voice] of [[1, 'M1'], [3, 'F2']]) {
  const text = BEATS[index].text;
  const style = await helper.loadVoiceStyle([base + '/voice_styles/' + voice + '.json']);
  const { wav, duration } = await tts.call(text, 'ko', style, 8, 1.03, 0.22);
  const pcm = wav.slice(0, Math.floor(duration[0] * tts.sampleRate));
  const input = new Float32Array(Math.floor(pcm.length * 16000 / tts.sampleRate));
  for (let i = 0; i < input.length; i++) {
    const position = i * tts.sampleRate / 16000, left = Math.floor(position), mix = position - left;
    input[i] = pcm[left] * (1 - mix) + (pcm[left + 1] || 0) * mix;
  }
  const output = await model(input, { language: 'korean', task: 'transcribe' });
  results.push({ expected: text, recognized: output.text, voice });
  console.log(JSON.stringify(results.at(-1)));
  await writeFile(`artifacts/caption-phrase-${index}.wav`, Buffer.from(helper.writeWavFile(pcm, tts.sampleRate)));
}
await writeFile('artifacts/caption-phrase-check.json', JSON.stringify(results, null, 2));
await model.dispose();
