# Design system: the security envelope

Mandate gives an AI agent a spending mandate. The visual world is the one thing everybody has already seen on a bank statement: the **security envelope**. A lattice is printed inside so nobody can read through it, a glassine window shows only what must be seen, and clerks stamp verdicts with rubber stamps.

## Principles
- A mandate is an envelope: sealed, with a window showing what is left to spend. Revoked or expired mandates are stamped across the front.
- The verdict is a stamp. Words and frame shape carry meaning, never colour alone: solid double rule for **Cleared**, dashed for **Hold**, round double ring for **Refused**.
- Everything else is plain, aligned and calm. Skeuomorphism is spent only on the envelope window and the stamps.
- Money is exact: tabular mono figures, integer cents underneath, no rounding surprises.

## Colour (OKLCH, one light theme)
| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `oklch(0.982 0.004 255)` | Page ground, cool white (never cream) |
| `--paper-2` | `oklch(0.955 0.009 255)` | Hover, perforation holes |
| `--lining` | `oklch(0.925 0.03 258)` | Envelope lining tint behind the lattice |
| `--ink` | `oklch(0.26 0.075 265)` | Text, primary buttons, rules |
| `--ink-soft` | `oklch(0.44 0.055 265)` | Secondary text |
| `--rule` | `oklch(0.83 0.02 260)` | Hairlines |
| `--clear` | `oklch(0.40 0.13 255)` | Cleared stamp (blue ink) |
| `--hold` | `oklch(0.47 0.11 68)` | Hold stamp (amber ink) |
| `--refuse` | `oklch(0.50 0.19 30)` | Refused and revoke (postal vermilion) |

Strategy: restrained. Tinted neutrals plus one stamp colour per state. All text meets 4.5:1.

## Type
- **Schibsted Grotesk** for interface and headlines. Headlines tight (`-0.025em`), balanced wrapping.
- **Azeret Mono** for money, rule codes and stamps (`.num` enables tabular, slashed-zero figures). Mono is used only for data and measurements.
- Floors: functional text never below 11px.

## Components
- **Envelope** (`.envelope`): 1.5:1, lattice flap (`.tint`), glassine window (`.window`) with the remaining budget and a meter, agent and days-left labels, optional stamp slot.
- **Stamp** (`.stamp`): mono caps, 3px frame plus outline, `mix-blend-mode: multiply`, tilted. Lands with a single 220 ms thump.
- **Slip** (`.slip`): sheet with a perforated top edge, used for verdict cards, forms and ledger rows.
- **Field** (`.field`): clerk's-form underline input, focus lifts the rule to the ink-blue.
- **Button** (`.btn`, `-primary`, `-danger`, `-quiet`), **chip** (`.chip`, `aria-pressed` or `aria-checked`), **meter** (`.meter`).
- Radix Select for the period picker, no native popups.

## Motion
One authored moment: the stamp thump, followed by the rule lines franking in one by one (90 ms stagger). Pages rise 8 px on entry. Everything respects `prefers-reduced-motion`.

## Layout
Max width 72rem, 16px gutters on phones, asymmetric two-column desk (envelope left, conversation right). No identical card grids: lists are envelopes, slips or ruled definition lists.

## Do not
Cream or beige grounds, serif display faces, gradient text, glass blur, coloured side borders, hard offset shadows, emoji as icons.
