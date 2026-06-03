import { Section, Text } from '@react-email/components';
import { SwapperLayout } from './components/SwapperLayout';
import { DirectBadge, DirectFooter, styles, v } from './components/DirectComponents';

// Case 7 — Buyer refunded (no-send 24h, no-confirm 14d, or dispute reversal).
// Refunds are ops-manual in v1 (GP webpay portal), so the copy says the refund is
// BEING processed with a realistic window — never "already in your account".
// `reasonText` = buyer-friendly Czech sentence for the trigger; `refundProcessingNote`
// = the timing caveat string. Both are pre-formatted by the backend.
interface DirectBuyerRefundedEmailProps {
    eventName?: string;
    orderId?: string;
    amount?: string;
    reasonText?: string;
    refundProcessingNote?: string;
}

export const DirectBuyerRefundedEmail = (props: DirectBuyerRefundedEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const orderId = v(props.orderId, 'orderId');
    const amount = v(props.amount, 'amount');
    const reasonText = v(props.reasonText, 'reasonText');
    const refundProcessingNote = v(props.refundProcessingNote, 'refundProcessingNote');

    return (
        <SwapperLayout previewText="Objednávku jsme zrušili a vracíme ti peníze.">
            <DirectBadge />

            <Text style={styles.heading}>Vracíme ti peníze</Text>

            <Text style={styles.paragraph}>
                Objednávku <strong>{orderId}</strong> na <strong>{eventName}</strong> jsme zrušili. {reasonText}
            </Text>

            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Vrácení peněz</Text>

                <Text style={styles.factLabel}>Vracíme částku</Text>
                <Text style={styles.factValue}>{amount}</Text>

                <Text style={{ ...styles.factLabel, margin: '0' }}>{refundProcessingNote}</Text>
            </Section>

            <Text style={styles.paragraph}>
                Peníze vracíme zpět na platební prostředek, kterým jsi platil. Nemusíš nic dělat — jakmile bude
                refundace hotová, uvidíš ji na svém účtu. Děkujeme za trpělivost a omlouváme se za komplikace.
            </Text>

            <DirectFooter showSupportPhone />
        </SwapperLayout>
    );
};

DirectBuyerRefundedEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    orderId: '12345',
    amount: '1 712 Kč',
    reasonText: 'Prodejce ti vstupenky bohužel nestihl poslat včas.',
    refundProcessingNote: 'Refundaci zpracujeme ručně, na účtu ji obvykle uvidíš do 5–10 pracovních dnů.',
} satisfies DirectBuyerRefundedEmailProps;

export default DirectBuyerRefundedEmail;
