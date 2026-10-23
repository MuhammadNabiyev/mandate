// Records the demo walkthrough with on-screen captions, paced to narration clips.
// Usage: npm i --no-save playwright
//        node scripts/record-demo.mjs [baseUrl] [outDir] [narrationDir]
// With a narrationDir (from make-narration.mjs) every step lasts at least as long as its clip, and
// timeline.json records when each step started so mux-narration.mjs can place the audio.
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? "https://mandate-blush.vercel.app";
const out = path.resolve(process.argv[3] ?? "demo-video");
const narrationDir = process.argv[4] ? path.resolve(process.argv[4]) : null;
mkdirSync(out, { recursive: true });

const lines = JSON.parse(readFileSync(new URL("./narration.json", import.meta.url), "utf8"));
const byId = Object.fromEntries(lines.map((l) => [l.id, l]));
const durations = narrationDir && existsSync(path.join(narrationDir, "durations.json")) ? JSON.parse(readFileSync(path.join(narrationDir, "durations.json"), "utf8")) : {};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } } });

// Caption bar and a visible cursor dot, re-created after every full page load.
await context.addInitScript(() => {
  const mount = () => {
    if (document.getElementById("__cap")) return;
    const bar = document.createElement("div");
    bar.id = "__cap";
    bar.style.cssText = "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);max-width:880px;padding:12px 22px;background:rgba(20,28,64,.94);color:#fff;font:600 20px/1.35 system-ui,sans-serif;border-radius:10px;z-index:2147483647;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.3);pointer-events:none;transition:opacity .3s";
    bar.textContent = sessionStorage.getItem("__cap") ?? "";
    bar.style.opacity = bar.textContent ? "1" : "0";
    document.documentElement.appendChild(bar);
    const dot = document.createElement("div");
    dot.style.cssText = "position:fixed;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(30,70,200,.35);border:2px solid rgba(30,70,200,.9);z-index:2147483647;pointer-events:none;left:-50px;top:-50px;transition:left .06s linear,top .06s linear";
    document.documentElement.appendChild(dot);
    addEventListener("mousemove", (e) => {
      dot.style.left = e.clientX + "px";
      dot.style.top = e.clientY + "px";
    });
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", mount);
  else mount();
});

const page = await context.newPage();
const t0 = Date.now();
const timeline = {};
const wait = (ms) => page.waitForTimeout(ms);
let current = null;

/** Start a step: show its caption and remember when it began. */
async function say(id) {
  current = { id, at: Date.now() };
  timeline[id] = (current.at - t0) / 1000;
  await page.evaluate((t) => {
    sessionStorage.setItem("__cap", t);
    const bar = document.getElementById("__cap");
    if (bar) {
      bar.textContent = t;
      bar.style.opacity = "1";
    }
  }, byId[id].caption);
}
/** End a step: keep the screen until its narration has finished (plus a short breath). */
async function hold(minMs = 0) {
  const need = Math.max(minMs, (durations[current.id] ?? 0) * 1000 + 700);
  const left = need - (Date.now() - current.at);
  if (left > 0) await wait(left);
}
const click = async (selector) => {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
  await wait(350);
  await el.click();
};
const ask = async (text) => {
  await page.locator('[data-testid="request-input"]').fill("");
  await page.locator('[data-testid="request-input"]').pressSequentially(text, { delay: 45 });
  await wait(300);
  await click('[data-testid="send-request"]');
};

await page.goto(base);
await say("intro");
await hold(4500);

await say("hero");
await click('button:has-text("a bottle of single malt whisky")');
await hold(5000);

await say("try");
await click('[data-testid="try-demo"] >> nth=1');
await page.waitForURL("**/desk");
await hold(3500);

await say("pens");
await ask("I need pens for taking notes");
await hold(4500);

await say("pay");
await click('[data-testid="pay-simulated"]');
await hold(5000);

await say("lamp");
await ask("something to light my desk in the evening");
await hold(4500);

await say("approve");
await click('[data-testid="approve"]');
await wait(1200);
await click('[data-testid="pay-simulated"]');
await hold(4000);

await say("whisky");
await ask("a nice bottle of whisky as a gift");
await hold(6500);

await say("sandbox");
await click('[data-testid="sandbox-toggle"]');
await hold(5500);
await click('[data-testid="sandbox-toggle"]');
await wait(700);

await say("ledger");
await click('[data-testid="nav-ledger"]');
await hold(6000);

await say("mandates");
await click('[data-testid="nav-mandates"]');
await wait(1500);
await click('[data-testid="new-mandate"]');
await page.locator('[data-testid="describe-input"]').pressSequentially("Books and gifts for my sister, $40 a time, $100 a month, ask me above $20", { delay: 35 });
await wait(400);
await click('[data-testid="draft-button"]');
await wait(3500);
await click('[data-testid="save-mandate"]');
await hold(4500);

await say("revoke");
await click('[data-testid="revoke-mnd_pantry"]');
await wait(1200);
await click('[data-testid="confirm-revoke"]');
await hold(5000);

await say("security");
await hold(5000);

await page.goto(base);
await say("outro");
await hold(4500);

await context.close();
await browser.close();
const file = readdirSync(out).find((f) => f.endsWith(".webm"));
if (file) renameSync(path.join(out, file), path.join(out, "mandate-demo.webm"));
writeFileSync(path.join(out, "timeline.json"), JSON.stringify(timeline, null, 2));
console.log("saved", path.join(out, "mandate-demo.webm"));
