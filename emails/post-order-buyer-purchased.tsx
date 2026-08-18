import { Button, Column, Hr, Link, Row, Section, Text } from '@react-email/components';
import { PostOrderFooter, styles, v } from './components/PostOrderComponents';
import { SwapperLayout } from './components/SwapperLayout';

// Post-order case 1 — buyer purchase confirmation. The buyer paid for a ticket
// that did not exist yet: the seller makes it for this order and uploads it
// within 24 hours. So this mail carries NO ticket attachment and its whole job
// is to say why, and by when the ticket arrives.
//
// The buyer never hears how this is built internally — no product name, no
// ticketing system, no "Direct". From their side it is an ordinary Swapper PDF
// purchase that lands a little later.
//
// Doubles as the zjednodušený daňový doklad, so the summary carries the full fee
// breakdown (tickets subtotal + Swapper fee + total), like the ordinary order
// confirmation.
//
// `deliveryDeadline` arrives pre-formatted and ABSOLUTE — "st 3. 6. 2026 v 18:42",
// never "zítra do 18:42". An email is read whenever the reader gets to it, so a
// relative deadline is simply wrong by the time some buyers open it. The format
// also carries no leading preposition, so the copy never has to decline it.
interface PostOrderBuyerPurchasedEmailProps {
    eventName?: string;
    ticketCount?: string;
    orderId?: string;
    orderDate?: string;
    ticketsSubtotal?: string;
    serviceFee?: string;
    amount?: string;
    orderUrl?: string;
    deliveryDeadline?: string;
}

export const PostOrderBuyerPurchasedEmail = (props: PostOrderBuyerPurchasedEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const ticketCount = v(props.ticketCount, 'ticketCount');
    const orderId = v(props.orderId, 'orderId');
    const orderDate = v(props.orderDate, 'orderDate');
    const ticketsSubtotal = v(props.ticketsSubtotal, 'ticketsSubtotal');
    const serviceFee = v(props.serviceFee, 'serviceFee');
    const amount = v(props.amount, 'amount');
    const orderUrl = v(props.orderUrl, 'orderUrl');
    const deliveryDeadline = v(props.deliveryDeadline, 'deliveryDeadline');

    return (
        <SwapperLayout previewText="Máš zaplaceno. Vstupenky pro tebe prodejce vystaví a dorazí do 24 hodin.">
            <Text style={styles.heading}>Máš zaplaceno. Vstupenky dorazí do 24 hodin</Text>

            <Text style={styles.paragraph}>
                Vstupenky na <strong>{eventName}</strong> pro tebe prodejce vystavuje až po prodeji, proto v e-mailu
                zatím nejsou. Jakmile je nahraje, pošleme ti je e-mailem.
            </Text>

            {/* The promise, in one card the buyer can act on. */}
            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Kdy vstupenky dostaneš</Text>

                <Text style={styles.factLabel}>Nejpozději</Text>
                <Text style={styles.factValue}>{deliveryDeadline}</Text>

                <Text style={styles.factLabel}>Kdyby nedorazily</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>vrátíme ti celou částku</Text>
            </Section>

            <Section style={styles.btnContainer}>
                <Button style={styles.button} href={orderUrl}>
                    Sledovat objednávku
                </Button>
                <Text style={styles.fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={styles.fallbackLink} href={orderUrl}>
                        {orderUrl}
                    </Link>
                </Text>
            </Section>

            {/* Order summary block — doubles as zjednodušený daňový doklad body. */}
            <Section style={styles.summaryCard}>
                <Text style={styles.summaryHeading}>Shrnutí objednávky</Text>
                <Text style={styles.summaryMeta}>
                    Objednávka č. {orderId} · {orderDate}
                </Text>

                <Text style={styles.summaryItem}>
                    <strong>{eventName}</strong>
                    <br />
                    {ticketCount}× vstupenka
                </Text>

                <Hr style={styles.summaryHr} />

                <Row style={styles.priceRow}>
                    <Column style={styles.priceLabel}>Vstupenky</Column>
                    <Column style={styles.priceValue}>{ticketsSubtotal}</Column>
                </Row>
                <Row style={styles.priceRow}>
                    <Column style={styles.priceLabel}>Poplatek Swapper</Column>
                    <Column style={styles.priceValue}>{serviceFee}</Column>
                </Row>

                <Hr style={styles.summaryHr} />

                <Row style={styles.priceRow}>
                    <Column style={styles.priceLabelTotal}>Celkem</Column>
                    <Column style={styles.priceValueTotal}>{amount}</Column>
                </Row>
            </Section>

            <Hr style={styles.softHr} />

            <Text style={styles.paragraph}>
                Peníze držíme u sebe, dokud vstupenky nemáš. Kdyby nedorazily, ozveme se ti sami.
            </Text>

            <PostOrderFooter audience="buyer" showSupportPhone taxNote />
        </SwapperLayout>
    );
};

PostOrderBuyerPurchasedEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    ticketCount: '2',
    orderId: '12345',
    orderDate: '1. 6. 2026',
    ticketsSubtotal: '1 616 Kč',
    serviceFee: '96 Kč',
    amount: '1 712 Kč',
    orderUrl: 'https://www.swapper.cz/vstupenky/koupene/12345',
    deliveryDeadline: 'st 3. 6. 2026 v 18:42',
} satisfies PostOrderBuyerPurchasedEmailProps;

export default PostOrderBuyerPurchasedEmail;
