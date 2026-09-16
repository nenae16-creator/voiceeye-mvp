// Browser/hook doubles verify callback behavior, not device sound or voice quality.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function harness({ local = true, throws = false } = {}) {
  const slots = [],
    effects = [],
    cleanups = [],
    events = [],
    utterances = [];
  let cursor = 0;
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === "function" ? value(slots[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useEffect(effect) {
      const i = cursor++;
      if (!(i in slots)) {
        slots[i] = true;
        effects.push(effect);
      }
    },
  };
  const synth = {
    getVoices: () => [{ lang: "ko-KR", name: "Korean test voice", localService: local }],
    addEventListener() {},
    removeEventListener() {},
    cancel: () => events.push("cancel"),
    speak(u) {
      if (throws) throw new Error("unavailable");
      utterances.push(u);
      events.push("speak");
      u.onstart?.();
    },
  };
  const source = readFileSync(
    new URL("../src/components/demo/MeetingChat.tsx", import.meta.url),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => (name === "react" ? hooks : require(name)),
    window: { speechSynthesis: synth },
    Event,
    SpeechSynthesisUtterance: class {
      constructor(text) {
        this.text = text;
      }
    },
  });
  const props = {
    onBusy: (v) => events.push(`busy:${v}`),
    onStarted: (v) => events.push(["started", v]),
    onCompleted: (v) => events.push(["completed", v]),
  };
  function render() {
    cursor = 0;
    const tree = exports.MeetingChat(props);
    for (const effect of effects.splice(0)) {
      const cleanup = effect();
      if (cleanup) cleanups.push(cleanup);
    }
    return tree;
  }
  function find(predicate, tree = render()) {
    if (!tree || typeof tree !== "object") return null;
    if (predicate(tree)) return tree;
    for (const child of [tree.props?.children].flat(Infinity)) {
      if (!child || typeof child !== "object") continue;
      const found = find(predicate, child);
      if (found) return found;
    }
    return null;
  }
  function prepare() {
    render();
    find((n) => n.type === "textarea").props.onChange({
      target: { value: "화요일 오전이 좋습니다." },
    });
    find((n) => n.type === "form").props.onSubmit({ preventDefault() {} });
  }
  return { find, prepare, events, utterances, unmount: () => cleanups.forEach((fn) => fn()) };
}
const button = (text) => (n) =>
  n.type === "button" &&
  [n.props.children]
    .flat(Infinity)
    .some((child) => typeof child === "string" && child.trim() === text);
const completions = (h) => h.events.filter((e) => Array.isArray(e) && e[0] === "completed");

test("typing and confirming a preview never speaks or creates a record", () => {
  const h = harness();
  h.prepare();
  assert.equal(h.utterances.length, 0);
  assert.equal(completions(h).length, 0);
  assert.ok(h.find(button("음성으로 말하기")));
});
test("explicit speech confirmation pauses other input before playback and records only once on completion", () => {
  const h = harness();
  h.prepare();
  const play = h.find(button("음성으로 말하기")).props.onClick;
  play();
  play();
  assert.equal(h.utterances.length, 1);
  assert.ok(h.events.indexOf("busy:true") < h.events.indexOf("speak"));
  assert.equal(completions(h).length, 0);
  h.utterances[0].onend();
  h.utterances[0].onend();
  assert.equal(completions(h).length, 1);
  assert.equal(completions(h)[0][1], "화요일 오전이 좋습니다.");
});
test("stop and late completion never save an unfinished utterance", () => {
  const h = harness();
  h.prepare();
  h.find(button("음성으로 말하기")).props.onClick();
  h.find(button("발언 중지")).props.onClick();
  h.utterances[0].onend();
  assert.equal(completions(h).length, 0);
  assert.ok(h.find(button("음성으로 말하기")));
});
test("late completion after unmount never updates the meeting", () => {
  const h = harness();
  h.prepare();
  h.find(button("음성으로 말하기")).props.onClick();
  h.unmount();
  h.utterances[0].onend();
  assert.equal(completions(h).length, 0);
});
test("a remote Korean voice cannot silently substitute for a local voice", () => {
  const h = harness({ local: false });
  h.prepare();
  h.find(button("음성으로 말하기")).props.onClick();
  assert.equal(h.utterances.length, 0);
  assert.equal(h.events.includes("busy:true"), false);
});
test("a synchronous device error releases controls and never records success", () => {
  const h = harness({ throws: true });
  h.prepare();
  h.find(button("음성으로 말하기")).props.onClick();
  assert.equal(completions(h).length, 0);
  assert.equal(h.events.at(-1), "busy:false");
  assert.ok(h.find(button("음성으로 말하기")));
});
test("Ctrl+Enter during Korean IME composition cannot publish a preview", () => {
  const h = harness();
  h.prepare();
  const input = h.find((n) => n.type === "textarea");
  input.props.onChange({ target: { value: "작성 중" } });
  h.find((n) => n.type === "textarea").props.onKeyDown({
    key: "Enter",
    ctrlKey: true,
    nativeEvent: { isComposing: true },
    preventDefault() {
      throw new Error("IME must not submit");
    },
  });
  assert.equal(h.find(button("음성으로 말하기")), null);
});
