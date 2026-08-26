import { Button, Column, Hr, Link, Row, Section, Text } from '@react-email/components';
import { DirectBadge, DirectFooter, directGuideUrl, styles, v } from './components/DirectComponents';
import { SwapperLayout } from './components/SwapperLayout';

// Case 1 — Direct sale, transfer now. Order paid on a Direct event → seller
// enters AWAITING_SEND and has 24 h to deliver the tickets to the buyer.
// `eventName` is consumed by the SendGrid subject line. The provider-specific guide
// (covers "no provider account yet") lives at /swapper-direct/{loveid|nfctron}.
//
// Provider-aware (`provider` = "loveId" | "nfcTron", DirectProvider rawValue):
//  · LoveID  — transfer to the buyer's e-mail (`buyerEmail`) via the LoveID app.
//  · NFCTron — generate a ticket link in NFCTron and paste the claim URL into
//    Swapper. `buyerEmail` is empty for NFCTron (no transfer
//    target), so that row is hidden. A missed deadline escalates to ops instead of
//    auto-cancelling. Branch is `{{#equals provider "nfcTron"}} … {{else}} …LoveID
//    … {{/equals}}`; LoveID is the `{{else}}` default (legacy sends omit provider).
//
// Also carries the seller's money breakdown: `salePrice` (what the tickets sold
// for) − `sellerFee` (Swapper's seller commission, deducted) → `payoutAmount`
// (net payout). All three arrive pre-formatted with currency. The payout is
// released only after the buyer confirms receipt (see case 9), so the copy frames
// it as "po potvrzení přijetí" — not an immediate transfer.
interface DirectSellerSoldEmailProps {
    provider?: string;
    eventName?: string;
    ticketCount?: string;
    buyerEmail?: string;
    salePrice?: string;
    sellerFee?: string;
    payoutAmount?: string;
    sendDeadline?: string;
    actionUrl?: string;
}

