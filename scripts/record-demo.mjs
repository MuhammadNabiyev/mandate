// Records the demo walkthrough with on-screen captions.
// Usage: npm i --no-save playwright && node scripts/record-demo.mjs [baseUrl] [outDir]
import { chromium } from "playwright";
import { mkdirSync, readdirSync, renameSync } from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? "https://mandate-blush.vercel.app";
const out = path.resolve(process.argv[3] ?? "demo-video");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } }, reducedMotion: "no-preference" });

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
    dot.id = "__dot";
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
const wait = (ms) => page.waitForTimeout(ms);
const caption = async (text) => {
  await page.evaluate((t) => {
    sessionStorage.setItem("__cap", t);
    const bar = document.getElementById("__cap");
    if (bar) {
      bar.textContent = t;
      bar.style.opacity = t ? "1" : "0";
    }
  }, text);
};
const click = async (selector) => {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
  await wait(350);
  await el.click();
};
const ask = async (text, ms) => {
  await page.locator('[data-testid="request-input"]').fill("");
  await page.locator('[data-testid="request-input"]').pressSequentially(text, { delay: 45 });
  await wait(300);
  await click('[data-testid="send-request"]');
  await wait(ms);
};

await page.goto(base);
await caption("AI agents can shop now. Handing one your card is the scary part.");
await wait(5500);
await caption("Mandate gives the agent a budget. The model proposes. Plain code decides.");
await click('button:has-text("a bottle of single malt whisky")');
await wait(6000);

await caption("A mandate is an envelope: limits, categories, expiry.");
await click('[data-testid="try-demo"] >> nth=1');
await page.waitForURL("**/desk");
await wait(4500);

await caption("Inside the mandate: the agent asks for gel pens. Cleared.");
await ask("a pack of gel pens", 4500);
await caption("Cleared purchases go to PayPal Orders v2. (Simulated here; the real sandbox runs with your own keys.)");
await click('[data-testid="pay-simulated"]');
await wait(5500);

await caption("Above the ask-me-first threshold, the purchase is held for the owner.");
await ask("a desk lamp under $40", 5000);
await click('[data-testid="approve"]');
await wait(1500);
await caption("Owner approves, then PayPal pays.");
await click('[data-testid="pay-simulated"]');
await wait(5000);

await caption("Wrong category and over the limit: refused, with every rule and the numbers.");
await ask("a bottle of single malt whisky", 7000);

await caption("Want the real thing? Plug in your own PayPal sandbox keys. They stay in this tab only.");
await click('[data-testid="sandbox-toggle"]');
await wait(6500);
await click('[data-testid="sandbox-toggle"]');
await wait(800);

await caption("Every request, decision and PayPal order id lands in the ledger.");
await click('[data-testid="nav-ledger"]');
await wait(7500);

await caption("Write a mandate in plain English and the form fills itself in.");
await click('[data-testid="nav-mandates"]');
await wait(2000);
await click('[data-testid="new-mandate"]');
await page.locator('[data-testid="describe-input"]').pressSequentially("Books and gifts for my sister, $40 a time, $100 a month, ask me above $20", { delay: 35 });
await wait(400);
await click('[data-testid="draft-button"]');
await wait(4500);
await click('[data-testid="save-mandate"]');
await wait(3000);

await caption("Revoke an envelope and the agent has no spending power. Instantly.");
await click('[data-testid="revoke-mnd_pantry"]');
await wait(1200);
await click('[data-testid="confirm-revoke"]');
await wait(5500);

await caption("The server re-prices every cart and re-checks the mandate before any PayPal order.");
await wait(5000);
await caption("Mandate: give your AI agent a budget, not your card.");
await page.goto(base);
await wait(5000);

await context.close();
await browser.close();
const file = readdirSync(out).find((f) => f.endsWith(".webm"));
if (file) renameSync(path.join(out, file), path.join(out, "mandate-demo.webm"));
console.log("saved", path.join(out, "mandate-demo.webm"));
