import { mkdir, cp, readFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
const workspace = resolve(process.argv[2]);
const output = resolve(workspace, 'submission/2026-09-06_AI실험실/발표준비_10분/VoiceEye_발표용_MVP_USB');
const backup = resolve(workspace, 'artifacts/mvp-turn-review/교체전_USB_20260916');
await mkdir(backup, { recursive: true });
for (const name of ['index.html','시연시작.bat','README.md','VoiceEye_Codex_인수인계_프롬프트.md']) {
  try { await cp(resolve(output, name), resolve(backup, name), { force: false, errorOnExist: true }); } catch (error) { if (!['EEXIST','ERR_FS_CP_EEXIST','ENOENT'].includes(error.code)) throw error; }
}
try { await cp(resolve(output, 'voiceeye-mvp'), resolve(backup, 'voiceeye-mvp'), { recursive: true, force: false, errorOnExist: true, filter: path => !/[/\\](tts|stt|runtime|whisper-runtime)([/\\]|$)/.test(path) }); } catch (error) { if (!['EEXIST','ERR_FS_CP_EEXIST','ENOENT'].includes(error.code)) throw error; }
await mkdir(resolve(output, 'runtime'), { recursive: true });
await cp(resolve('portable/voiceeye-neural-demo'), resolve(output, 'voiceeye-mvp'), { recursive: true });
try { await access(resolve(output, 'runtime/node.exe')); } catch { await cp(process.execPath, resolve(output, 'runtime/node.exe')); }
await cp(resolve('scripts/serve-neural-demo.mjs'), resolve(output, 'serve.mjs'));
await cp(resolve('portable/neural/README.md'), resolve(output, 'README.md'));
await cp(resolve('portable/neural/README.md'), resolve(output, 'voiceeye-mvp/README.md'));
await cp(resolve('portable/neural/vendor/LICENSE-MIT.txt'), resolve(output, 'voiceeye-mvp/assets/LICENSE-supertonic-code.txt'));
await cp(resolve('portable/neural/model-revisions.json'), resolve(output, 'voiceeye-mvp/assets/model-revisions.json'));
await writeFile(resolve(output, 'runtime/Node-README.txt'), 'Node.js ' + process.version + '\nSource: https://nodejs.org/\nRuntime copied from the development PC. No installer is needed.\n');
await writeFile(resolve(output, '시연시작.bat'), '@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0"\r\n"%~dp0runtime\\node.exe" "%~dp0launch.mjs"\r\nif errorlevel 1 pause\r\n');
await writeFile(resolve(output, 'launch.mjs'), `import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const base = new URL('./', import.meta.url);
const app = fileURLToPath(new URL('./voiceeye-mvp', base));
const server = fileURLToPath(new URL('./serve.mjs', base));
let selected;
for (let port = 8771; port < 8780; port++) {
  const url = 'http://127.0.0.1:' + port + '/';
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(700) });
    const text = await response.text();
    if (text.includes('voiceeye-neural-20260916')) { selected = url; break; }
    continue;
  } catch {}
  const child = spawn(process.execPath, [server, app, String(port)], { detached: true, windowsHide: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    try { const response = await fetch(url, { signal: AbortSignal.timeout(700) }); if ((await response.text()).includes('voiceeye-neural-20260916')) { selected = url; break; } } catch {}
  }
  if (selected) break;
}
if (!selected) { console.error('VoiceEye를 열지 못했습니다. USB 실행 제한과 포트 사용을 확인해 주세요.'); process.exit(1); }
console.log('VoiceEye: ' + selected);
const browser = spawn('cmd.exe', ['/c', 'start', '', selected], { windowsHide: true, stdio: 'ignore' });
browser.on('error', error => { console.error(error.message); process.exitCode = 1; });
`);
await writeFile(resolve(output, 'index.html'), '<!doctype html><html lang="ko"><meta charset="utf-8"><title>VoiceEye 시작 안내</title><body style="font-family:Malgun Gothic;padding:40px"><h1>VoiceEye 행사 준비 회의</h1><p>이 폴더의 시연시작.bat를 실행하세요. 모델을 준비한 뒤 브라우저가 열립니다.</p><p>HTML만 열면 음성 모델을 불러올 수 없습니다.</p><a href="http://127.0.0.1:8771/">시연이 이미 실행 중이면 열기</a></body></html>');
console.log('USB package updated:', output);
