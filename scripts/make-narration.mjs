// Generates one MP3 per narration line with ElevenLabs and writes durations.json.
// Usage: ELEVENLABS_API_KEY=sk_... VOICE_ID=... node scripts/make-narration.mjs <ffmpeg> [outDir]
// The key is read from the environment only; nothing is stored.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ffmpeg = process.argv[2];
const out = path.resolve(process.argv[3] ?? "narration");
const key = process.env.ELEVENLABS_API_KEY;
const voice = process.env.VOICE_ID;
if (!ffmpeg || !key || !voice) throw new Error("Need <ffmpeg> argument plus ELEVENLABS_API_KEY and VOICE_ID in the environment.");
mkdirSync(out, { recursive: true });

const lines = JSON.parse(readFileSync(new URL("./narration.json", import.meta.url), "utf8"));
const durations = {};

for (const line of lines) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ text: line.say, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15 } }),
  });
  if (!res.ok) throw new Error(`${line.id}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const file = path.join(out, `${line.id}.mp3`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  let info = "";
  try {
    execFileSync(ffmpeg, ["-hide_banner", "-i", file], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    info = String(e.stderr);
  }
  const m = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
  durations[line.id] = m ? +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]) : 4;
  console.log(line.id, durations[line.id].toFixed(2) + "s");
}
writeFileSync(path.join(out, "durations.json"), JSON.stringify(durations, null, 2));
