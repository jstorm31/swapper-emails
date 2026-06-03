import { Section, Text } from '@react-email/components';
import { SwapperLayout } from './components/SwapperLayout';
import { DirectBadge, DirectFooter, styles, v } from './components/DirectComponents';

// Case 3 — Auto-cancel notice (T+24h, tickets never transferred). Order is
// cancelled and the buyer is refunded. Strikes/suspension are NOT communicated in
// v1, so this is a clean cancellation notice (no strikeCount / isSuspended copy).
interface DirectSellerAutoCancelledEmailProps {
    eventName?: string;
    orderId?: string;
}

export const DirectSellerAutoCancelledEmail = (props: DirectSellerAutoCancelledEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const orderId = v(props.orderId, 'orderId');

    return (
        <SwapperLayout previewText="Objednávku jsme museli zrušit, protože vstupenky nebyly převedeny včas.">
            <DirectBadge />

            <Text style={styles.heading}>Objednávku jsme zrušili</Text>

            <Text style={styles.paragraph}>
                Vstupenky na <strong>{eventName}</strong> (objednávka {orderId}) nebyly převedeny do 24 hodin,
                proto jsme objednávku automaticky zrušili a kupujícímu vrátili peníze.
            </Text>

            <Text style={styles.paragraph}>
                Příště vstupenky převeď hned po prodeji — na převod máš vždy 24 hodin a my ti připomeneme, kdyby
                se blížil konec lhůty.
            </Text>

            <Text style={styles.paragraph}>
                Víme, že se občas něco zkrátka semele. Pokud k tomu byl důvod nebo se ti zrušení zdá jako omyl,
                dej nám vědět — rádi se na to podíváme.
            </Text>

            <DirectFooter showSupportPhone />
        </SwapperLayout>
    );
};

DirectSellerAutoCancelledEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    orderId: '12345',
} satisfies DirectSellerAutoCancelledEmailProps;

export default DirectSellerAutoCancelledEmail;
