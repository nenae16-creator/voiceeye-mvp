// Isolated component callback tests. Hook/browser doubles do not establish device audio quality.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function harness({ cloud = false, local = true, speechAvailable = true } = {}) {
  const slots = [],
    cleanups = [],
    effects = [],
    events = [],
    utterances = [],
    audioInstances = [];
  let cursor = 0,
    preview = null,
    resolveCloud;
  const pendingCloud = new Promise((resolve) => {
    resolveCloud = resolve;
  });
  const synth = {
    getVoices: () => [{ lang: "ko-KR", name: "Test Korean", localService: local }],
    addEventListener() {},
    removeEventListener() {},
    cancel: () => events.push("cancel"),
    speak: (u) => {
      utterances.push(u);
      events.push("speak");
      u.onstart?.();
    },
  };
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (value) => {
          slots[index] = typeof value === "function" ? value(slots[index]) : value;
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      const previous = slots[index];
      const changed =
        !previous ||
        !previous.deps ||
        deps.length !== previous.deps.length ||
        deps.some((value, depIndex) => !Object.is(value, previous.deps[depIndex]));
      if (changed) slots[index] = { callback, deps };
      return slots[index].callback;
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in slots)) {
        slots[index] = true;
        effects.push(effect);
      }
    },
  };
  const source = readFileSync(
    new URL("../src/components/hud/SpeakComposer.tsx", import.meta.url),
    "utf8",
  ).replace(
    "import.meta.env.VITE_VOICEEYE_TTS_PROVIDER",
    JSON.stringify(cloud ? "cloud" : "device"),
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
    require: (name) =>
      name === "react"
        ? hooks
        : name === "@/lib/speak"
          ? {
              speakUtterance: () => {
                events.push("request");
                return pendingCloud;
              },
            }
          : require(name),
    window: speechAvailable ? { speechSynthesis: synth } : {},
    SpeechSynthesisUtterance: class {
      constructor(text) {
        this.text = text;
      }
    },
    Audio: class {
      constructor(src) {
        this.src = src;
        audioInstances.push(this);
        events.push("audio-created");
      }
      play() {
        events.push("audio-play");
        this.onplaying?.();
        return Promise.resolve();
      }
      pause() {
        events.push("audio-pause");
      }
      removeAttribute() {
        this.src = "";
      }
    },
    setTimeout,
    clearTimeout,
  });
  const props = {
    speaking: false,
    onPreview: (value) => {
      preview = value;
    },
    onStart: () => events.push("start"),
    onDone: (value) => events.push(["done", value]),
    onFail: (value) => events.push(["fail", value]),
    onBusy: (value) => events.push(["busy", value]),
  };
  function render() {
    cursor = 0;
    const tree = exports.SpeakComposer({ ...props, preview });
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
      const result = find(predicate, child);
      if (result) return result;
    }
    return null;
  }
  function prepare() {
    render();
    find((n) => n.type === "input").props.onChange({ target: { value: "확인한 문장입니다." } });
    find((n) => n.type === "form").props.onSubmit({ preventDefault() {} });
  }
  return {
    render,
    find,
    prepare,
    events,
    utterances,
    audioInstances,
    resolveCloud,
    unmount: () => cleanups.forEach((fn) => fn()),
  };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
const byText = (text) => (n) =>
  n.type === "button" && [n.props.children].flat(Infinity).includes(text);

test("Enter submission only previews, including repeated submissions", async () => {
  const h = harness();
  h.prepare();
  for (let i = 0; i < 3; i++)
    h.find((n) => n.type === "form").props.onSubmit({ preventDefault() {} });
  await tick();
  assert.equal(h.events.includes("speak"), false);
  assert.equal(h.events.includes("request"), false);
});

test("Stop settles playback even if the browser emits no cancel event, and never records completion", async () => {
  const h = harness();
  h.prepare();
  h.find(byText("스피커로 전송")).props.onClick();
  const stop = h.find(byText("발언 중지"));
  assert.ok(stop, "Playback must expose a stop button");
  stop.props.onClick();
  await tick();
  assert.ok(h.events.includes("cancel"));
  assert.equal(
    h.events.some((e) => e[0] === "done"),
    false,
  );
  assert.ok(h.events.some((e) => e[0] === "busy" && e[1] === false));
});

test("Stop during synthesis ignores the late cloud response", async () => {
  const h = harness({ cloud: true });
  h.prepare();
  h.find(byText("스피커로 전송")).props.onClick();
  h.find(byText("발언 중지"))?.props.onClick();
  h.resolveCloud({ ok: true, mime: "audio/mpeg", audio: "", text: "확인한 문장입니다." });
  await tick();
  assert.equal(h.events.includes("audio-created"), false);
  assert.equal(
    h.events.some((e) => e[0] === "done"),
    false,
  );
});

test("Device mode refuses remote-only Korean voices", async () => {
  const h = harness({ local: false });
  h.prepare();
  h.find(byText("스피커로 전송")).props.onClick();
  await tick();
  assert.equal(h.events.includes("speak"), false);
  assert.ok(h.events.some((e) => e[0] === "fail"));
});

test("Missing speechSynthesis does not crash mount", () => {
  const h = harness({ speechAvailable: false });
  assert.doesNotThrow(() => h.render());
});

test("Double click synthesizes once and completion is recorded only after onend", async () => {
  const h = harness();
  h.prepare();
  const send = h.find(byText("스피커로 전송"));
  send.props.onClick();
  send.props.onClick();
  assert.equal(h.utterances.length, 1);
  assert.equal(
    h.events.some((e) => e[0] === "done"),
    false,
  );
  h.utterances[0].onend();
  await tick();
  assert.equal(h.events.filter((e) => e[0] === "done").length, 1);
});

test("Synthesis failure never records a completed utterance", async () => {
  const h = harness();
  h.prepare();
  h.find(byText("스피커로 전송")).props.onClick();
  h.utterances[0].onerror({ error: "synthesis-failed" });
  await tick();
  assert.equal(
    h.events.some((e) => e[0] === "done"),
    false,
  );
  assert.ok(h.events.some((e) => e[0] === "fail"));
});

test("Unmount cancels audio and ignores later completion", async () => {
  const h = harness();
  h.prepare();
  h.find(byText("스피커로 전송")).props.onClick();
  const lateEnd = h.utterances[0].onend;
  h.unmount();
  lateEnd();
  await tick();
  assert.equal(
    h.events.some((e) => e[0] === "done"),
    false,
  );
});

test("Cloud playback identifies the provider and data-processing route", async () => {
  for (const [provider, label] of [
    ["clova", "CLOVA 음성 · 국내 처리"],
    ["xai", "xAI 음성 · 국외 전송"],
  ]) {
    const h = harness({ cloud: true });
    h.prepare();
    h.find(byText("스피커로 전송")).props.onClick();
    h.resolveCloud({
      ok: true,
      provider,
      mime: "audio/mpeg",
      audio: "",
      text: "확인한 문장입니다.",
    });
    await tick();

    assert.ok(
      h.find((node) =>
        [node.props?.children]
          .flat(Infinity)
          .some((child) => typeof child === "string" && child.includes(label)),
      ),
      `${provider} route must be visible`,
    );

    h.audioInstances[0].onended();
    await tick();
  }
});
