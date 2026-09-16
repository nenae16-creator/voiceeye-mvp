import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(relative, dependencies = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name] ?? { default: name } });
  return exports;
}
const data = load("../src/data/presentation-scenario.ts");
const audio = load("../src/data/demo-audio.ts");
const { demoFrame, completedDemoRecords, appendRecords, meetingTime, recordText } = load(
  "../src/lib/meeting-demo.ts",
  { "../data/presentation-scenario": data, "../data/demo-audio": audio },
);

test("captions grow during an utterance while the matching anonymous seat is marked", () => {
  const early = demoFrame(9000, true).lines[0];
  const partial = demoFrame(10600, true).lines[0];
  const final = demoFrame(15000, true).lines[0];
  assert.equal(early.visible, false);
  assert.equal(early.talking, false);
  assert.equal(partial.seatId, "2");
  assert.equal(partial.talking, true);
  assert.ok(partial.text.length > 0 && partial.text.length < partial.fullText.length);
  assert.equal(final.text, final.fullText);
  assert.equal(final.final, true);
  assert.equal(final.talking, false);
});
test("private writing never appears in public captions or completed records", () => {
  const frame = demoFrame(55000, true);
  assert.equal(frame.privateStep, true);
  assert.ok(frame.lines.every((line) => !line.visible && line.text === "" && !line.talking));
  assert.ok(completedDemoRecords(80000).every((record) => !record.id.startsWith("demo-49000")));
});
test("overlap examples mark both seats and keep each caption separate", () => {
  const lines = demoFrame(22000, true).lines;
  assert.equal(lines.length, 2);
  assert.ok(lines.every((line) => line.talking && line.visible));
  assert.equal(lines[0].seatId, "2");
  assert.equal(lines[1].seatId, "4");
  assert.notEqual(lines[0].id, lines[1].id);
});
test("the bundled WAV samples have the durations used by the caption timeline", () => {
  for (const [id, sample] of Object.entries(audio.demoAudio)) {
    const bytes = readFileSync(new URL(`../src/assets/demo-audio/${id}.wav`, import.meta.url));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    let offset = 12,
      size = 0;
    while (offset + 8 <= bytes.length) {
      const chunkSize = bytes.readUInt32LE(offset + 4);
      if (bytes.toString("ascii", offset, offset + 4) === "data") {
        size = chunkSize;
        break;
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }
    assert.ok(size > 0);
    assert.equal(Math.ceil((size / 32000) * 1000), sample.durationMs);
  }
});
test("records are added only after the caption finishes, and replay cannot duplicate them", () => {
  assert.equal(completedDemoRecords(700).length, 0);
  const completed = completedDemoRecords(80000);
  assert.equal(completed.length, 7);
  const records = appendRecords([], completed);
  assert.equal(appendRecords(records, completed), records);
  assert.equal(appendRecords([], [completed[0], completed[0]]).length, 1);
});
test("downloaded records preserve typed speech and its source without calling it microphone input", () => {
  const text = recordText([
    { id: "typed", time: "12:30:00", speaker: "나", text: "제 의견입니다.", source: "keyboard" },
  ]);
  assert.match(text, /키보드 발언/);
  assert.match(text, /제 의견입니다/);
  assert.doesNotMatch(text, /마이크 자막/);
  assert.equal(meetingTime(80000), "01:20");
});
