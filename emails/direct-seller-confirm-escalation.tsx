import { Link, Section, Text } from '@react-email/components';
import { SwapperLayout } from './components/SwapperLayout';
import { DirectBadge, DirectFooter, directGuideUrl, styles, v } from './components/DirectComponents';

// Case 4 — Confirm escalation (T+12d). Seller marked SENT, but the buyer still
// hasn't confirmed receipt. Day-12 is the last nudge before the 14-day auto-
// refund. If the seller got the LoveID e-mail that the buyer accepted the
// ticket, they forward it to support as proof of delivery.
interface DirectSellerConfirmEscalationEmailProps {
    eventName?: string;
    orderId?: string;
    confirmDeadline?: string;
}

const SUPPORT_EMAIL = 'info@swapper.cz';

export const DirectSellerConfirmEscalationEmail = (props: DirectSellerConfirmEscalationEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const orderId = v(props.orderId, 'orderId');
    const confirmDeadline = v(props.confirmDeadline, 'confirmDeadline');

    return (
        <SwapperLayout previewText="Kupující zatím nepotvrdil přijetí vstupenek. Převzal si je?">
            <DirectBadge />

            <Text style={styles.heading}>Potvrdil ti kupující přijetí?</Text>

            <Text style={styles.paragraph}>
                Vstupenky na <strong>{eventName}</strong> (objednávka {orderId}) jsi označil jako odeslané, ale
                kupující zatím nepotvrdil jejich přijetí.
            </Text>

            <Text style={styles.paragraph}>
                Pokud ti od LoveID přišel e-mail, že kupující vstupenky <strong>přijal</strong>, přepošli nám ho
                na{' '}
                <Link style={styles.anchor} href={`mailto:${SUPPORT_EMAIL}?subject=Objedn%C3%A1vka%20${orderId}`}>
                    {SUPPORT_EMAIL}
                </Link>{' '}
                a do předmětu uveď číslo objednávky {orderId}. Pomůže nám to objednávku v pořádku uzavřít.
            </Text>

            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Poslední termín</Text>
                <Text style={styles.factLabel}>Kupující má na potvrzení čas do</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>{confirmDeadline}</Text>
            </Section>

            <Text style={styles.paragraph}>
                Nevíš, jak převod v LoveID funguje? Poradí ti{' '}
                <Link style={styles.anchor} href={directGuideUrl('loveid')}>
                    návod pro tuhle akci
                </Link>
                .
            </Text>

            <Section style={styles.warnCard}>
                <Text style={styles.warnText}>
                    Když kupující přijetí do {confirmDeadline} nepotvrdí a nebudeme mít doklad o převzetí,
                    objednávku uzavřeme ve prospěch kupujícího a peníze mu vrátíme.
                </Text>
            </Section>

            <DirectFooter showSupportPhone />
        </SwapperLayout>
    );
};

DirectSellerConfirmEscalationEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    orderId: '12345',
    confirmDeadline: '14. 6. 2026',
} satisfies DirectSellerConfirmEscalationEmailProps;

export default DirectSellerConfirmEscalationEmail;
