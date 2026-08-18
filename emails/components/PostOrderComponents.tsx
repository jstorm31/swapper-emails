import { Hr, Link, Section, Text } from '@react-email/components';

// Shared building blocks for the Post-order delivery email family — the flow
// where the seller makes the ticket AFTER the sale and uploads it to the order
// within 24 hours.
//
// Deliberately separate from `DirectComponents.tsx`. Post-order delivery rides
// the Direct rails internally, but the buyer bought an ordinary Swapper PDF that
// arrives a little later: no product badge, no Direct terms, and the words
// "Swapper Direct", "LoveID" and "NFCTron" appear nowhere in this family. The
// look is the ordinary transactional one (`order-confirmation.tsx`).

// Placeholders fall through to SendGrid Handlebars at send-time. In the React
// Email preview the literal {{var}} is rendered so the static layout can be QA'd.
export const v = (value: string | undefined, name: string) => (value && value.length > 0 ? value : `{{${name}}}`);

// Strip whitespace for tel: hrefs.
export const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, '')}`;

// Static support phone — the same across every template, so it is NOT a
// per-send variable. Import it instead of parametrizing it.
export const SUPPORT_PHONE = '+420 722 596 478';

// The Post-order delivery T&C (a separate document from the Direct one — see
// SW-5). It grants the no-delivery fine, so it is linked from the SELLER mail;
// the buyer sees the ordinary Swapper terms, because from their side this is an
// ordinary ticket purchase.
export const POST_ORDER_TERMS_URL = 'https://www.swapper.cz/obchodni-podminky-dodani-po-nakupu';
export const GENERAL_TERMS_URL = 'https://www.swapper.cz/obchodni-podminky';
export const PRIVACY_URL = 'https://www.swapper.cz/zpracovani-osobnich-udaju';

// ── palette (the ordinary Swapper transactional palette) ────────────────────
export const accent = '#241AA1';
export const accentDark = '#1B1480';
export const accentBg = '#F3F1FF';

// ── Shared support + legal footer ───────────────────────────────────────────
// `audience` picks the terms link: the seller accepted the Post-order delivery
// T&C by publishing the listing; the buyer accepted the ordinary ones.
// `taxNote` adds the zjednodušený-daňový-doklad line above the provozovatel
// block, in the same order as the ordinary order confirmation. `signoffLead`
// puts a line above "— Tým Swapper" (the ticket-ready mail ends on the event,
// not on admin — see the Peak-End note in POST-ORDER-DELIVERY.md).
export const PostOrderFooter = ({
    audience,
    showSupportPhone,
    taxNote,
    signoffLead,
}: {
    audience: 'buyer' | 'seller';
    showSupportPhone?: boolean;
    taxNote?: boolean;
    signoffLead?: string;
}) => (
    <>
        <Hr style={hr} />

        {showSupportPhone && (
            <Text style={help}>
                <strong>Něco nehraje?</strong> Zavolej nám na{' '}
                <Link style={anchor} href={telHref(SUPPORT_PHONE)}>
                    {SUPPORT_PHONE}
                </Link>{' '}
                nebo prostě odpověz na tento e-mail. Ozveme se.
            </Text>
        )}

        <Text style={signoff}>
            {signoffLead ? (
                <>
                    {signoffLead}
                    <br />
                </>
            ) : null}
            — Tým Swapper
        </Text>

        <Hr style={hr} />

        {taxNote && (
            <Text style={legal}>
                <em>Zjednodušený daňový doklad · Předmět plnění: zprostředkování prodeje vstupenek</em>
            </Text>
        )}

        <Text style={legal}>
            Provozovatel služby: Swapper s.r.o., Školská 660/3, Nové Město, 110 00 Praha 1 · IČO 17945925 · neplátce
            DPH · Spisová značka C 103947, Krajský soud v Ostravě.
        </Text>
        <Text style={legal}>
            {audience === 'seller' ? (
                <>
                    <Link style={legalLink} href={POST_ORDER_TERMS_URL}>
                        Podmínky dodání vstupenky po nákupu
                    </Link>
                    {' · '}
                </>
            ) : null}
            <Link style={legalLink} href={GENERAL_TERMS_URL}>
                Obchodní podmínky
            </Link>
            {' · '}
            <Link style={legalLink} href={PRIVACY_URL}>
                Zpracování osobních údajů
            </Link>
        </Text>
    </>
);

// ── shared styles (exported for reuse across the post-order templates) ──────
export const styles = {
    heading: {
        color: '#242140',
        fontSize: '26px',
        fontWeight: '700' as const,
        lineHeight: '32px',
        margin: '0 0 16px',
        textAlign: 'center' as const,
    },
    paragraph: {
        color: '#242140',
        fontSize: '16px',
        lineHeight: '26px',
        margin: '0 0 20px',
        textAlign: 'left' as const,
    },
    btnContainer: {
        textAlign: 'center' as const,
        margin: '8px 0 28px',
    },
    button: {
        backgroundColor: accent,
        borderRadius: '9999px',
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: '600' as const,
        textDecoration: 'none',
        textAlign: 'center' as const,
        display: 'inline-block',
        padding: '13px 34px',
    },
    fallback: {
        color: '#6b7280',
        fontSize: '13px',
        lineHeight: '20px',
        margin: '12px 0 0',
        textAlign: 'center' as const,
    },
    fallbackLink: {
        color: '#6b7280',
        textDecoration: 'underline',
        wordBreak: 'break-all' as const,
    },
    anchor: {
        color: accent,
        textDecoration: 'underline',
    },
    // The canonical callout — carries the deadline, the count, the order number.
    factCard: {
        backgroundColor: accentBg,
        borderRadius: '8px',
        padding: '16px 20px',
        margin: '0 0 24px',
    },
    factCardHeading: {
        color: accentDark,
        fontSize: '13px',
        fontWeight: '700' as const,
        letterSpacing: '0.4px',
        textTransform: 'uppercase' as const,
        margin: '0 0 10px',
    },
    factLabel: {
        color: '#6b7280',
        fontSize: '13px',
        lineHeight: '20px',
        margin: '0 0 2px',
    },
    factValue: {
        color: '#242140',
        fontSize: '16px',
        fontWeight: '600' as const,
        lineHeight: '22px',
        margin: '0 0 14px',
    },
    // Neutral warning card for hard consequences (missed deadline, the fine).
    warnCard: {
        backgroundColor: '#fff7ed',
        borderRadius: '8px',
        padding: '14px 18px',
        margin: '0 0 24px',
    },
    warnText: {
        color: '#9a3412',
        fontSize: '14px',
        lineHeight: '22px',
        margin: '0',
    },
    // Money / order summary block, shared with the ordinary order confirmation.
    summaryCard: {
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        padding: '20px 20px 16px',
        margin: '0 0 24px',
    },
    summaryHeading: {
        color: '#242140',
        fontSize: '20px',
        fontWeight: '700' as const,
        lineHeight: '28px',
        margin: '0 0 4px',
    },
    summaryMeta: {
        color: '#6b7280',
        fontSize: '13px',
        margin: '0 0 16px',
    },
    summaryItem: {
        color: '#242140',
        fontSize: '15px',
        lineHeight: '24px',
        margin: '0',
    },
    summaryHr: {
        borderColor: '#ececf3',
        margin: '16px 0 12px',
    },
    summaryNote: {
        color: '#6b7280',
        fontSize: '13px',
        lineHeight: '20px',
        margin: '12px 0 0',
    },
    priceRow: {
        margin: '0 0 6px',
    },
    priceLabel: {
        color: '#242140',
        fontSize: '14px',
        lineHeight: '22px',
    },
    priceValue: {
        color: '#242140',
        fontSize: '14px',
        lineHeight: '22px',
        textAlign: 'right' as const,
    },
    priceLabelTotal: {
        color: '#242140',
        fontSize: '15px',
        fontWeight: '700' as const,
        lineHeight: '22px',
    },
    priceValueTotal: {
        color: '#242140',
        fontSize: '15px',
        fontWeight: '700' as const,
        lineHeight: '22px',
        textAlign: 'right' as const,
    },
    stepsHeading: {
        color: '#242140',
        fontSize: '18px',
        fontWeight: '700' as const,
        lineHeight: '24px',
        margin: '0 0 12px',
    },
    stepText: {
        color: '#242140',
        fontSize: '16px',
        lineHeight: '24px',
        margin: '0 0 12px',
        textAlign: 'left' as const,
    },
    stepNum: {
        color: accent,
    },
    softHr: {
        borderColor: '#e6ebf1',
        margin: '8px 0 24px',
    },
    legal: {
        color: '#8898aa',
        fontSize: '12px',
        lineHeight: '18px',
        margin: '0 0 6px',
    },
    // Small print the reader may actually need (an order number quoted to
    // support), as opposed to legal boilerplate — darker, so it clears AA.
    meta: {
        color: '#6b7280',
        fontSize: '12px',
        lineHeight: '18px',
        margin: '0',
    },
};

// ── footer-local styles ─────────────────────────────────────────────────────
const hr = {
    borderColor: '#e6ebf1',
    margin: '24px 0',
};

const help = {
    color: '#242140',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 16px',
    textAlign: 'left' as const,
};

const signoff = {
    color: '#242140',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0',
};

const legal = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0 0 6px',
};

const legalLink = {
    color: '#8898aa',
    textDecoration: 'underline',
};

const anchor = {
    color: accent,
    textDecoration: 'underline',
};
