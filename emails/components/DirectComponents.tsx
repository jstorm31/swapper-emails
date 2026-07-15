import { Hr, Link, Section, Text } from '@react-email/components';

// Shared building blocks for the Swapper Direct email family.
//
// Brand note: the Direct visual mark is the wordmark in deep indigo (#241AA1),
// the Swapper Direct product color. NEVER the shield — that is reserved for the
// separate Swapper Garance product. The purple masthead in `SwapperLayout` is the
// company brand and stays; #241AA1 is the in-content Direct accent.

// Placeholders fall through to SendGrid Handlebars at send-time. In the React
// Email preview the literal {{var}} is rendered so the static layout can be QA'd.
export const v = (value: string | undefined, name: string) => (value && value.length > 0 ? value : `{{${name}}}`);

// Strip whitespace for tel: hrefs.
export const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, '')}`;

// Static support phone — the same across every Direct template, so it is NOT a
// per-send variable. Import it instead of parametrizing it.
export const SUPPORT_PHONE = '+420 722 596 478';

// Provider-specific Swapper Direct how-to guide (covers transferring/receiving via
// the provider account, including when you don't yet have one). The slug is the
// lowercase provider: "loveid" | "nfctron".
export const directGuideUrl = (providerSlug: 'loveid' | 'nfctron') =>
    `https://www.swapper.cz/swapper-direct/${providerSlug}`;

// ── Direct palette ──────────────────────────────────────────────────────────
export const directPrimary = '#241AA1';
export const directPrimaryDark = '#1B1480';
export const directBg = '#F3F1FF';
export const directBorder = '#D9D4FF';

// ── Direct wordmark badge (no icon) ─────────────────────────────────────────
export const DirectBadge = () => (
    <Section style={badgeContainer}>
        {/* span (not Text/<p>) so the pill hugs its content and can be centered */}
        <span style={badgePill}>Swapper Direct</span>
    </Section>
);

// ── Shared support + legal footer ───────────────────────────────────────────
// Direct comms during a dispute are handled by phone in v1 (no in-app messaging),
// so the support phone is always one tap away.
// `showSupportPhone` toggles the phone support line; omit it (e.g. the
// transaction-complete email) to render just the sign-off + legal block.
export const DirectFooter = ({ showSupportPhone }: { showSupportPhone?: boolean }) => {
    const phone = showSupportPhone ? SUPPORT_PHONE : null;
    return (
        <>
            <Hr style={hr} />

            {phone && (
                <Text style={help}>
                    <strong>Něco nehraje?</strong> Zavolej nám na{' '}
                    <Link style={anchor} href={telHref(phone)}>
                        {phone}
                    </Link>{' '}
                    nebo prostě odpověz na tento e-mail. Ozveme se.
                </Text>
            )}

            <Text style={signoff}>— Tým Swapper</Text>

            <Hr style={hr} />

            <Text style={legal}>
                Provozovatel služby: Swapper s.r.o., Školská 660/3, Nové Město, 110 00 Praha 1 · IČO 17945925 · neplátce
                DPH · Spisová značka C 103947, Krajský soud v Ostravě.
            </Text>
            <Text style={legal}>
                <Link style={legalLink} href="https://www.swapper.cz/obchodni-podminky-swapper-direct">
                    Obchodní podmínky Swapper Direct
                </Link>
                {' · '}
                <Link style={legalLink} href="https://www.swapper.cz/zpracovani-osobnich-udaju">
                    Zpracování osobních údajů
                </Link>
            </Text>
        </>
    );
};

// ── shared styles (exported for reuse across the Direct templates) ──────────
export const styles = {
    heading: {
        color: '#242140',
        fontSize: '26px',
        fontWeight: '700',
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
        backgroundColor: directPrimary,
        borderRadius: '9999px',
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: '600',
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
        color: directPrimary,
        textDecoration: 'underline',
    },
    // Teal "facts" card — the canonical Direct callout (deadline / recipient / steps).
    factCard: {
        backgroundColor: directBg,
        border: `1px solid ${directBorder}`,
        borderRadius: '8px',
        padding: '16px 20px',
        margin: '0 0 24px',
    },
    factCardHeading: {
        color: directPrimaryDark,
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
        wordBreak: 'break-all' as const,
    },
    // Neutral warning card for hard consequences (auto-cancel / strike / deadline).
    warnCard: {
        backgroundColor: '#fff7ed',
        border: '1px solid #fed7aa',
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
};

// ── footer-local styles ─────────────────────────────────────────────────────
const badgeContainer = {
    textAlign: 'center' as const,
    margin: '0 0 14px',
};

const badgePill = {
    display: 'inline-block',
    backgroundColor: directBg,
    color: directPrimaryDark,
    border: `1px solid ${directBorder}`,
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '700' as const,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    padding: '5px 14px',
};

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
    color: directPrimary,
    textDecoration: 'underline',
};
