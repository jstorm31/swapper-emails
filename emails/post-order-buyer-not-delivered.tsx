import { Link, Section, Text } from '@react-email/components';
import { PostOrderFooter, styles, v } from './components/PostOrderComponents';
import { SwapperLayout } from './components/SwapperLayout';

// Post-order case 3 — the 24 hours passed and no ticket arrived. Fired
// automatically by the T+24h job, at the same moment as the ops escalation; the
// refund is the manual half, since ops revert the order by hand afterwards. So
// the timing line is a window wide enough to absorb that, and the refund is
// stated as coming — never "already in your account".
//
// The buyer's goal — go to the show — is still live even though this order is
// dead, so `eventUrl` links back to the event: the alternative is one click, not
// a search. `deliveryDeadline` is absolute ("út 2. 6. 2026 v 18:42"); "včera"
// would be wrong for anyone reading this a day later.
interface PostOrderBuyerNotDeliveredEmailProps {
    eventName?: string;
    orderId?: string;
    amount?: string;
    deliveryDeadline?: string;
    eventUrl?: string;
}

export const PostOrderBuyerNotDeliveredEmail = (props: PostOrderBuyerNotDeliveredEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const orderId = v(props.orderId, 'orderId');
    const amount = v(props.amount, 'amount');
    const deliveryDeadline = v(props.deliveryDeadline, 'deliveryDeadline');
    const eventUrl = v(props.eventUrl, 'eventUrl');

    return (
        <SwapperLayout previewText="Vstupenky nedorazily. Vracíme ti peníze zpět na kartu.">
            <Text style={styles.heading}>Vstupenky nedorazily. Vracíme ti peníze</Text>

            <Text style={styles.paragraph}>
                Vstupenky na <strong>{eventName}</strong> ti prodejce nedodal do slíbeného termínu, který byl{' '}
                {deliveryDeadline}. Vracíme ti proto peníze, nemusíš nic dělat. Mrzí nás to.
            </Text>

            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Objednávka {orderId}</Text>

                <Text style={styles.factLabel}>Vracíme ti</Text>
                <Text style={styles.factValue}>{amount}</Text>

                <Text style={styles.factLabel}>Kam</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>zpět na kartu, do 3–5 pracovních dnů</Text>
            </Section>

            <Text style={styles.paragraph}>
                Pokud na akci pořád chceš, koukni na{' '}
                <Link style={styles.anchor} href={eventUrl}>
                    ostatní vstupenky v nabídce
                </Link>
                .
            </Text>

            <PostOrderFooter audience="buyer" showSupportPhone />
        </SwapperLayout>
    );
};

PostOrderBuyerNotDeliveredEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    orderId: '12345',
    amount: '1 712 Kč',
    deliveryDeadline: 'út 2. 6. 2026 v 18:42',
    eventUrl: 'https://www.swapper.cz/akce/lucie-ve-foru',
} satisfies PostOrderBuyerNotDeliveredEmailProps;

export default PostOrderBuyerNotDeliveredEmail;
