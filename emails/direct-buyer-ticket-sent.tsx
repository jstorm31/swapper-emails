import { Button, Link, Section, Text } from '@react-email/components';
import {
    DirectBadge,
    DirectFooter,
    directGuideUrl,
    styles,
    SUPPORT_PHONE,
    telHref,
    v,
} from './components/DirectComponents';
import { SwapperLayout } from './components/SwapperLayout';

// Case 6 — Ticket sent, confirm receipt. Seller marked SENT. The CTA is a single
// click to the tracking page — confirm is one-click with NO upload (evidence-on-
// demand is ops-only in v1). Optionally also sent as SMS (copy in SWAPPER-DIRECT.md).
interface DirectBuyerTicketSentEmailProps {
    eventName?: string;
    eventId?: string;
    orderId?: string;
    confirmUrl?: string;
}

export const DirectBuyerTicketSentEmail = (props: DirectBuyerTicketSentEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const eventId = v(props.eventId, 'eventId');
    const orderId = v(props.orderId, 'orderId');
    const confirmUrl = v(props.confirmUrl, 'confirmUrl');

    return (
        <SwapperLayout previewText="Prodejce ti převedl vstupenky. Dorazily? Potvrď to jedním klikem.">
            <DirectBadge />

            <Text style={styles.heading}>Vstupenky dorazily – potvrď je</Text>

            <Text style={styles.paragraph}>
                Prodejce právě převedl tvoje vstupenky na <strong>{eventName}</strong> (objednávka {orderId}).
                Zkontroluj svůj e-mail i aplikaci LoveID — měly by tam být.
            </Text>

            <Text style={styles.paragraph}>
                <strong>Máš je?</strong> Potvrď přijetí jedním kliknutím. Nic nenahráváš ani nevyplňuješ — jen dáš
                vědět, že je všechno v pořádku.
            </Text>

            <Section style={styles.btnContainer}>
                <Button style={styles.button} href={confirmUrl}>
                    Potvrdit přijetí vstupenek
                </Button>
                <Text style={styles.fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={styles.fallbackLink} href={confirmUrl}>
                        {confirmUrl}
                    </Link>
                </Text>
            </Section>

            <Section style={styles.factCard}>
                <Text style={{ ...styles.warnText, color: '#1B1480', margin: '0' }}>
                    <strong>Ještě ti nedorazily, nebo nemáš LoveID?</strong> Mrkni i do spamu a koukni na{' '}
                    <Link style={styles.anchor} href={directGuideUrl(eventId)}>
                        návod pro tuhle akci
                    </Link>
                    . Kdyby vstupenky do pár hodin nepřišly, zavolej nám na{' '}
                    <Link style={styles.anchor} href={telHref(SUPPORT_PHONE)}>
                        {SUPPORT_PHONE}
                    </Link>{' '}
                    — vyřešíme to. Přijetí potvrzuj až ve chvíli, kdy vstupenky opravdu máš.
                </Text>
            </Section>

            <DirectFooter showSupportPhone />
        </SwapperLayout>
    );
};

DirectBuyerTicketSentEmail.PreviewProps = {
    eventName: 'Lucie ve Foru',
    eventId: '987',
    orderId: '12345',
    confirmUrl: 'https://www.swapper.cz/vstupenky/koupene/12345/potvrdit',
} satisfies DirectBuyerTicketSentEmailProps;

export default DirectBuyerTicketSentEmail;
