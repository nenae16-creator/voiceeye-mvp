import { readFile, mkdir, cp, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
const root = resolve('portable/neural/assets');
const revisions = JSON.parse(await readFile('portable/neural/model-revisions.json', 'utf8'));
const models = [
  { repo: 'Supertone/supertonic-2', revision: revisions.tts, target: 'tts', paths: ['LICENSE','README.md','onnx/duration_predictor.onnx','onnx/text_encoder.onnx','onnx/vector_estimator.onnx','onnx/vocoder.onnx','onnx/tts.json','onnx/unicode_indexer.json','voice_styles/F1.json','voice_styles/F2.json','voice_styles/M1.json','voice_styles/M2.json'] },
  { repo: 'onnx-community/whisper-small', revision: revisions.stt, target: 'stt/whisper-small', paths: ['README.md','config.json','generation_config.json','preprocessor_config.json','tokenizer.json','tokenizer_config.json','special_tokens_map.json','added_tokens.json','normalizer.json','merges.txt','vocab.json','onnx/encoder_model_quantized.onnx','onnx/decoder_model_merged_quantized.onnx'] },
];
const manifest = [];
for (const model of models) {
  for (const path of model.paths) {
    const target = resolve(root, model.target, path);
    await mkdir(dirname(target), { recursive: true });
    const response = await fetch(`https://huggingface.co/${model.repo}/resolve/${model.revision}/${path}`);
    if (!response.ok) throw new Error(`Download failed ${response.status}: ${path}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
    const bytes = await readFile(target);
    manifest.push({ path: `${model.target}/${path}`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), repo: model.repo, revision: model.revision });
    console.log('Downloaded:', model.target, path);
  }
}
for (const [source, target] of [['node_modules/onnxruntime-web/dist', 'runtime'], ['node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist', 'whisper-runtime']]) {
  await mkdir(resolve(root, target), { recursive: true });
  for (const file of ['ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm','ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm']) await cp(resolve(source, file), resolve(root, target, file));
}
await writeFile(resolve(root, 'model-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Models ready. Run npm run build:demo:neural.');
