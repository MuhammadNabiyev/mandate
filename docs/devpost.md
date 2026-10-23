# Devpost submission text (Mandate)

**Project name:** Mandate

**Tagline (60 chars):** Give your AI agent a budget, not your card.

## Inspiration
AI agents that can shop are arriving, and the scary part is giving one a card. A system prompt that says "spend at most $50" is only a suggestion: a confused or manipulated model can ignore it. We wanted a limit that no prompt can talk its way around.

## What it does
Mandate sits between an AI shopping agent and PayPal.
- You write a **mandate** (an "envelope"): per-purchase limit, a rolling budget per day, week or month, allowed categories, blocked merchants, an expiry, and an "ask me first above $X" threshold. Describe it in plain English and the form fills itself in.
- The **agent** is an AI model that sees only the product catalog and the request. It proposes a cart. It never sees the mandate.
- A **policy engine**, plain tested code, answers **Cleared**, **Hold** (needs your OK) or **Refused**, and lists every rule that fired with the exact numbers.
- Cleared or approved carts become a **PayPal Orders v2** order, are approved and captured in the sandbox, and land in a **ledger** with the PayPal order and capture ids.
- Pause or revoke an envelope at any moment and the agent's spending power ends immediately.

## How we built it
Next.js 16, React 19, Tailwind 4, Radix UI, TypeScript. PayPal JS SDK buttons plus server-side `POST /v2/checkout/orders` and `/capture` against the sandbox. The AI layer is pluggable (Gemini or any OpenAI-compatible endpoint, open-weight models included) with a built-in matcher as fallback. The server rebuilds every line item and price from the catalog and re-runs the mandate before it creates any PayPal order, so a tampered browser cannot raise a limit. 26 unit tests cover the policy engine, the drafter, request validation and the PayPal layer.

## Challenges
Making "the model proposes, code decides" real rather than a slogan: the model never sees limits, its output is validated against the catalog, and the server re-checks everything. Designing a money screen that explains every refusal in one glance.

## What we learned
Agentic commerce needs a trust layer that is not a prompt. Showing the exact rule and numbers behind each decision makes owners comfortable with autonomy.

## What's next
Server-side signed mandates, PayPal Vault for pre-approved recurring agent purchases, merchant allow-lists from real product search, and spend alerts.

## Try it
Live demo (no sign-up): https://mandate-blush.vercel.app
Open the **Agent desk**, pick an envelope and ask for "a pack of gel pens" (Cleared), "a desk lamp under $40" (Hold) and "a bottle of single malt whisky" (Refused). To use the real PayPal sandbox, choose "Use my own sandbox keys" on the desk and paste a sandbox Client ID and Secret from developer.paypal.com. They stay in that browser tab only.

Code: https://github.com/MuhammadNabiyev/mandate (MIT)

## Built with
nextjs, react, typescript, tailwindcss, radix-ui, paypal, paypal-orders-api, gemini, vercel, vitest

## Honest limitation
Demo-grade trust model: mandates and the ledger live in the browser's storage and the server checks what the browser sends. A production version would store and sign mandates server-side.