export const DirectSellerSoldEmail = (props: DirectSellerSoldEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const ticketCount = v(props.ticketCount, 'ticketCount');
    const buyerEmail = v(props.buyerEmail, 'buyerEmail');
    const salePrice = v(props.salePrice, 'salePrice');
    const sellerFee = v(props.sellerFee, 'sellerFee');
    const payoutAmount = v(props.payoutAmount, 'payoutAmount');
    const sendDeadline = v(props.sendDeadline, 'sendDeadline');
    const actionUrl = v(props.actionUrl, 'actionUrl');

    return (
        <SwapperLayout previewText={`Prodáno! Doruč vstupenky kupujícímu do ${sendDeadline}.`}>
            <DirectBadge />

            <Text style={styles.heading}>Prodáno 🎉 Teď doruč vstupenky</Text>

            {`{{#equals provider "nfcTron"}}`}
            <Text style={styles.paragraph}>
                Vstupenky na <strong>{eventName}</strong> se prodaly. Teď v NFCTron vytvoř odkaz na vstupenku a vlož ho
                do Swapperu — kupující si podle něj vstupenky převede do svého účtu.
            </Text>

            {/* Primary action — the critical step. Sits directly under the title +
                description; the fact card below is supporting detail. */}
            <Section style={styles.btnContainer}>
                <Button style={primaryButton} href={actionUrl}>
                    Vložit odkaz na vstupenku
                </Button>
                <Text style={styles.fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={styles.fallbackLink} href={actionUrl}>
                        {actionUrl}
                    </Link>
                </Text>
            </Section>

            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Co teď udělat</Text>

                <Text style={styles.factLabel}>1. V NFCTron vygeneruj</Text>
                <Text style={styles.factValue}>odkaz na vstupenku ({ticketCount})</Text>

                <Text style={styles.factLabel}>2. Odkaz vlož do Swapperu</Text>
                <Text style={styles.factValue}>přes tlačítko výše</Text>

                <Text style={styles.factLabel}>Stihni to do</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>{sendDeadline}</Text>
            </Section>

            <Text style={styles.paragraph}>
                Nevíš, jak v NFCTron vytvořit odkaz na vstupenku a poslat ho? Krok za krokem tě provede{' '}
                <Link style={styles.anchor} href="https://www.swapper.cz/swapper-direct-nfctron-how-to-transfer-ticket">
                    návod pro tuhle akci
                </Link>
                .
            </Text>
            {`{{else}}`}
            <Text style={styles.paragraph}>
                Vstupenky na <strong>{eventName}</strong> se prodaly. Teď je převeď kupujícímu přes aplikaci LoveID.
            </Text>

            {/* Primary action — sits directly under the title + description; the
                fact card below is supporting detail. */}
            <Section style={styles.btnContainer}>
                <Button style={primaryButton} href={actionUrl}>
                    Označit jako odeslané
                </Button>
                <Text style={styles.fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={styles.fallbackLink} href={actionUrl}>
                        {actionUrl}
                    </Link>
                </Text>
            </Section>

            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Co teď udělat</Text>

                <Text style={styles.factLabel}>Převeď vstupenky na e-mail kupujícího</Text>
                <Text style={styles.factValue}>{buyerEmail}</Text>

                <Text style={styles.factLabel}>Stihni to do</Text>
                <Text style={styles.factValue}>{sendDeadline}</Text>

                <Text style={styles.factLabel}>Počet vstupenek</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>{ticketCount}</Text>
            </Section>

            <Text style={styles.paragraph}>
                Nevíš, jak vstupenky přes LoveID převést? Krok za krokem tě provede{' '}
                <Link style={styles.anchor} href={directGuideUrl('loveid')}>
                    návod pro tuhle akci
                </Link>
                .
            </Text>
            {`{{/equals}}`}

            {/* Secondary — payout reassurance, intentionally muted vs. the action. */}
            <Section style={summaryCard}>
                <Text style={summaryHeading}>Tvoje výplata</Text>

                <Row style={priceRow}>
                    <Column style={priceLabel}>Prodejní cena</Column>
                    <Column style={priceValue}>{salePrice}</Column>
                </Row>
                <Row style={priceRow}>
                    <Column style={priceLabel}>Poplatek Swapper</Column>
                    <Column style={priceValue}>−{sellerFee}</Column>
                </Row>

                <Hr style={summaryHr} />

                <Row style={priceRow}>
                    <Column style={priceLabelTotal}>Dostaneš</Column>
                    <Column style={priceValueTotal}>{payoutAmount}</Column>
                </Row>

                <Text style={summaryNote}>Výplatu pošleme, jakmile kupující potvrdí přijetí vstupenek.</Text>
            </Section>

            {/* Deadline consequences differ by provider: LoveID auto-cancels via
                cron; NFCTron has no auto-cancel — a miss escalates to ops, so the
                copy asks the seller to reach out rather than threatening a refund. */}
            {`{{#equals provider "nfcTron"}}`}
            <Section style={styles.warnCard}>
                <Text style={styles.warnText}>
                    Vstupenky doruč do {sendDeadline}. Když to nestíháš, radši nám dej vědět — jinak se ti ozveme sami a
                    objednávku vyřešíme společně.
                </Text>
            </Section>

            <Text style={disclaimer}>Swapper je nezávislá platforma a není spojený s pořadatelem.</Text>
            {`{{else}}`}
            <Section style={styles.warnCard}>
                <Text style={styles.warnText}>
                    Když vstupenky nepřevedeš do {sendDeadline} objednávku automaticky zrušíme a kupujícímu vrátíme
                    peníze.
                </Text>
            </Section>
            {`{{/equals}}`}

            <DirectFooter showSupportPhone />
        </SwapperLayout>
    );
};

DirectSellerSoldEmail.PreviewProps = {
    provider: 'nfcTron',
    eventName: 'Lucie ve Foru',
    ticketCount: '2',
    buyerEmail: 'kupujici@email.cz',
    salePrice: '1 616 Kč',
    sellerFee: '81 Kč',
    payoutAmount: '1 535 Kč',
    orderId: '12345',
    sendDeadline: 'zítra do 18:42',
    actionUrl: 'https://www.swapper.cz/vstupenky/nabizene/12345',
} satisfies DirectSellerSoldEmailProps;

export default DirectSellerSoldEmail;

// Enlarged primary CTA — this email has one job (transfer now), so the button is
// bigger and bolder than the shared default to anchor the eye.
const primaryButton = {
    ...styles.button,
    fontSize: '17px',
    padding: '16px 46px',
};

// Independence disclaimer — required on NFCTron customer emails (ADR/spec §A3).
const disclaimer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0 0 6px',
    textAlign: 'left' as const,
};

// ── local styles (mirror direct-buyer-purchased's summary block) ────────────
const summaryCard = {
    backgroundColor: '#fafafa',
    border: '1px solid #ececf3',
    borderRadius: '8px',
    padding: '20px 20px 16px',
    margin: '0 0 24px',
};

const summaryHeading = {
    color: '#242140',
    fontSize: '20px',
    fontWeight: '700' as const,
    lineHeight: '28px',
    margin: '0 0 16px',
};

const summaryHr = {
    borderColor: '#ececf3',
    margin: '16px 0 12px',
};

const priceRow = {
    margin: '0 0 6px',
};

const priceLabel = {
    color: '#242140',
    fontSize: '14px',
    lineHeight: '22px',
};

const priceValue = {
    color: '#242140',
    fontSize: '14px',
    lineHeight: '22px',
    textAlign: 'right' as const,
};

const priceLabelTotal = {
    ...priceLabel,
    fontWeight: '700' as const,
    fontSize: '15px',
};

const priceValueTotal = {
    ...priceValue,
    fontWeight: '700' as const,
    fontSize: '15px',
};

const summaryNote = {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '12px 0 0',
};
