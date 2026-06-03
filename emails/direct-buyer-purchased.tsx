import { Button, Column, Hr, Link, Row, Section, Text } from '@react-email/components';
import { DirectBadge, DirectFooter, directGuideUrl, styles, v } from './components/DirectComponents';
import { SwapperLayout } from './components/SwapperLayout';

// Case 5 — Purchase confirmation (Direct). Buyer paid; this email reassures and
// explains the Direct flow: the seller transfers the tickets to the buyer via the
// LoveID app within 24 h. The seller's contact is intentionally NOT shown.
// Doubles as the zjednodušený daňový doklad, so the summary carries the full fee
// breakdown (tickets subtotal + Swapper fee + total) and the tax footer.
interface DirectBuyerPurchasedEmailProps {
    eventName?: string;
    eventId?: string;
    ticketCount?: string;
    orderId?: string;
    orderDate?: string;
    ticketsSubtotal?: string;
    serviceFee?: string;
    amount?: string;
    trackingUrl?: string;
    sellerSendDeadline?: string;
}

export const DirectBuyerPurchasedEmail = (props: DirectBuyerPurchasedEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const eventId = v(props.eventId, 'eventId');
    const ticketCount = v(props.ticketCount, 'ticketCount');
    const orderId = v(props.orderId, 'orderId');
    const orderDate = v(props.orderDate, 'orderDate');
    const ticketsSubtotal = v(props.ticketsSubtotal, 'ticketsSubtotal');
    const serviceFee = v(props.serviceFee, 'serviceFee');
    const amount = v(props.amount, 'amount');
    const trackingUrl = v(props.trackingUrl, 'trackingUrl');
    const sellerSendDeadline = v(props.sellerSendDeadline, 'sellerSendDeadline');

    return (
        <SwapperLayout previewText="Máš zaplaceno. Vstupenky ti převede prodejce — tady je, jak to funguje.">
            <DirectBadge />

            <Text style={styles.heading}>Máš zaplaceno ✓</Text>

            <Text style={styles.paragraph}>
                Děkujeme za nákup vstupenek na <strong>{eventName}</strong>. Koupil jsi přes Swapper Direct — vstupenky
                ti převede prodejce přímo na tvůj e-mail přes aplikaci LoveID.
            </Text>

            {/* Order summary block — doubles as zjednodušený daňový doklad body. */}
            <Section style={summaryCard}>
                <Text style={summaryHeading}>Shrnutí objednávky</Text>
                <Text style={summaryMeta}>
                    Objednávka č. {orderId} · {orderDate}
                </Text>

                <Text style={summaryItem}>
                    <strong>{eventName}</strong>
                    <br />
                    {ticketCount}× vstupenka
                </Text>

                <Hr style={summaryHr} />

                <Row style={priceRow}>
                    <Column style={priceLabel}>Vstupenky</Column>
                    <Column style={priceValue}>{ticketsSubtotal}</Column>
                </Row>
                <Row style={priceRow}>
                    <Column style={priceLabel}>Poplatek Swapper</Column>
                    <Column style={priceValue}>{serviceFee}</Column>
                </Row>

                <Hr style={summaryHr} />

                <Row style={priceRow}>
                    <Column style={priceLabelTotal}>Celkem</Column>
                    <Column style={priceValueTotal}>{amount}</Column>
                </Row>
            </Section>

            <Text style={stepsHeading}>Jak to bude probíhat</Text>
            <Text style={stepText}>
                <strong style={stepNum}>1.</strong> Prodejce ti vstupenky převede přes aplikaci LoveID — nejpozději do{' '}
                <strong>{sellerSendDeadline}</strong>.
            </Text>
            <Text style={stepText}>
                <strong style={stepNum}>2.</strong> Dorazí na e-mail, na který ses zaregistroval. Přijmeš je v aplikaci
                LoveID.
            </Text>
            <Text style={stepText}>
                <strong style={stepNum}>3.</strong> Až je budeš mít, potvrdíš jejich přijetí — pošleme ti k tomu
                samostatný e-mail s jedním tlačítkem.
            </Text>

            <Section style={styles.btnContainer}>
                <Button style={styles.button} href={trackingUrl}>
                    Sledovat objednávku
                </Button>
                <Text style={styles.fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={styles.fallbackLink} href={trackingUrl}>
                        {trackingUrl}
                    </Link>
                </Text>
            </Section>

            <Text style={styles.paragraph}>
                Nemáš LoveID? Nevadí — jak si appku stáhnout a vstupenky převzít, najdeš v{' '}
                <Link style={styles.anchor} href={directGuideUrl(eventId)}>
                    návodu pro tuhle akci
                </Link>
                .
            </Text>

            <Hr style={softHr} />

            <Text style={styles.paragraph}>
                <strong>A kdyby něco?</strong> Pokud ti prodejce vstupenky do {sellerSendDeadline} nepřevede,
                automaticky ti vrátíme peníze. Nemusíš nic řešit ani hlídat — postaráme se o to za tebe.
            </Text>

            <DirectFooter showSupportPhone />
        </SwapperLayout>
    );
};

DirectBuyerPurchasedEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    eventId: '987',
    ticketCount: '2',
    orderId: '12345',
    orderDate: '1. 6. 2026',
    ticketsSubtotal: '1 616 Kč',
    serviceFee: '96 Kč',
    amount: '1 712 Kč',
    trackingUrl: 'https://www.swapper.cz/vstupenky/koupene/12345',
    sellerSendDeadline: 'zítra do 18:42',
} satisfies DirectBuyerPurchasedEmailProps;

export default DirectBuyerPurchasedEmail;

// ── local styles ────────────────────────────────────────────────────────────
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
    margin: '0 0 4px',
};

const summaryMeta = {
    color: '#6b7280',
    fontSize: '13px',
    margin: '0 0 16px',
};

const summaryItem = {
    color: '#242140',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0',
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

const stepsHeading = {
    color: '#242140',
    fontSize: '18px',
    fontWeight: '700' as const,
    lineHeight: '24px',
    margin: '0 0 12px',
};

const stepText = {
    color: '#242140',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 12px',
    textAlign: 'left' as const,
};

const stepNum = {
    color: '#241AA1',
};

const softHr = {
    borderColor: '#e6ebf1',
    margin: '8px 0 24px',
};

const taxNote = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0 0 6px',
};
