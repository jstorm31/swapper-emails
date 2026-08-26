import { Button, Column, Hr, Link, Row, Section, Text } from '@react-email/components';
import { POST_ORDER_TERMS_URL, PostOrderFooter, styles, v } from './components/PostOrderComponents';
import { SwapperLayout } from './components/SwapperLayout';

// Post-order case 4 — sold, upload now. The order is paid and the seller has 24
// hours to make the ticket in the promoter's app and upload the PDF to the
// order. This mail starts that clock, so the deadline and the upload button are
// the whole email; the payout block is supporting detail.
//
// `uploadDeadline` arrives pre-formatted, ABSOLUTE and without a leading
// preposition ("st 3. 6. 2026 v 18:42" — never "zítra do 18:42", which is wrong
// for anyone who opens the mail later), already clamped to the event start when
// that comes sooner. The money breakdown is the
// seller side: `salePrice` − `sellerFee` (Swapper's commission) → `payoutAmount`.
interface PostOrderSellerSoldEmailProps {
    eventName?: string;
    ticketCount?: string;
    orderId?: string;
    salePrice?: string;
    sellerFee?: string;
    payoutAmount?: string;
    uploadDeadline?: string;
    uploadUrl?: string;
}

export const PostOrderSellerSoldEmail = (props: PostOrderSellerSoldEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const ticketCount = v(props.ticketCount, 'ticketCount');
    const orderId = v(props.orderId, 'orderId');
    const salePrice = v(props.salePrice, 'salePrice');
    const sellerFee = v(props.sellerFee, 'sellerFee');
    const payoutAmount = v(props.payoutAmount, 'payoutAmount');
    const uploadDeadline = v(props.uploadDeadline, 'uploadDeadline');
    const uploadUrl = v(props.uploadUrl, 'uploadUrl');

    return (
        <SwapperLayout previewText={`Prodáno! Vystav vstupenky a nahraj je. Termín: ${uploadDeadline}.`}>
            <Text style={styles.heading}>Prodáno 🎉 Teď nahraj vstupenky</Text>

            <Text style={styles.paragraph}>
                Vstupenky na <strong>{eventName}</strong> se prodaly. Vystav je a nahraj jako PDF. Kupující je dostane
                ke stažení hned.
            </Text>

            <Section style={styles.btnContainer}>
                <Button style={primaryButton} href={uploadUrl}>
                    Nahrát vstupenky
                </Button>
                <Text style={styles.fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={styles.fallbackLink} href={uploadUrl}>
                        {uploadUrl}
                    </Link>
                </Text>
            </Section>

            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Co teď udělat</Text>

                <Text style={styles.factLabel}>1. Vystav vstupenky</Text>
                <Text style={styles.factValue}>{ticketCount}× pro objednávku č. {orderId}</Text>

                <Text style={styles.factLabel}>2. Nahraj je do Swapperu</Text>
                <Text style={styles.factValue}>přes tlačítko výše</Text>

                <Text style={styles.factLabel}>Termín</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>{uploadDeadline}</Text>
            </Section>

            <Text style={styles.paragraph}>
                Nahrávat můžeš postupně, po jedné. Když soubor neprojde kontrolou, napíšeme ti proč a zkusíš to znovu.
            </Text>

            {/* Secondary — payout reassurance, intentionally muted vs. the action. */}
            <Section style={styles.summaryCard}>
                <Text style={styles.summaryHeading}>Tvoje výplata</Text>

                <Row style={styles.priceRow}>
                    <Column style={styles.priceLabel}>Prodejní cena</Column>
                    <Column style={styles.priceValue}>{salePrice}</Column>
                </Row>
                <Row style={styles.priceRow}>
                    <Column style={styles.priceLabel}>Poplatek Swapper</Column>
                    <Column style={styles.priceValue}>−{sellerFee}</Column>
                </Row>

                <Hr style={styles.summaryHr} />

                <Row style={styles.priceRow}>
                    <Column style={styles.priceLabelTotal}>Dostaneš</Column>
                    <Column style={styles.priceValueTotal}>{payoutAmount}</Column>
                </Row>

                <Text style={styles.summaryNote}>Výplatu pošleme zhruba den po nahrání vstupenek.</Text>
            </Section>

            <Section style={styles.warnCard}>
                <Text style={styles.warnText}>
                    Když vstupenky do termínu nenahraješ, objednávku zrušíme, kupujícímu vrátíme peníze a podle{' '}
                    <Link style={styles.anchor} href={POST_ORDER_TERMS_URL}>
                        podmínek dodání vstupenky po nákupu
                    </Link>{' '}
                    ti vzniká smluvní pokuta. Když to nestíháš, dej nám vědět dřív.
                </Text>
            </Section>

            <PostOrderFooter audience="seller" showSupportPhone />
        </SwapperLayout>
    );
};

PostOrderSellerSoldEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    ticketCount: '2',
    orderId: '12345',
    salePrice: '1 616 Kč',
    sellerFee: '81 Kč',
    payoutAmount: '1 535 Kč',
    uploadDeadline: 'st 3. 6. 2026 v 18:42',
    uploadUrl: 'https://www.swapper.cz/vstupenky/nahrane/12345/nahrat',
} satisfies PostOrderSellerSoldEmailProps;

export default PostOrderSellerSoldEmail;

// Enlarged primary CTA — this email has one job (upload now), so the button is
// bigger and bolder than the shared default to anchor the eye.
const primaryButton = {
    ...styles.button,
    fontSize: '17px',
    padding: '16px 46px',
};
