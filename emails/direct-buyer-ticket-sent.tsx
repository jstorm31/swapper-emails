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

// Case 6 — Ticket ready, confirm/claim. Seller marked SENT.
//
// Provider-aware (`provider` = "loveId" | "nfcTron", DirectProvider rawValue):
//  · LoveID  — the seller already transferred the tickets; the buyer confirms
//    receipt with one click (NO upload; evidence-on-demand is ops-only in v1).
//    Confirm only once you actually have the tickets.
//  · NFCTron — the click IS the claim: it releases the payment to the seller AND
//    redirects the buyer to the NFCTron claim screen, where they claim the ticket
//    into their own account and do the 150 Kč name change themselves. So the copy
//    reframes the button as "get your ticket" and discloses that clicking releases
//    payment (ADR: "a click releases the money — deliberately").
// Branch is `{{#equals provider "nfcTron"}} … {{else}} …LoveID… {{/equals}}`;
// LoveID is the `{{else}}` default (legacy sends omit provider). Optionally also
// sent as SMS (copy in SWAPPER-DIRECT.md).
interface DirectBuyerTicketSentEmailProps {
    provider?: string;
    eventName?: string;
    orderId?: string;
    confirmUrl?: string;
}

export const DirectBuyerTicketSentEmail = (props: DirectBuyerTicketSentEmailProps) => {
    const eventName = v(props.eventName, 'eventName');
    const orderId = v(props.orderId, 'orderId');
    const confirmUrl = v(props.confirmUrl, 'confirmUrl');

    return (
        <SwapperLayout previewText="Vstupenky na tebe čekají — dokonči to jedním kliknutím.">
            <DirectBadge />

            {`{{#equals provider "nfcTron"}}`}
            <Text style={styles.heading}>Vstupenky jsou připravené – vyzvedni si je</Text>

            <Text style={styles.paragraph}>
                Prodejce ti poslal vstupenky na <strong>{eventName}</strong> (objednávka {orderId}). Jedním kliknutím je
                převedeš do svého účtu NFCTron.
            </Text>

            <Section style={styles.btnContainer}>
                <Button style={styles.button} href={confirmUrl}>
                    Vyzvednout vstupenky
                </Button>
                <Text style={styles.fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={styles.fallbackLink} href={confirmUrl}>
                        {confirmUrl}
                    </Link>
                </Text>
            </Section>

            {/* The 150 Kč name change is the buyer's own step and gates entry at
                the gate — make it impossible to miss. */}
            <Section style={styles.warnCard}>
                <Text style={styles.warnText}>
                    <strong>Po vyzvednutí vstupenek si změň jméno v NFCtron účtu (150 Kč).</strong> Zadej jméno přesně
                    tak, jak je na dokladu, který vezmeš k bráně. Bez přejmenování tě u vstupu nemusí pustit — nenech to
                    na poslední chvíli.
                </Text>
            </Section>

            <Text style={disclaimer}>Swapper je nezávislá platforma a není spojený s pořadatelem.</Text>
            {`{{else}}`}
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
                    <Link style={styles.anchor} href={directGuideUrl('loveid')}>
                        návod pro tuhle akci
                    </Link>
                    . Kdyby vstupenky do pár hodin nepřišly, zavolej nám na{' '}
                    <Link style={styles.anchor} href={telHref(SUPPORT_PHONE)}>
                        {SUPPORT_PHONE}
                    </Link>{' '}
                    — vyřešíme to. Přijetí potvrzuj až ve chvíli, kdy vstupenky opravdu máš.
                </Text>
            </Section>
            {`{{/equals}}`}

            <DirectFooter showSupportPhone />
        </SwapperLayout>
    );
};

DirectBuyerTicketSentEmail.PreviewProps = {
    provider: 'nfcTron',
    eventName: 'Lucie ve Foru',
    orderId: '12345',
    confirmUrl: 'https://www.swapper.cz/vstupenky/koupene/12345/potvrdit',
} satisfies DirectBuyerTicketSentEmailProps;

export default DirectBuyerTicketSentEmail;

// Independence disclaimer — required on NFCTron customer emails (ADR/spec §A3).
const disclaimer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0 0 6px',
    textAlign: 'left' as const,
};
