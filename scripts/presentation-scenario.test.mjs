import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the presentation scenario is a complete 80-second meeting", async () => {
  const source = await readFile(new URL("src/data/presentation-scenario.ts", root), "utf8");
  const starts = [...source.matchAll(/startMs:\s*(\d+)/g)].map((match) => Number(match[1]));
  assert.equal(starts.length, 8);
  assert.deepEqual(starts, [0, 9000, 19000, 29000, 39000, 49000, 60000, 70000]);
  assert.match(source, /PRESENTATION_DURATION_MS\s*=\s*80000/);
  assert.match(source, /시연용 대본/);
  assert.match(source, /실제 마이크 성능 측정이 아님/);
});

test("the USB demo is self-contained and uses the same scenario", async () => {
  const html = await readFile(new URL("portable/voiceeye-demo/index.html", root), "utf8");
  const shell = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style>[\s\S]*?<\/style>/gi, "");
  assert.ok(
    !/<(?:script|link)\b[^>]*(?:src|href)="/i.test(shell),
    "No external script or stylesheet",
  );
  assert.ok(html.includes("data:image/jpeg;base64,"), "Meeting image is embedded");
  assert.ok(html.includes("회의 시연 시작"), "Meeting controls are bundled");
  assert.ok(html.includes("실제 마이크 인식률과 자동 화자 판정 성능"), "Limitations are visible");
  assert.ok(html.includes("화요일 오전으로 정하고"), "Scenario dialogue is bundled");
});
