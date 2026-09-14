import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

function harness(initialProps = {}) {
  const slots = [];
  const pendingEffects = [];
  const recognitionInstances = [];
  const timers = new Map();
  const finals = [];
  const listeningChanges = [];
  const partials = [];
  let cursor = 0;
  let nextTimerId = 1;
  let mounted = true;
  let props = {
    disabled: false,
    onPartial: (value) => partials.push(value),
    onFinal: (value) => finals.push(value),
    onListeningChange: (value) => listeningChanges.push(value),
    ...initialProps,
  };

  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { kind: "state", value: initial };
      return [
        slots[index].value,
        (value) => {
          if (!mounted) return;
          slots[index].value =
            typeof value === "function" ? value(slots[index].value) : value;
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { kind: "ref", current: initial };
      return slots[index];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      const changed =
        !previous ||
        deps === undefined ||
        previous.deps === undefined ||
        deps.length !== previous.deps.length ||
        deps.some((value, depIndex) => !Object.is(value, previous.deps[depIndex]));
      if (!previous) slots[index] = { kind: "effect", deps, cleanup: null };
      else slots[index].deps = deps;
      if (changed) pendingEffects.push({ index, effect });
    },
  };

  class MockRecognition {
    constructor() {
      this.lang = "";
      this.continuous = false;
      this.interimResults = false;
      this.maxAlternatives = 0;
      this.onstart = null;
      this.onend = null;
      this.onresult = null;
      this.onerror = null;
      this.startCount = 0;
      this.stopCount = 0;
      this.abortCount = 0;
      recognitionInstances.push(this);
    }

    start() {
      this.startCount += 1;
    }

    stop() {
      this.stopCount += 1;
    }

    abort() {
      this.abortCount += 1;
    }

    emitStart() {
      this.onstart?.();
    }

    emitEnd() {
      this.onend?.();
    }

    emitError(error) {
      this.onerror?.({ error });
    }

    emitResult({ index = 0, text = "테스트 발언", final = true, confidence = 0.9 } = {}) {
      const results = [];
      results[index] = {
        isFinal: final,
        0: { transcript: text, confidence },
      };
      this.onresult?.({ resultIndex: index, results });
    }
  }

  const fakeWindow = {
    SpeechRecognition: MockRecognition,
    setTimeout(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };

  const source = readFileSync(
    new URL("../src/components/hud/LiveTranscriber.tsx", import.meta.url),
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
    require: (name) =>
      name === "react"
        ? hooks
        : name === "@/lib/cn"
          ? { cn: (...values) => values.filter(Boolean).join(" ") }
          : require(name),
    window: fakeWindow,
    setTimeout,
    clearTimeout,
    Date,
  });

  function flushEffects() {
    for (const { index, effect } of pendingEffects.splice(0)) {
      slots[index].cleanup?.();
      slots[index].cleanup = effect() ?? null;
    }
  }

  function render() {
    cursor = 0;
    const tree = exports.LiveTranscriber(props);
    flushEffects();
    return tree;
  }

  function find(predicate, tree = null) {
    const root = tree ?? render();
    if (!root || typeof root !== "object") return null;
    if (predicate(root)) return root;
    for (const child of [root.props?.children].flat(Infinity)) {
      if (!child || typeof child !== "object") continue;
      const result = find(predicate, child);
      if (result) return result;
    }
    return null;
  }

  function runTimers() {
    const scheduled = [...timers.values()];
    timers.clear();
    for (const timer of scheduled) timer.callback();
  }

  function unmount() {
    mounted = false;
    for (const slot of slots) slot?.cleanup?.();
  }

  return {
    render,
    find,
    runTimers,
    timers,
    recognitionInstances,
    finals,
    listeningChanges,
    partials,
    setProps(next) {
      props = { ...props, ...next };
      return render();
    },
    unmount,
  };
}

const buttonByText = (text) => (node) =>
  node.type === "button" && [node.props.children].flat(Infinity).includes(text);

test("stopping and immediately restarting ignores the old recognition onend", () => {
  const h = harness();
  h.render();
  h.find(buttonByText("실시간 자막 시작")).props.onClick();
  const oldRecognition = h.recognitionInstances[0];
  oldRecognition.emitStart();

  h.find(buttonByText("마이크 끄기")).props.onClick();
  h.find(buttonByText("실시간 자막 시작")).props.onClick();
  const currentRecognition = h.recognitionInstances[1];

  oldRecognition.emitEnd();
  h.runTimers();

  assert.equal(oldRecognition.startCount, 1);
  assert.equal(currentRecognition.startCount, 1);
});

test("the same final result index is emitted only once per recognition session", () => {
  const h = harness();
  h.render();
  h.find(buttonByText("실시간 자막 시작")).props.onClick();
  const recognition = h.recognitionInstances[0];
  recognition.emitStart();

  recognition.emitResult({ index: 0, text: "확정 자막" });
  recognition.emitResult({ index: 0, text: "확정 자막" });

  assert.equal(h.finals.length, 1);
  assert.equal(h.finals[0].text, "확정 자막");
});

test("a user-initiated restart clears the previous no-speech alert", () => {
  const h = harness();
  h.render();
  h.find(buttonByText("실시간 자막 시작")).props.onClick();
  const recognition = h.recognitionInstances[0];
  recognition.emitStart();
  recognition.emitError("no-speech");

  assert.ok(h.find((node) => node.props?.role === "alert"));

  recognition.emitEnd();
  h.find(buttonByText("실시간 자막 시작")).props.onClick();
  h.recognitionInstances[1].emitStart();

  assert.equal(h.find((node) => node.props?.role === "alert"), null);
});

test("no-speech stops automatic restart and leaves an explicit start action", () => {
  const h = harness();
  h.render();
  h.find(buttonByText("실시간 자막 시작")).props.onClick();
  const recognition = h.recognitionInstances[0];
  recognition.emitStart();
  recognition.emitError("no-speech");
  recognition.emitEnd();

  assert.equal(h.timers.size, 0);
  assert.ok(h.find(buttonByText("실시간 자막 시작")));
});

test("late results from a stopped recognition session are ignored", () => {
  const h = harness();
  h.render();
  h.find(buttonByText("실시간 자막 시작")).props.onClick();
  const oldRecognition = h.recognitionInstances[0];
  oldRecognition.emitStart();

  h.find(buttonByText("마이크 끄기")).props.onClick();
  h.find(buttonByText("실시간 자막 시작")).props.onClick();
  const currentRecognition = h.recognitionInstances[1];
  currentRecognition.emitStart();

  oldRecognition.emitResult({ text: "늦게 도착한 이전 자막" });

  assert.equal(h.finals.length, 0);
});

test("disabling STT for speaker playback aborts the microphone session", () => {
  const h = harness();
  h.render();
  h.find(buttonByText("실시간 자막 시작")).props.onClick();
  const recognition = h.recognitionInstances[0];
  recognition.emitStart();

  h.setProps({ disabled: true });

  assert.equal(recognition.abortCount, 1);
  assert.equal(h.listeningChanges.at(-1), false);
  assert.equal(h.partials.at(-1), "");
});

test("the STT status explains why captions pause during speaker playback", () => {
  const h = harness({ disabled: true });
  h.render();

  assert.ok(
    h.find(
      (node) =>
        node.props?.role === "status" &&
        [node.props.children]
          .flat(Infinity)
          .some(
            (child) =>
              typeof child === "string" && child.includes("합성 음성 되받음을 막기 위해"),
          ),
    ),
  );
});
