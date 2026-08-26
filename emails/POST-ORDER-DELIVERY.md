# Post-order delivery — email templates

Five SendGrid dynamic templates for **Post-order delivery**: the flow where the
ticket does not exist at the time of sale. The seller (a VIP supplier) generates
the PDF in the promoter's app **after** the sale and uploads it to the order
within **24 hours**; Swapper holds the payout until it lands and refunds the
buyer in full if it never does. Built as React Email components in this repo;
`npm run export` renders them to `out/*.html`, `npm run sync` pushes them to
SendGrid.

**The buyer never hears how this is built.** No "Swapper Direct", no LoveID, no
NFCTron — the buyer bought an ordinary Swapper PDF ticket that arrives a little
later, and has met none of those. Internally the flow rides the Direct rails
(`DirectOrder`, the `Fulfillment` axis, the held `Payout`) as provider
`pdfOnDemand`, but that is an implementation choice, not a product the buyer sees.

**Do not extend the `direct-*` templates to serve this flow.** They speak of
LoveID and NFCTron and carry the Direct badge. This family is separate on
purpose — separate templates, separate shared components, separate terms.

**Brand:** no product badge and no product name — this is ordinary Swapper
transactional mail, styled like `order-confirmation.tsx`: the purple company
masthead from `SwapperLayout`, `#241AA1` for buttons and links, `#F3F1FF`
callout cards, orange warning cards for hard consequences. Copy is Czech,
tykání, in the Swapper voice, and **not personalized by name** (no "Ahoj Petře").

**Every template names the promise the reader can act on** — the 24-hour window,
or the concrete deadline, or both. All dynamic values arrive **pre-formatted**
from the backend (Czech dates, amounts with currency); templates never format
raw timestamps or numbers. Keys are camelCase, referenced in SendGrid as
`{{camelCaseKey}}`. No Handlebars conditionals — this family has a single
provider and no branch.

## Shared building blocks

`emails/components/PostOrderComponents.tsx` holds the `PostOrderFooter`
(support phone + provozovatel/legal block), the palette, the shared `styles`,
`SUPPORT_PHONE`, the terms URLs, and the `v()` placeholder fall-through. All
five templates wrap in `SwapperLayout`.

`PostOrderFooter` takes:
- `audience` — `"seller"` also links the **Post-order delivery terms**
  (`/obchodni-podminky-dodani-po-nakupu`, a separate document from the Direct
  one — see SW-5; **confirm the final slug with that ticket**). `"buyer"` links
  the ordinary Swapper terms, because from the buyer's side this is an ordinary
  purchase.
- `showSupportPhone` — the support phone line.
- `taxNote` — the zjednodušený-daňový-doklad line (case 1 only).

## Templates → register in `Constants.Email.TemplateIDs`

| # | File | Proposed const | To | `dynamicTemplateData` keys |
|---|---|---|---|---|
| 1 | `post-order-buyer-purchased.tsx` | `postOrderBuyerPurchased` | B | `eventName, ticketCount, orderId, orderDate, ticketsSubtotal, serviceFee, amount, orderUrl, deliveryDeadline` |
| 2 | `post-order-buyer-ticket-ready.tsx` | `postOrderBuyerTicketReady` | B | `eventName, eventDate, ticketCount, orderId, downloadTicketsUrl` |
| 3 | `post-order-buyer-not-delivered.tsx` | `postOrderBuyerNotDelivered` | B | `eventName, orderId, amount, deliveryDeadline, eventUrl` |
| 4 | `post-order-seller-sold.tsx` | `postOrderSellerSold` | S | `eventName, ticketCount, orderId, salePrice, sellerFee, payoutAmount, uploadDeadline, uploadUrl` |
| 5 | `post-order-seller-reminder.tsx` | `postOrderSellerReminder` | S | `eventName, orderId, missingTicketCount, ticketCount, timeRemaining, uploadDeadline, uploadUrl` |

The ops escalation at T+24h reuses the existing `direct-refund-ops-request`
template — internal mail, no buyer-facing wording, so no new template. It is
**not unchanged**, though: SW-12 asks the escalation to name the order, the
seller, the buyer and the amount, so the template gained two optional keys,
`sellerName` and `sellerEmail`, rendered as their own rows. Only this flow sends
them; the LoveID and NFCTron callers pass no seller, and the rows are gated on
`{{#if}}` so they disappear for those sends. Keep them optional — do not make
either key required of the Direct callers.

### When each one fires

| # | Trigger |
|---|---|
| 1 | Order on a post-order listing completes (payment captured). Doubles as the zjednodušený daňový doklad, so it carries the full fee breakdown. |
| 2 | The last missing ticket in the order gets a file — `AWAITING_SEND → CONFIRMED`. Never on a partial upload. |
| 3 | T+24h with the order still undelivered, alongside the ops escalation. Ops then revert and refund by hand. |
| 4 | Same moment as #1, to the seller. Starts the 24-hour clock. |
| 5 | T+12h, once per order, only while at least one ticket is still missing. |

