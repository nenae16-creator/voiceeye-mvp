import * as ort from 'onnxruntime-web';
import { pipeline, env } from '@huggingface/transformers';
import { loadTextToSpeech, loadVoiceStyle } from './vendor/supertonic-helper.js';

const base = new URL(self.location.pathname.includes('/assets/') ? './' : './assets/', self.location.href).href;
ort.env.wasm.wasmPaths = base + 'runtime/';
ort.env.wasm.numThreads = 1;
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = base + 'stt/';
env.useBrowserCache = false;
env.backends.onnx.wasm.wasmPaths = base + 'whisper-runtime/';
env.backends.onnx.wasm.numThreads = 1;
let tts, recognizer;
const styles = {};
function progress(text) { self.postMessage({ progress: text }); }
async function initialize() {
  if (!tts) {
    progress('새 한국어 음성 준비 중');
    ({ textToSpeech: tts } = await loadTextToSpeech(base + 'tts/onnx', { executionProviders: ['wasm'] }, (_, i) => progress(`음성 모델 준비 ${i}/4`)));
    for (const voice of ['F1', 'F2', 'M1', 'M2']) styles[voice] = await loadVoiceStyle([base + `tts/voice_styles/${voice}.json`]);
  }
  if (!recognizer) {
    progress('한국어 자막 인식 준비 중');
    recognizer = await pipeline('automatic-speech-recognition', 'whisper-base', { dtype: 'q8', device: 'wasm' });
  }
  return { engine: 'Supertonic 2 · 한국어 신경망 음성', stt: 'Whisper base · 기기 내 음성 인식' };
}
let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  queue = queue.catch(() => {}).then(async () => {
    try {
      let result;
      if (data.action === 'init') result = await initialize();
      else if (data.action === 'synthesize') {
        if (!tts) await initialize();
        progress('발언 음성 만드는 중');
        const { wav, duration } = await tts.call(data.text, 'ko', styles[data.voice || 'F1'], 8, 1.03, 0.22);
        result = { pcm: new Float32Array(wav.slice(0, Math.floor(duration[0] * tts.sampleRate))), sampleRate: tts.sampleRate };
      } else if (data.action === 'recognize') {
        if (!recognizer) await initialize();
        progress('들은 음성을 자막으로 바꾸는 중');
        const output = await recognizer(data.pcm, { language: 'korean', task: 'transcribe', chunk_length_s: 20 });
        result = { text: output.text.trim() };
      } else throw new Error('지원하지 않는 음성 작업');
      self.postMessage({ id: data.id, result });
    } catch (error) { self.postMessage({ id: data.id, error: error.message }); }
  });
};
