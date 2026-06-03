import { Section, Text } from '@react-email/components';
import { SwapperLayout } from './components/SwapperLayout';
import { DirectBadge, DirectFooter, styles, v } from './components/DirectComponents';

// Case 9 — Transaction complete → seller. Fires when the buyer confirms receipt
// (SENT → CONFIRMED). One email per distinct seller in the order, carrying that
// seller's summed payout. Positive close, no seller action required.
//
// `payoutAmount` + `currency` arrive as separate values (not a pre-formatted
// string) and are joined here. `payoutTimingNote` is an ESTIMATE, never a date:
// payout fires after the per-event reconciliationBufferHours (default 24h) plus
// the next working-day FIO run — phrase as an estimate ("do 3 pracovních dnů").
// `sellerName` is part of the payload contract but intentionally not rendered
// (Direct emails are not greeted by name). No support phone on this email.
interface DirectSellerTransactionCompleteEmailProps {
    sellerName?: string;
    eventName?: string;
    orderId?: string;
    payoutAmount?: string;
    currency?: string;
    payoutTimingNote?: string;
}

export const DirectSellerTransactionCompleteEmail = (props: DirectSellerTransactionCompleteEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const orderId = v(props.orderId, 'orderId');
    const payoutAmount = v(props.payoutAmount, 'payoutAmount');
    const currency = v(props.currency, 'currency');
    const payoutTimingNote = v(props.payoutTimingNote, 'payoutTimingNote');

    return (
        <SwapperLayout previewText="Hotovo! Kupující potvrdil přijetí — posíláme ti výplatu.">
            <DirectBadge />

            <Text style={styles.heading}>Hotovo! 🎉 Kupující potvrdil přijetí</Text>

            <Text style={styles.paragraph}>
                Kupující právě potvrdil, že vstupenky na <strong>{eventName}</strong> v pořádku převzal. Tím je
                objednávka <strong>{orderId}</strong> úspěšně uzavřená — díky, žes to zvládl na jedničku!
            </Text>

            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Tvoje výplata</Text>

                <Text style={styles.factLabel}>Posíláme ti</Text>
                <Text style={styles.factValue}>
                    {payoutAmount} {currency}
                </Text>

                <Text style={styles.factLabel}>Kdy dorazí</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>{payoutTimingNote}</Text>
            </Section>

            <DirectFooter />
        </SwapperLayout>
    );
};

DirectSellerTransactionCompleteEmail.PreviewProps = {
    sellerName: 'Petře',
    eventName: 'Beats for Love',
    orderId: '12345',
    payoutAmount: '1 616',
    currency: 'Kč',
    payoutTimingNote: 'Do 3 pracovních dnů.',
} satisfies DirectSellerTransactionCompleteEmailProps;

export default DirectSellerTransactionCompleteEmail;
