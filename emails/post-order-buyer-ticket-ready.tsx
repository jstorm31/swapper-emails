import { Button, Link, Section, Text } from '@react-email/components';
import { PostOrderFooter, styles, v } from './components/PostOrderComponents';
import { SwapperLayout } from './components/SwapperLayout';

// Post-order case 2 — the ticket the seller made after the sale has arrived and
// every ticket in the order now has a file. From here on this is an ordinary
// Swapper PDF: the same download, the same merged file, no new mechanism to
// learn — so the mail is short and the button does the work.
//
// This is the peak of the whole flow: the wait ends and the promise is kept, and
// it is what the buyer will remember of the purchase. So it closes on the event
// (name + date) and a sign-off, not on order admin — the order number stays, as
// a quiet meta line for support.
interface PostOrderBuyerTicketReadyEmailProps {
    eventName?: string;
    eventDate?: string;
    ticketCount?: string;
    orderId?: string;
    downloadTicketsUrl?: string;
}

export const PostOrderBuyerTicketReadyEmail = (props: PostOrderBuyerTicketReadyEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const eventDate = v(props.eventDate, 'eventDate');
    const ticketCount = v(props.ticketCount, 'ticketCount');
    const orderId = v(props.orderId, 'orderId');
    const downloadTicketsUrl = v(props.downloadTicketsUrl, 'downloadTicketsUrl');

    return (
        <SwapperLayout previewText="Vstupenky dorazily. Stáhni si je.">
            <Text style={styles.heading}>Vstupenky jsou tvoje 🎉</Text>

            <Text style={styles.paragraph}>
                Prodejce vstupenky na <strong>{eventName}</strong> vystavil a nahrál. Máš je do 24 hodin od zaplacení,
                jak jsme slíbili.
            </Text>

            <Section style={styles.btnContainer}>
                <Button style={styles.button} href={downloadTicketsUrl}>
                    Stáhnout vstupenky
                </Button>
                <Text style={styles.fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={styles.fallbackLink} href={downloadTicketsUrl}>
                        {downloadTicketsUrl}
                    </Link>
                </Text>
            </Section>

            <Section style={styles.factCard}>
                <Text style={styles.factCardHeading}>Tvoje akce</Text>

                <Text style={styles.factValue}>{eventName}</Text>
                <Text style={{ ...styles.factLabel, margin: '0' }}>{eventDate}</Text>
            </Section>

            <Text style={styles.paragraph}>
                Ulož si je do telefonu ještě doma. U brány se ti budou hodit i bez signálu.
            </Text>

            <Text style={styles.meta}>
                Objednávka č. {orderId} · {ticketCount}× vstupenka
            </Text>

            <PostOrderFooter audience="buyer" showSupportPhone signoffLead="Užij si to 🙌" />
        </SwapperLayout>
    );
};

PostOrderBuyerTicketReadyEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    eventDate: 'pá 5. 6. 2026 od 20:00',
    ticketCount: '2',
    orderId: '12345',
    downloadTicketsUrl: 'https://www.swapper.cz/vstupenky/koupene/12345',
} satisfies PostOrderBuyerTicketReadyEmailProps;

export default PostOrderBuyerTicketReadyEmail;
