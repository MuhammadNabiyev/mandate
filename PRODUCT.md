# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI primitives, TypeScript. Delegated by the owner: chosen to match their existing deployed project and Vercel hosting.

## Users
People who let an AI assistant shop for them (or for a household or small team) and want a hard ceiling on what it can spend. Typical moment: they have just tried an AI agent that can buy things and feel uneasy about handing it a card. The job: set rules once, then let the agent work without supervising every purchase. Secondary viewer: a hackathon judge who must understand the product and run it in under three minutes.

## Product Purpose
Mandate gives an AI shopping agent a spending mandate: per-purchase limit, rolling budget, allowed categories, blocked merchants, expiry, and an "ask me first" threshold. The agent proposes purchases; a deterministic policy engine allows, escalates or denies each one; allowed purchases are paid through PayPal (sandbox). The owner can revoke the mandate in one click. Success: the owner trusts the agent with money because the ceiling is enforced by code, not by a prompt.

## Positioning
The language model proposes, plain code disposes. No model is ever asked whether a purchase is allowed, so a clever prompt or a manipulated agent cannot talk its way past a limit. Every decision lists the exact rule that fired.

## Operating Context
Owner creates a mandate (plain-English description turned into structured limits, editable), the agent runs requests such as "a desk lamp under $40", each request produces a cart and a verdict, approved carts go through PayPal Orders v2 in the sandbox, and everything lands in a ledger with PayPal order ids. Runs in the browser; state lives in the owner's browser storage; the server re-checks every limit before creating any order and re-prices carts from the catalog.

## Capabilities and Constraints
- PayPal sandbox only (Orders v2 create + capture); a labelled local simulator runs when no credentials are configured. No real money moves.
- AI is optional and pluggable (Gemini or any OpenAI-compatible endpoint, including open-weight models); an offline matcher keeps the demo working without a key.
- Demo storefront with a fixed catalog; the agent cannot invent products or prices.
- Money is integer cents; all decisions are deterministic and unit tested.
- Public repository with an MIT licence (hackathon requirement). English UI.
- Mandates live in browser storage, so this is a demo-grade trust model; a production version would sign and store mandates server-side. State this honestly.

## Evidence on Hand
Policy engine with unit tests. No customers, testimonials or metrics exist; do not invent any.

## Product Principles
1. The model never holds the keys: proposals come from AI, verdicts come from rules.
2. Every refusal explains itself with the specific rule and the numbers.
3. Authority is easy to grant narrowly and instant to take back.
4. Money screens are calm and exact: no ambiguity about what will be charged, to whom, and from which budget.
5. The demo must prove itself in three minutes without any setup.

## Accessibility & Inclusion
WCAG AA contrast minimum, full keyboard operation, never rely on colour alone for allow/ask/deny (use words and shapes), respect reduced motion.
