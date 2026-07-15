# Swapper Direct — email & SMS templates

Eight SendGrid dynamic templates for the Swapper Direct flow, plus the SMS copy
for the two cases that also send a text. Built as React Email components in this
repo; `npm run export` renders them to `out/*.html` and fixes Handlebars escaping.

**Brand:** product name in copy is **"Swapper Direct"**; the in-content accent is
the Direct product color **`#241AA1`** (deep indigo) — used for the wordmark badge,
the primary button, the facts card, and links. **Never the shield** (that belongs
to Swapper Garance). Customer copy is Czech, tykání, in the Swapper voice, and is
**not personalized by name** (no "Ahoj Petře"). The ops email (case 8) is internal:
neutral tone, no marketing chrome.

**Mechanism wording — provider-aware.** Swapper Direct now runs on two providers,
branched at send-time on a **`provider`** variable (`"loveId" | "nfcTron"`, the
`DirectProvider` rawValue passed from the backend):

- **LoveID** (Beats for Love) — the seller **transfers the tickets to the buyer's
  e-mail „přes aplikaci LoveID"**; a missed seller deadline **auto-cancels + refunds**.
- **NFCTron** (Let It Roll 2026 pilot) — the seller generates a **ticket link** in
  NFCTron (the underlying feature is NFCTron's gift link) and pastes the claim URL
  into Swapper; the buyer **transfers the ticket into their own NFCTron account via
  the link** (a click releases payout + redirects to the claim screen) and does the
  **150 Kč name change** themselves. Customer copy avoids the „dárková vstupenka"
  wording — it's just "vstupenka" + "odkaz". A missed deadline
  **escalates to ops** — nothing auto-happens. Buyer emails disclose: NFCTron account
  required, 150 Kč name change, CZK-only, plus the independence disclaimer *„Swapper
  je nezávislá platforma a není spojený s pořadatelem."*

The branch is a **SendGrid Handlebars `{{#equals provider "nfcTron"}} …NFCTron…
{{else}} …LoveID… {{/equals}}`** inline in the template (same pattern as
`order-confirmation.tsx`'s `guaranteeActive`). **LoveID is the `{{else}}` default**,
so a legacy send that omits `provider` still renders the LoveID copy — backward
compatible. Only the *action + copy* branch; states, layout, and the money
breakdown are provider-agnostic. `eventName` carries the event name. Every customer
email that touches the transfer links the event-specific how-to guide at
**`/swapper-direct/{loveid|nfctron}`** (provider-specific, not per-event), which
also covers "no provider account yet".

All dynamic values arrive **pre-formatted** from the backend (Czech dates, amounts
with currency). Templates never format raw timestamps or numbers. Keys are
camelCase and referenced in SendGrid as `{{camelCaseKey}}`.

## Shared building blocks

`emails/components/DirectComponents.tsx` holds the `DirectBadge` (text-only
wordmark pill, no icon), the `DirectFooter` (support phone + provozovatel/legal
block), the `#241AA1` palette, the shared `styles`, `directGuideUrl(providerSlug)`, and
the `v()` placeholder fall-through. The six customer templates wrap in
`SwapperLayout` (purple masthead = company brand); the ops template uses its own
stripped internal layout.

The `DirectFooter` legal line links the **unified Swapper Direct terms**
(`/obchodni-podminky-swapper-direct`) — one distilled document covering **all
providers** (LoveID + NFCTron), so the link is provider-agnostic and needs no
branch. (The general `/obchodni-podminky` stays on the non-Direct
`order-confirmation.tsx` footer.)

## Templates → register in `Constants.Email.TemplateIDs`

Each row needs a new SendGrid template (paste the exported HTML) and a new
`static let … = "d-…"` constant. Add the constant; do not paste IDs into docs.

| # | File | Proposed const | To | `dynamicTemplateData` keys |
|---|---|---|---|---|
| 1 | `direct-seller-sold.tsx` | `directSellerSold` | S | **`provider`**, `eventName, ticketCount, buyerEmail, salePrice, sellerFee, payoutAmount, orderId, sendDeadline, actionUrl` |
| 2 | `direct-seller-send-reminder.tsx` | `directSellerSendReminder` | S | `eventName, buyerEmail, orderId, sendDeadline, actionUrl` |
| 3 | `direct-seller-auto-cancelled.tsx` | `directSellerAutoCancelled` | S | `eventName, orderId` |
| 4 | `direct-seller-confirm-escalation.tsx` | `directSellerConfirmEscalation` | S | `eventName, orderId, confirmDeadline, sawAcceptanceUrl` |
| 5 | `direct-buyer-purchased.tsx` | `directBuyerPurchased` | B | **`provider`**, `eventName, ticketCount, orderId, orderDate, ticketsSubtotal, serviceFee, amount, trackingUrl, sellerSendDeadline` |
| 6 | `direct-buyer-ticket-sent.tsx` | `directBuyerTicketSent` | B | **`provider`**, `eventName, orderId, confirmUrl` |
| 7 | `direct-buyer-refunded.tsx` | `directBuyerRefunded` | B | `eventName, orderId, amount, reasonText, refundProcessingNote` |
| 8 | `direct-refund-ops-request.tsx` | `directRefundOpsRequest` | O | `orderId, amount, buyerEmail, paymentExternalId, gateway, reasonCode, eventName` |
| 9 | `direct-seller-transaction-complete.tsx` | `directSellerTransactionComplete` | S | `sellerName, eventName, orderId, payoutAmount, currency, payoutTimingNote` |

**`provider`** (`"loveId" | "nfcTron"`) drives the NFCTron vs LoveID branch on
cases **1, 5, 6**. Cases 2, 3, 4 are LoveID-only paths (NFCTron has no
seller-reminder / auto-cancel / confirm-escalation) and take no `provider`. Case 8
discriminates on `reasonCode` instead (see below). Cases 7 and 9 are
provider-neutral. Omitting `provider` renders the LoveID copy.

### Changes from the original handoff key list
- **No `sellerName` / `buyerName`** — emails are not greeted by name.
- **No `supportPhone` variable** — the support phone is a static `SUPPORT_PHONE`
  constant in `DirectComponents.tsx` (`+420 722 596 478`), imported where needed.
  `DirectFooter` takes a `showSupportPhone` boolean to toggle the phone line.
- **`eventId` removed** from cases 1, 2, 4, 5, 6 — the how-to guide is now
  **provider-specific** (`/swapper-direct/loveid` or `/swapper-direct/nfctron`), so
  the guide link no longer needs an event id. `directGuideUrl` takes the lowercase
  provider slug; each `{{#equals}}` branch passes its own literal (`'nfctron'` /
  `'loveid'`). Old note (kept for history): eventId once built the `/swapper-direct/{eventId}`
  guide link.
- **Case 3** dropped `strikeCount` / `isSuspended` — strikes/suspension are **not**
  surfaced to sellers in v1. The email is a clean "order cancelled + buyer refunded"
  notice.
- **Case 5** added `orderDate`, `ticketsSubtotal`, `serviceFee` — the email doubles
  as the **zjednodušený daňový doklad**, so it shows the full fee breakdown
  (Vstupenky + Poplatek Swapper → Celkem) plus the tax footer line and the
  provozovatel block from `DirectFooter`.

### Notes / conditionals
- **Case 1 & 2** show the full `buyerEmail` — it is the LoveID transfer target.
  Buyer-facing emails (5/6/7) never expose the seller's contact.
- **Case 1** also carries the seller money breakdown: `salePrice` − `sellerFee`
  (Swapper's seller commission, deducted) → `payoutAmount` (net). All three are
  pre-formatted with currency. This is the seller-side counterpart to buyer-side
  fees: the buyer pays a `serviceFee` on top (case 5), the seller has `sellerFee`
  deducted. Copy frames the payout as released only once the buyer confirms
  receipt (the case 9 trigger) — `payoutAmount` here should match case 9's.
- **Case 7** must say the refund is *being processed* (ops-manual, GP webpay).
  `reasonText` = buyer-friendly sentence; `refundProcessingNote` = the realistic
  window caveat. Never "already in your account".
- **Case 8** is the shared ops email with **two modes, discriminated by `reasonCode`**:
  - **Refund** — `NO_SEND_24H | NO_CONFIRM_14D | DISPUTE_REVERSAL` → "refund now in
    the gateway portal" (LoveID auto-cancel / dispute).
  - **Escalation** — `ESCALATION_NO_SEND | ESCALATION_NO_CONFIRM` → "review this,
    **do NOT refund yet**" (NFCTron timeouts, which never auto-refund; ops
    investigate and decide). The backend must emit these codes at the two NFCTron
    escalation call sites (see the backend handoff #3).

  The intro + steps branch escalation-vs-refund; the reason box maps all five codes
  to a human label via nested `{{#equals}}` and echoes the raw code. Any unknown
  code falls through to the **refund** flow (the `{{else}}` default).
- **Case 9 — already wired, unlike 1–8.** The trigger (buyer confirms receipt,
  SENT → CONFIRMED) already fires and currently sends a plain-text placeholder. To
  switch it to this template, the backend method must move from a plain body to
  `Personalization(dynamicTemplateData:)` + `templateId` (register a new ID in
  `Constants.Email.TemplateIDs`). `payoutAmount`/`currency` are already passed in;
  `eventName`/`sellerName` need sourcing in the method. Cardinality: **one email per
  distinct seller** in the order, with that seller's **summed** payout.
  - `payoutAmount` + `currency` are **separate** values here (not a pre-formatted
    string like other amounts) — the template joins them as `{payoutAmount} {currency}`.
  - `payoutTimingNote` is an **estimate, never a date**: payout fires after the
    per-event `reconciliationBufferHours` (default 24h) + the next working-day FIO
    run. Phrase as an estimate, e.g. "do 3 pracovních dnů". `sellerName` is in the
    payload but not rendered (no name greeting).
  - **No support phone** on this email — it uses `DirectFooter` without a phone
    (sign-off + legal block only).

## Proposed subject lines (set in SendGrid template settings)

Subjects may reference Handlebars vars; `eventName` is used here, not in the body.

| # | Subject |
|---|---|
| 1 | `Prodáno! Převeď vstupenky na {{eventName}} kupujícímu` |
| 2 | `⏰ Připomínka: převeď vstupenky na {{eventName}}` |
| 3 | `Objednávku {{orderId}} jsme zrušili` |
| 4 | `Potvrdil ti kupující přijetí vstupenek na {{eventName}}?` |
| 5 | `Máš zaplaceno — vstupenky na {{eventName}} ti převede prodejce` |
| 6 | `Vstupenky na {{eventName}} jsou na cestě — potvrď přijetí` |
| 7 | `Vracíme ti peníze za objednávku {{orderId}}` |
| 8 | `[OPS] Zásah u objednávky {{orderId}} — {{amount}}` (neutral: covers both refund and escalation) |
| 9 | `Hotovo! Posíláme ti výplatu za {{eventName}}` |

## SMS copy (separate channel)

SMS does **not** go through SendGrid — it needs the pending `sendSms(to, body)`
backend task. Keep bodies short, with a link and the deadline. Values are the same
pre-formatted strings as the matching email.

**Case 2 — send reminder (T+12h):**
```
Swapper Direct: vstupenky na {{eventName}} jeste nedorazily kupujicimu. Preved je v LoveID na {{buyerEmail}} do {{sendDeadline}}: {{actionUrl}}
```

**Case 6 — ticket sent, confirm receipt (optional SMS):**
```
Swapper Direct: prodejce ti prevedl vstupenky na {{eventName}} pres LoveID. Az je budes mit, potvrd prijeti: {{confirmUrl}}
```

> The SMS bodies above are written **without diacritics** on purpose: Czech accents
> force UCS-2 encoding (~70 chars/segment) instead of GSM-7 (160), so dropping them
> keeps each text to a single segment once the variables resolve. If the brand
> prefers diacritics, expect 2 segments — sanity-check after the backend fills real
> values.

## Open decisions (confirm with backend owner)
1. New Direct templates vs extending `listingSold` / `orderConfirmation`
   — built as **new** templates (action/tone differ enough). ✅ recommendation followed.
2. ~~Attach the versioned **Terms** PDF to case 1 and/or case 5?~~ **Resolved:** the
   Swapper Direct terms are **distilled into one page for all providers** at
   `/obchodni-podminky-swapper-direct` and **linked from every Direct email's
   `DirectFooter`** — no per-email PDF attachment.
3. Exact Czech date/amount format strings the backend pre-formats (e.g.
   `sendDeadline` as `zítra do 18:42` vs `2. 6. 2026 18:42`) — agree the strings.
4. Optional "payout released / all done" seller email — not built (low priority;
   can reuse the existing completed-transaction flow).
