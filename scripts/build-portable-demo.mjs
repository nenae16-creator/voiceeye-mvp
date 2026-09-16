import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const result = spawnSync(
  process.execPath,
  [
    path.join(root, "node_modules/vite/bin/vite.js"),
    "build",
    "--config",
    "portable/vite.config.ts",
  ],
  { cwd: root, stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
const built = path.join(root, "portable/.build");
let html = await readFile(path.join(built, "index.html"), "utf8");
for (const match of [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]) {
  const code = await readFile(path.join(built, match[1]), "utf8");
  html = html.replace(
    match[0],
    () => `<script type="module">${code.replace(/<\/script/gi, "<\\/script")}</script>`,
  );
}
for (const match of [
  ...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g),
]) {
  const css = await readFile(path.join(built, match[1]), "utf8");
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
if (
  /<(?:script|link)\b[^>]*(?:src|href)="/i.test(html) ||
  !html.includes("data:image/jpeg;base64,") ||
  (html.match(/data:audio\/wav;base64,/g)?.length ?? 0) !== 7
) {
  throw new Error(
    "Portable demo still depends on external assets or is missing the meeting image.",
  );
}
await writeFile(path.join(root, "portable/voiceeye-demo/index.html"), html);
console.log(
  `USB demo: ${Buffer.byteLength(html).toLocaleString()} bytes, image/audio/CSS/JavaScript embedded.`,
);
