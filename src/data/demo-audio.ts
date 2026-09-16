// Synthetic samples: Windows Microsoft Heami Desktop, 16 kHz PCM mono. Not meeting recordings.
import audio0 from "../assets/demo-audio/demo-0-0.wav";
import audio1 from "../assets/demo-audio/demo-9000-0.wav";
import audio2 from "../assets/demo-audio/demo-19000-0.wav";
import audio3 from "../assets/demo-audio/demo-19000-1.wav";
import audio4 from "../assets/demo-audio/demo-39000-0.wav";
import audio5 from "../assets/demo-audio/demo-60000-0.wav";
import audio6 from "../assets/demo-audio/demo-70000-0.wav";
export const demoAudio: Record<string, { src: string; durationMs: number }> = {
  "demo-0-0": { src: audio0, durationMs: 4835 },
  "demo-9000-0": { src: audio1, durationMs: 4835 },
  "demo-19000-0": { src: audio2, durationMs: 3745 },
  "demo-19000-1": { src: audio3, durationMs: 3700 },
  "demo-39000-0": { src: audio4, durationMs: 3010 },
  "demo-60000-0": { src: audio5, durationMs: 6270 },
  "demo-70000-0": { src: audio6, durationMs: 5150 },
};
