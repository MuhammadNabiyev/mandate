# Mandate

**Give your AI agent a budget, not your card.**

Mandate sits between an AI shopping agent and PayPal. The model proposes a purchase; plain, tested code decides whether it is allowed; PayPal pays. Built for the PayPal AI Hackathon.

Live demo: _add the Vercel URL here_ · No sign-up · PayPal **sandbox** only, no real money moves.

## The idea

Agents that can buy things are arriving, and the scary part is handing one a card. A system prompt saying "spend at most $50" is a suggestion; a confused or manipulated model can ignore it. Mandate moves the limit out of the prompt:

- The **owner** writes a *mandate* (an "envelope"): a per-purchase limit, a rolling budget (day / week / month), allowed categories, blocked merchants, an expiry, and an "ask me first above $X" threshold. A plain-English description fills the form; every field stays editable.
- The **agent** (an AI model) sees only the product catalog and the request. It proposes a cart. It never sees the mandate and cannot negotiate with it.
- The **policy engine** (`src/lib/policy.ts`, pure and unit tested) returns **Cleared**, **Hold** (needs the owner's OK) or **Refused**, listing every rule that fired with the exact numbers.
- Cleared or approved carts become a **PayPal Orders v2** order, approved by the buyer and captured, and land in a **ledger** with the PayPal order and capture ids.
- Revoke or pause an envelope at any time and the agent's spending power ends immediately.

## How PayPal and AI are used

| Piece | What it does |
| --- | --- |
| PayPal JS SDK buttons | The buyer approves the sandbox payment |
| `POST /v2/checkout/orders` | Server creates the order from the *re-priced* cart, after re-running the policy |
| `POST /v2/checkout/orders/{id}/capture` | Server captures after approval |
| AI model (Gemini or any OpenAI-compatible endpoint) | Chooses catalog items for a request; drafts a mandate from plain English |
| Built-in matcher | Keeps everything working with no AI key |

Without PayPal keys the app runs a clearly labelled local simulator for the same create + capture flow.

## Security model

- Money is integer cents everywhere.
- The browser's cart is never trusted: the server rebuilds every line item and price from the catalog (`src/lib/validate.ts`) and re-evaluates the mandate before creating any order (`src/app/api/checkout/create/route.ts`).
- Model output is validated against the catalog: invented SKUs, prices or quantities are dropped.
- Honest limitation: this is a demo, so mandates and the ledger live in the browser's local storage and the server checks what the browser sends. A production version would store and sign mandates server-side.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: add PayPal sandbox and/or AI keys
npm run dev                   # http://localhost:3000
npm test                      # policy, drafter, validation, simulator
```

Try it: open the agent desk, pick an envelope, and ask for *a desk lamp under $40* (Hold), *a pack of gel pens* (Cleared) and *a bottle of single malt whisky* (Refused).

### PayPal sandbox

1. Create a sandbox app at <https://developer.paypal.com/dashboard/applications/sandbox>.
2. Put its client id and secret in `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
3. Approve payments with a sandbox personal account.

### AI

Set `AI_PROVIDER=gemini` with `GEMINI_API_KEY`, or `AI_PROVIDER=openai` with `AI_BASE_URL`, `AI_API_KEY` and `AI_MODEL` for any OpenAI-compatible endpoint (open-weight models included).

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI, TypeScript, Vitest.

## License

MIT. See [LICENSE](LICENSE).
