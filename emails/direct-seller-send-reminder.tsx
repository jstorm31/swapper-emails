import { Button, Link, Section, Text } from '@react-email/components';
import { DirectBadge, DirectFooter, directGuideUrl, styles, v } from './components/DirectComponents';
import { SwapperLayout } from './components/SwapperLayout';

// Case 2 — Send reminder (T+12h, tickets still not transferred). Email + SMS
// sibling (SMS copy lives in SWAPPER-DIRECT.md). Same transfer target rule as
// case 1: the full `buyerEmail` is shown because it is where the tickets must go.
interface DirectSellerSendReminderEmailProps {
    eventName?: string;
    buyerEmail?: string;
    orderId?: string;
    sendDeadline?: string;
    actionUrl?: string;
}

export const DirectSellerSendReminderEmail = (props: DirectSellerSendReminderEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const buyerEmail = v(props.buyerEmail, 'buyerEmail');
    const orderId = v(props.orderId, 'orderId');
    const sendDeadline = v(props.sendDeadline, 'sendDeadline');
    const actionUrl = v(props.actionUrl, 'actionUrl');

    return (
        <SwapperLayout previewText={`Připomínka: převeď vstupenky kupujícímu do ${sendDeadline}.`}>
            <DirectBadge />

            <Text style={styles.heading}>⏰ Vstupenky čekají na převod</Text>

            <Text style={styles.paragraph}>
                Ještě jsme nezaznamenali, že jsi převedl vstupenky na <strong>{eventName}</strong>. Kupující čeká —
                převeď mu je přes aplikaci LoveID, ať je vše v pořádku.
            </Text>

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

            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Připomínka</Text>

                <Text style={styles.factLabel}>Převeď vstupenky na e-mail kupujícího</Text>
                <Text style={styles.factValue}>{buyerEmail}</Text>

                <Text style={styles.factLabel}>Zbývá čas do</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>{sendDeadline}</Text>
            </Section>

            <Text style={styles.paragraph}>
                Nevíš si rady? Krok za krokem tě tím provede{' '}
                <Link style={styles.anchor} href={directGuideUrl('loveid')}>
                    návod pro tuhle akci
                </Link>
                .
            </Text>

            <Section style={styles.warnCard}>
                <Text style={styles.warnText}>
                    Pokud vstupenky nepřevedeš do {sendDeadline}, objednávku <strong>{orderId}</strong> automaticky
                    zrušíme a kupujícímu vrátíme peníze.
                </Text>
            </Section>

            <DirectFooter showSupportPhone />
        </SwapperLayout>
    );
};

DirectSellerSendReminderEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    buyerEmail: 'kupujici@email.cz',
    orderId: '12345',
    sendDeadline: 'dnes do 18:42',
    actionUrl: 'https://www.swapper.cz/vstupenky/prodane/12345',
} satisfies DirectSellerSendReminderEmailProps;

export default DirectSellerSendReminderEmail;
