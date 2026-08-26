import { Button, Link, Section, Text } from '@react-email/components';
import { PostOrderFooter, styles, v } from './components/PostOrderComponents';
import { SwapperLayout } from './components/SwapperLayout';

// Post-order case 5 — reminder at T+12h, half the window gone and at least one
// ticket still missing. A supplier who simply forgot is the common failure, so
// the mail says how long is left, how many files are still missing, and what
// happens at the deadline. Sent once per order.
//
// `timeRemaining` ("12 hodin") and `uploadDeadline` ("st 3. 6. 2026 v 18:42",
// absolute and without a leading preposition) both arrive pre-formatted.
// `missingTicketCount` counts the tickets in the order that still have no file —
// partial uploads are allowed, so it can be lower than `ticketCount`.
//
// The full consequence list (cancel + refund + fine) belongs to the sold mail,
// where the seller reads the obligation once. Here, 12 hours in and with time
// still on the clock, one consequence plus a human way out gets a better
// response than stacking four — piling on invites reactance, and these are
// contracted suppliers handled by conversation, not by machine.
interface PostOrderSellerReminderEmailProps {
    eventName?: string;
    orderId?: string;
    missingTicketCount?: string;
    ticketCount?: string;
    timeRemaining?: string;
    uploadDeadline?: string;
    uploadUrl?: string;
}

export const PostOrderSellerReminderEmail = (props: PostOrderSellerReminderEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const orderId = v(props.orderId, 'orderId');
    const missingTicketCount = v(props.missingTicketCount, 'missingTicketCount');
    const ticketCount = v(props.ticketCount, 'ticketCount');
    const timeRemaining = v(props.timeRemaining, 'timeRemaining');
    const uploadDeadline = v(props.uploadDeadline, 'uploadDeadline');
    const uploadUrl = v(props.uploadUrl, 'uploadUrl');

    return (
        <SwapperLayout previewText={`Připomínka: zbývá ti ${timeRemaining} na nahrání vstupenek.`}>
            <Text style={styles.heading}>⏰ Kupující čeká na vstupenky</Text>

            <Text style={styles.paragraph}>
                U vstupenek na <strong>{eventName}</strong> nám pořád chybí soubory a zbývá ti {timeRemaining}.
                Vystav je a nahraj.
            </Text>

            <Section style={styles.btnContainer}>
                <Button style={styles.button} href={uploadUrl}>
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
                <Text style={styles.factCardHeading}>Připomínka</Text>

                <Text style={styles.factLabel}>Zbývá nahrát</Text>
                <Text style={styles.factValue}>
                    {missingTicketCount} z {ticketCount} vstupenek · objednávka č. {orderId}
                </Text>

                <Text style={styles.factLabel}>Termín</Text>
                <Text style={{ ...styles.factValue, margin: '0' }}>{uploadDeadline}</Text>
            </Section>

            <Section style={styles.warnCard}>
                <Text style={styles.warnText}>
                    Když vstupenky do termínu nenahraješ, objednávku zrušíme a kupujícímu vrátíme peníze. Ozvi se nám
                    radši dřív, vyřešíme to spolu.
                </Text>
            </Section>

            <PostOrderFooter audience="seller" showSupportPhone />
        </SwapperLayout>
    );
};

PostOrderSellerReminderEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    orderId: '12345',
    missingTicketCount: '1',
    ticketCount: '2',
    timeRemaining: '12 hodin',
    uploadDeadline: 'st 3. 6. 2026 v 18:42',
    uploadUrl: 'https://www.swapper.cz/vstupenky/nabizene/12345/nahrat',
} satisfies PostOrderSellerReminderEmailProps;

export default PostOrderSellerReminderEmail;
