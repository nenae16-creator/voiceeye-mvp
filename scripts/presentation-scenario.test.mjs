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
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(html, /회의 시연 시작/);
  assert.match(html, /실제 마이크 성능 측정이 아님/);
  assert.match(html, /80000/);
});
