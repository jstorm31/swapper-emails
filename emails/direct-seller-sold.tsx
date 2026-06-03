import { Button, Column, Hr, Link, Row, Section, Text } from '@react-email/components';
import { DirectBadge, DirectFooter, directGuideUrl, styles, v } from './components/DirectComponents';
import { SwapperLayout } from './components/SwapperLayout';

// Case 1 — Direct sale, transfer now. Order paid on a Direct event → seller
// enters AWAITING_SEND and has 24 h to transfer the tickets to the buyer via the
// LoveID app. This email MUST show the full `buyerEmail` — it is the transfer
// target. `eventName` is consumed by the SendGrid subject line. The event-specific
// guide (covers "no LoveID account yet") lives at /swapper-direct/{eventId}.
//
// Also carries the seller's money breakdown: `salePrice` (what the tickets sold
// for) − `sellerFee` (Swapper's seller commission, deducted) → `payoutAmount`
// (net payout). All three arrive pre-formatted with currency. The payout is
// released only after the buyer confirms receipt (see case 9), so the copy frames
// it as "po potvrzení přijetí" — not an immediate transfer.
interface DirectSellerSoldEmailProps {
    eventName?: string;
    eventId?: string;
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
    const eventId = v(props.eventId, 'eventId');
    const ticketCount = v(props.ticketCount, 'ticketCount');
    const buyerEmail = v(props.buyerEmail, 'buyerEmail');
    const salePrice = v(props.salePrice, 'salePrice');
    const sellerFee = v(props.sellerFee, 'sellerFee');
    const payoutAmount = v(props.payoutAmount, 'payoutAmount');
    const sendDeadline = v(props.sendDeadline, 'sendDeadline');
    const actionUrl = v(props.actionUrl, 'actionUrl');

    return (
        <SwapperLayout previewText={`Prodáno! Převeď vstupenky kupujícímu do ${sendDeadline}.`}>
            <DirectBadge />

            <Text style={styles.heading}>Prodáno 🎉 Teď převeď vstupenky</Text>

            <Text style={styles.paragraph}>
                Tvoje vstupenky na <strong>{eventName}</strong> se právě prodaly. U Swapper Direct vstupenky kupujícímu
                převedeš sám — přes aplikaci LoveID na jeho e-mail.
            </Text>

            {/* Seller money breakdown: sale price − seller fee → net payout. */}
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

                <Text style={summaryNote}>
                    Výplatu pošleme na tvůj účet, jakmile kupující potvrdí přijetí vstupenek.
                </Text>
            </Section>

            {/* The two facts that matter: who to send to, and by when. */}
            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Co teď udělat</Text>

                <Text style={styles.factLabel}>Převeď vstupenky na e-mail kupujícího</Text>
                <Text style={styles.factValue}>{buyerEmail}</Text>

                <Text style={styles.factLabel}>Stihni to do</Text>
                <Text style={styles.factValue}>{sendDeadline}</Text>

                <Text style={styles.factLabel}>Počet vstupenek</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>{ticketCount}</Text>
            </Section>

            <Section style={styles.btnContainer}>
                <Button style={styles.button} href={actionUrl}>
                    Označit jako odeslané
                </Button>
                <Text style={styles.fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={styles.fallbackLink} href={actionUrl}>
                        {actionUrl}
                    </Link>
                </Text>
            </Section>

            <Text style={styles.paragraph}>
                <strong>Jak na to:</strong>
                <br />
                1. Otevři aplikaci LoveID a převeď vstupenky na <strong>{buyerEmail}</strong>.
                <br />
                2. Vrať se sem a klikni na „Označit jako odeslané".
                <br />
                3. Hotovo — počkáš, až kupující potvrdí přijetí.
            </Text>

            <Text style={styles.paragraph}>
                Nevíš si rady? Krok za krokem tě tím provede{' '}
                <Link style={styles.anchor} href={directGuideUrl(eventId)}>
                    návod pro tuhle akci
                </Link>
                .
            </Text>

            {/* Deadline is real and enforced by cron — set the expectation precisely. */}
            <Section style={styles.warnCard}>
                <Text style={styles.warnText}>
                    Když vstupenky nepřevedeš do {sendDeadline} objednávku automaticky zrušíme a kupujícímu vrátíme
                    peníze.
                </Text>
            </Section>

            <DirectFooter showSupportPhone />
        </SwapperLayout>
    );
};

DirectSellerSoldEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    eventId: '987',
    ticketCount: '2',
    buyerEmail: 'kupujici@email.cz',
    salePrice: '1 616 Kč',
    sellerFee: '81 Kč',
    payoutAmount: '1 535 Kč',
    orderId: '12345',
    sendDeadline: 'zítra do 18:42',
    actionUrl: 'https://www.swapper.cz/vstupenky/prodane/12345',
} satisfies DirectSellerSoldEmailProps;

export default DirectSellerSoldEmail;

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
