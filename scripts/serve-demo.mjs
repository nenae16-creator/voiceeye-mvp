import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const demoPath = new URL("../portable/voiceeye-demo/index.html", import.meta.url);
createServer(async (request, response) => {
  if (request.url !== "/") {
    response.writeHead(404);
    response.end();
    return;
  }
  const html = await readFile(demoPath);
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(html);
}).listen(8081, "127.0.0.1", () => console.log("VoiceEye standalone demo: http://127.0.0.1:8081/"));
