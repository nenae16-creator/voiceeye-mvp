import { presentationScenario } from "../src/data/presentation-scenario.ts";
const lines = presentationScenario.flatMap((step, index) =>
  index === 5
    ? []
    : step.lines.flatMap((line, lineIndex) =>
        line.seat === "system"
          ? []
          : [{ id: `demo-${step.startMs}-${lineIndex}`, text: line.text }],
      ),
);
console.log(JSON.stringify(lines));
