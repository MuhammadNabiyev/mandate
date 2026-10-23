// Lays the narration clips over the recorded video at the times in timeline.json.
// Usage: node scripts/mux-narration.mjs <ffmpeg> <video.webm> <narrationDir> <timeline.json> <out.webm> [videoKbps]
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [ffmpeg, video, dir, timelinePath, out, kbps = "500"] = process.argv.slice(2);
if (!out) throw new Error("usage: mux-narration.mjs <ffmpeg> <video> <narrationDir> <timeline.json> <out.webm> [videoKbps]");
const lines = JSON.parse(readFileSync(new URL("./narration.json", import.meta.url), "utf8"));
const timeline = JSON.parse(readFileSync(timelinePath, "utf8"));

const inputs = ["-i", video];
const filters = [];
const labels = [];
lines.forEach((l, i) => {
  inputs.push("-i", path.join(dir, `${l.id}.mp3`));
  const ms = Math.round((timeline[l.id] ?? 0) * 1000) + 250;
  filters.push(`[${i + 1}:a]adelay=${ms}|${ms},volume=1.0[a${i}]`);
  labels.push(`[a${i}]`);
});
filters.push(`${labels.join("")}amix=inputs=${lines.length}:normalize=0,alimiter=limit=0.95[aout]`);

execFileSync(
  ffmpeg,
  ["-hide_banner", "-loglevel", "error", "-y", ...inputs, "-filter_complex", filters.join(";"), "-map", "0:v", "-map", "[aout]", "-c:v", "libvpx-vp9", "-b:v", `${kbps}k`, "-maxrate", `${Math.round(kbps * 1.4)}k`, "-deadline", "good", "-cpu-used", "4", "-pix_fmt", "yuv420p", "-c:a", "libopus", "-b:a", "48k", out],
  { stdio: "inherit" },
);
console.log("saved", out);
