import { presentationScenario, scenarioStepAt } from "../data/presentation-scenario";
import { demoAudio } from "../data/demo-audio";

export type MeetingRecord = {
  id: string;
  time: string;
  speaker: string;
  text: string;
  source: "demo" | "microphone" | "keyboard";
};

export const meetingSeats = [
  { id: "1", name: "화자 1", role: "참석자", x: 13, y: 32, w: 12, h: 24 },
  { id: "2", name: "화자 2", role: "상담 담당", x: 32.5, y: 34, w: 8, h: 20 },
  { id: "3", name: "화자 3", role: "진행", x: 54.3, y: 36, w: 8, h: 19 },
  { id: "4", name: "화자 4", role: "운영 지원", x: 76.2, y: 36, w: 8, h: 20 },
  { id: "5", name: "화자 5", role: "참석자", x: 90, y: 37, w: 11, h: 24 },
] as const;

export function seatForLine(seat: string) {
  return seat === "left" ? "2" : seat === "center" ? "3" : seat === "right" ? "4" : null;
}

export function speakerForLine(seat: string) {
  const id = seatForLine(seat);
  return id ? meetingSeats.find((item) => item.id === id)!.name : seat === "self" ? "나" : "안내";
}

export function meetingTime(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function lineTiming(stepStart: number, lineIndex: number, text: string, overlap: boolean) {
  const id = `demo-${stepStart}-${lineIndex}`;
  const audio = demoAudio[id];
  const startsAt = 600 + lineIndex * (overlap ? 1200 : 4300);
  const duration = audio?.durationMs ?? Math.max(1600, Math.min(3600, text.length * 85));
  return { id, startsAt, duration, audioSrc: audio?.src };
}

export function demoFrame(elapsed: number, started: boolean) {
  const { index, step } = scenarioStepAt(elapsed);
  const relative = elapsed - step.startMs;
  const privateStep = index === 5;
  const lines = step.lines.map((line, lineIndex) => {
    const { id, startsAt, duration, audioSrc } = lineTiming(
      step.startMs,
      lineIndex,
      line.text,
      Boolean(step.warning),
    );
    const fraction = Math.max(0, Math.min(1, (relative - startsAt) / duration));
    return {
      ...line,
      id,
      audioSrc,
      speaker: speakerForLine(line.seat),
      seatId: seatForLine(line.seat),
      visible: started && relative >= startsAt && !privateStep,
      text: privateStep ? "" : line.text.slice(0, Math.floor(line.text.length * fraction)),
      fullText: line.text,
      final: fraction >= 1,
      talking:
        relative >= startsAt &&
        relative < startsAt + duration &&
        !privateStep &&
        line.seat !== "system",
      startsAt,
      endsAt: startsAt + duration,
    };
  });
  return { index, step, lines, privateStep, relative };
}

export function completedDemoRecords(elapsed: number): MeetingRecord[] {
  return presentationScenario.flatMap((step, index) => {
    if (index === 5) return [];
    return step.lines.flatMap((line, lineIndex) => {
      const { startsAt, duration } = lineTiming(
        step.startMs,
        lineIndex,
        line.text,
        Boolean(step.warning),
      );
      const endsAt = step.startMs + startsAt + duration;
      if (line.seat === "system" || elapsed < endsAt) return [];
      return [
        {
          id: `demo-${step.startMs}-${lineIndex}`,
          time: meetingTime(endsAt),
          speaker: speakerForLine(line.seat),
          text: line.text,
          source: "demo" as const,
        },
      ];
    });
  });
}

export function appendRecords(current: MeetingRecord[], incoming: MeetingRecord[]) {
  const ids = new Set(current.map((item) => item.id));
  const added = incoming.filter((item) => {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
    return true;
  });
  return added.length ? [...current, ...added] : current;
}

export function recordText(records: MeetingRecord[]) {
  const labels = { demo: "대본 시연", microphone: "마이크 자막", keyboard: "키보드 발언" };
  return `VoiceEye 회의 기록\n\n${records.map((item) => `[${item.time}] ${item.speaker} (${labels[item.source]})\n${item.text}`).join("\n\n")}\n`;
}
