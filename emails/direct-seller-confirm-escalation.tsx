import { Button, Link, Section, Text } from '@react-email/components';
import { SwapperLayout } from './components/SwapperLayout';
import { DirectBadge, DirectFooter, directGuideUrl, styles, v } from './components/DirectComponents';

// Case 4 — Confirm escalation (T+12d). Seller marked SENT, but the buyer still
// hasn't confirmed receipt. Day-12 is the last nudge before the 14-day auto-
// refund. If the seller can see in LoveID that the buyer accepted, one click on
// `sawAcceptanceUrl` flags it for ops.
interface DirectSellerConfirmEscalationEmailProps {
    eventName?: string;
    orderId?: string;
    confirmDeadline?: string;
    sawAcceptanceUrl?: string;
}

export const DirectSellerConfirmEscalationEmail = (props: DirectSellerConfirmEscalationEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const orderId = v(props.orderId, 'orderId');
    const confirmDeadline = v(props.confirmDeadline, 'confirmDeadline');
    const sawAcceptanceUrl = v(props.sawAcceptanceUrl, 'sawAcceptanceUrl');

    return (
        <SwapperLayout previewText="Kupující zatím nepotvrdil přijetí vstupenek. Převzal si je?">
            <DirectBadge />

            <Text style={styles.heading}>Potvrdil ti kupující přijetí?</Text>

            <Text style={styles.paragraph}>
                Vstupenky na <strong>{eventName}</strong> (objednávka {orderId}) jsi označil jako odeslané, ale
                kupující zatím nepotvrdil jejich přijetí.
            </Text>

            <Text style={styles.paragraph}>
                Pokud v aplikaci LoveID vidíš, že kupující vstupenky <strong>převzal</strong>, dej nám o tom
                vědět tlačítkem níže. Pomůže nám to objednávku v pořádku uzavřít.
            </Text>

            <Section style={styles.btnContainer}>
                <Button style={styles.button} href={sawAcceptanceUrl}>
                    Kupující vstupenky převzal
                </Button>
                <Text style={styles.fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={styles.fallbackLink} href={sawAcceptanceUrl}>
                        {sawAcceptanceUrl}
                    </Link>
                </Text>
            </Section>

            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Poslední termín</Text>
                <Text style={styles.factLabel}>Kupující má na potvrzení čas do</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>{confirmDeadline}</Text>
            </Section>

            <Text style={styles.paragraph}>
                Nevíš, kde převzetí ověřit? Poradí ti{' '}
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
    sawAcceptanceUrl: 'https://www.swapper.cz/vstupenky/nabizene/12345/potvrzeni',
} satisfies DirectSellerConfirmEscalationEmailProps;

export default DirectSellerConfirmEscalationEmail;