### Notes on the copy

- **`deliveryDeadline` / `uploadDeadline`** are the same instant seen from the
  two sides (order `completedAt` + 24h, clamped to the event start when that is
  sooner). Pre-formatted as **`st 3. 6. 2026 v 18:42`** — two rules, both load-bearing:
  - **Absolute, never relative.** The Direct family says `zítra do 18:42`, which
    is fine for a mail read within the hour and wrong for one read the next day.
    A post-order buyer may well open the confirmation after the deadline has
    already passed, and `včera` in the failure mail is wrong for anyone reading
    it a day late.
  - **No leading preposition**, so Czech declension never breaks the sentence
    around it. The copy therefore says "do termínu" in prose and puts the string
    itself in a labelled card row, never `do {{uploadDeadline}}`.
- **Case 1** must explain the missing attachment before the buyer hunts for it,
  and promise the refund if nothing arrives. It links the **order page**, not a
  download.
- **Case 2** links the ordinary download. Nothing about this flow is left to
  learn at this point — the mail is deliberately short. It is also the peak of
  the flow (the wait ends, the promise is kept) and, by the peak-end rule, what
  the buyer remembers of the purchase — so it closes on the event and a sign-off,
  with the order number demoted to a quiet meta line, rather than on order admin.
- **Case 3** fires automatically at T+24h, together with the ops escalation; the
  refund is executed by ops by hand afterwards. The copy therefore says the money
  is coming, never "already in your account", and states the destination and a
  window wide enough to cover the ops step: **zpět na kartu, do 3–5 pracovních
  dnů** (often faster). That line is fixed copy, not a variable — there is no
  `refundProcessingNote` here, unlike `direct-buyer-refunded`, so the backend
  cannot put "ručně" in front of a buyer. It links `eventUrl`, because the
  buyer's goal — go to the show — outlives the order.
- **Cases 4 and 5** state the **no-delivery fine** and link the post-order terms
  that grant it. There is no code for the fine — ops collect it by hand — so the
  copy stays on "vzniká smluvní pokuta" and asks a seller who cannot make it to
  call rather than go silent.
- **Case 4** tells the seller that uploads can go one at a time and that a
  rejected file can be retried until the deadline. **Case 5** carries how many
  tickets are still missing (`missingTicketCount` of `ticketCount`) and how long
  is left (`timeRemaining`).
- **The consequence gradient runs one way only.** Case 4 carries the full
  obligation — cancelled order, refunded buyer, fine — because that is where the
  seller reads it once and takes it on. Case 5 names a single consequence and
  offers a way out ("ozvi se nám"), which is the response we actually want at
  T+12h; stacking four threats on a supplier who still has half the window
  invites reactance and contradicts handling these sellers by conversation.
- **No strikes, no suspension.** Post-order sellers are contracted suppliers
  handled by conversation; the seller mails never threaten either.
- **Buyer mails never expose the seller's contact**, and seller mails never
  expose the buyer's e-mail — unlike the Direct family, nothing here is
  transferred between the two, so neither address is needed.

## Subject lines (set in SendGrid template settings)

| # | Subject |
|---|---|
| 1 | `Máš zaplaceno \| Vstupenky na {{eventName}} dorazí do 24 hodin` |
| 2 | `Vstupenky na {{eventName}} jsou připravené ke stažení` |
| 3 | `Vstupenky na {{eventName}} nedorazily — vracíme ti peníze` |
| 4 | `Prodáno \| Vystav a nahraj vstupenky na {{eventName}}` |
| 5 | `⏰ Připomínka: zbývá ti {{timeRemaining}} na nahrání vstupenek na {{eventName}}` |

## Open decisions

1. **The terms URL** (`/obchodni-podminky-dodani-po-nakupu`) is a placeholder
   until SW-5 publishes the page — align the slug before the first send.
2. **The order, upload and event URLs** arrive as `orderUrl` /
   `downloadTicketsUrl` / `uploadUrl` / `eventUrl`. The buyer order page is
   `/objednavka/{orderId}` — it carries both the status (case 1) and the
   download once the ticket lands (case 2), so both buyer keys point there.
   `/vstupenky/koupene` is the buyer's whole ticket list and is NOT per-order.
   The seller uploads at `/vstupenky/nahrane/{orderId}/nahrat`; `eventUrl` is
   `/akce/{slug}`. Confirm against SW-15, SW-16 and SW-17.
3. **`eventDate`** (case 2) is a new key the Direct family does not have —
   pre-formatted, e.g. `pá 5. 6. 2026 od 20:00`.
4. **SMS** — none. The Direct family texts the seller at T+12h; whether the
   post-order reminder deserves the same is a separate call, and the backend has
   no post-order SMS trigger yet.
