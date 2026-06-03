import { Button, Column, Hr, Link, Row, Section, Text } from '@react-email/components';
import { SwapperLayout } from './components/SwapperLayout';

// Props mirror the SendGrid `dynamicTemplateData` payload. `eventName` is
// consumed by the subject line (configured in SendGrid template settings) and
// is not rendered in the HTML body. `guaranteeActive` arrives as "true"/"false"
// strings — Handlebars `{{#equals}}` handles the comparison.
interface OrderConfirmationEmailProps {
    hostname?: string;
    orderId?: string;
    orderDate?: string;
    eventName?: string;
    orderItems?: string;
    ticketsSubtotal?: string;
    serviceFee?: string;
    guaranteeFee?: string;
    price?: string;
    downloadTicketsUrl?: string;
    guaranteeActive?: string;
    guaranteeClaimUrl?: string;
}

// Placeholders fall through to SendGrid Handlebars at send-time. Preview shows
// the {{var}} text directly so we can visually QA the static layout.
const v = (value: string | undefined, name: string) => (value && value.length > 0 ? value : `{{${name}}}`);

export const OrderConfirmationEmail = (props: OrderConfirmationEmailProps) => {
    const hostname = v(props.hostname, 'hostname');
    const orderId = v(props.orderId, 'orderId');
    const orderDate = v(props.orderDate, 'orderDate');
    const ticketsSubtotal = v(props.ticketsSubtotal, 'ticketsSubtotal');
    const serviceFee = v(props.serviceFee, 'serviceFee');
    const guaranteeFee = v(props.guaranteeFee, 'guaranteeFee');
    const price = v(props.price, 'price');
    const downloadTicketsUrl = v(props.downloadTicketsUrl, 'downloadTicketsUrl');
    const guaranteeClaimUrl = v(props.guaranteeClaimUrl, 'guaranteeClaimUrl');

    return (
        <SwapperLayout previewText="Stáhni si je hned — a co dělat, kdyby něco nehrálo.">
            {/* 1. Headline (subtitle dropped — scanners ignore it) */}
            <Text style={heading}>Vstupenky jsou tvoje 🎉</Text>

            {/* 2. Primary CTA + plaintext fallback */}
            <Section style={btnContainer}>
                <Button style={button} href={downloadTicketsUrl}>
                    Stáhnout vstupenky
                </Button>
                <Text style={fallback}>
                    Nefunguje tlačítko? Otevři{' '}
                    <Link style={fallbackLink} href={downloadTicketsUrl}>
                        {downloadTicketsUrl}
                    </Link>{' '}
                    v prohlížeči.
                </Text>
            </Section>

            {/* 3. Order summary block (doubles as zjednodušený daňový doklad body) */}
            <Section style={card}>
                <Text style={cardHeading}>Shrnutí objednávky</Text>
                <Text style={cardMeta}>
                    Objednávka č. {orderId} · {orderDate}
                </Text>

                <div
                    style={itemsList}
                    // orderItems is server-rendered HTML (<ul><li>…</li></ul>) — triple-braces in Handlebars means unescaped.
                    dangerouslySetInnerHTML={{ __html: props.orderItems ?? '{{{orderItems}}}' }}
                />

                <Hr style={cardHr} />

                <Row style={priceRow}>
                    <Column style={priceLabel}>Vstupenky</Column>
                    <Column style={priceValue}>{ticketsSubtotal}</Column>
                </Row>
                <Row style={priceRow}>
                    <Column style={priceLabel}>Poplatek Swapper</Column>
                    <Column style={priceValue}>{serviceFee}</Column>
                </Row>
                {/* SendGrid Handlebars: guaranteeActive arrives as string "true"/"false", so use #equals */}
                {`{{#equals guaranteeActive "true"}}`}
                <Row style={priceRow}>
                    <Column style={priceLabel}>Swapper Garance</Column>
                    <Column style={priceValue}>{guaranteeFee}</Column>
                </Row>
                {`{{/equals}}`}

                <Hr style={cardHr} />

                <Row style={priceRow}>
                    <Column style={priceLabelTotal}>Celkem</Column>
                    <Column style={priceValueTotal}>{price}</Column>
                </Row>
            </Section>

            {/* 4. Swapper Garance — conditional block (SendGrid #equals for string flags) */}
            {`{{#equals guaranteeActive "true"}}`}
            <Section style={guaranteeCardActive}>
                <Text style={guaranteeHeading}>✓ Swapper Garance aktivní</Text>
                <Text style={guaranteeLead}>Když lístek nezafunguje, vrátíme ti peníze.</Text>
                <Text style={guaranteeBody}>
                    Co potřebujeme: krátké video u brány (záběr na čtečku nebo chybu na obrazovce organizátora).
                </Text>
                <Text style={guaranteeBody}>
                    Vyplň{' '}
                    <Link style={anchor} href={guaranteeClaimUrl}>
                        reklamační formulář
                    </Link>{' '}
                    do 24 h po skončení události.
                </Text>
                <Text style={guaranteeBody}>
                    Problém? Zavolej na{' '}
                    <Link style={anchor} href="tel:+420722596478">
                        722 596 478
                    </Link>{' '}
                    nebo{' '}
                    <Link style={anchor} href="tel:+420739518385">
                        739 518 385
                    </Link>
                    .
                </Text>
                <Text style={guaranteeMuted}>Plné podmínky najdeš v příloze.</Text>
            </Section>
            {`{{else}}`}
            <Section style={guaranteeCardUpsell}>
                <Text style={guaranteeHeadingUpsell}>Příště s Garancí?</Text>
                <Text style={guaranteeBody}>Když lístek nezafunguje, vrátíme ti peníze.</Text>
                <Text style={guaranteeBody}>
                    <Link
                        style={anchor}
                        href="mailto:info@swapper.cz?subject=Swapper%20garance&body=R%C3%A1d%20bych%20p%C5%99idal%20k%20objedn%C3%A1vce%20garanci%20dodate%C4%8Dn%C4%9B"
                    >
                        Získat garanci teď
                    </Link>
                </Text>
            </Section>
            {`{{/equals}}`}

            <Hr style={hr} />

            {/* 5. Help */}
            <Text style={paragraph}>
                <strong>Něco nehraje?</strong> Kontakt na prodejce najdeš v sekci{' '}
                <Link style={anchor} href={downloadTicketsUrl}>
                    Zakoupené vstupenky
                </Link>
                . Nebo odpověz na tento e-mail.
            </Text>

            {/* 6. Sign-off */}
            <Text style={signoff}>
                Užij si to 🙌
                <br />— Tým Swapper
            </Text>

            <Hr style={hr} />

            {/* 7. Daňový doklad legal footer */}
            <Text style={legal}>
                <em>Zjednodušený daňový doklad · Předmět plnění: zprostředkování prodeje vstupenek</em>
            </Text>
            <Text style={legal}>
                Provozovatel služby: Swapper s.r.o., Školská 660/3, Nové Město, 110 00 Praha 1 · IČO 17945925 ·
                neplátce DPH · Spisová značka C 103947, Krajský soud v Ostravě.
            </Text>
            <Text style={legal}>
                <Link style={legalLink} href="https://www.swapper.cz/obchodni-podminky">
                    Obchodní podmínky
                </Link>
                {' · '}
                <Link style={legalLink} href="https://www.swapper.cz/zpracovani-osobnich-udaju">
                    Zpracování osobních údajů
                </Link>
            </Text>
        </SwapperLayout>
    );
};

OrderConfirmationEmail.PreviewProps = {
    hostname: 'https://swapper.cz',
    orderId: '12345',
    orderDate: '26. 5. 2026',
    eventName: 'Lucie ve Foru',
    orderItems:
        '<ul style="margin:0;padding-left:18px;color:#242140;font-size:15px;line-height:24px;"><li><b>Lucie ve Foru</b>, pá 5. 6. 2026 20:00<br>3 × 489 Kč</li></ul>',
    ticketsSubtotal: '1 467 Kč',
    serviceFee: '96 Kč',
    guaranteeFee: '149 Kč',
    price: '1 712 Kč',
    downloadTicketsUrl: 'https://swapper.cz/vstupenky/koupene',
    guaranteeActive: 'true',
    guaranteeClaimUrl: 'https://swapper.cz/garance-reklamace-formular',
} satisfies OrderConfirmationEmailProps;

export default OrderConfirmationEmail;

// ── styles ────────────────────────────────────────────────────────────────────

const heading = {
    color: '#242140',
    fontSize: '26px',
    fontWeight: '700',
    lineHeight: '32px',
    margin: '0 0 12px',
    textAlign: 'center' as const,
};

const paragraph = {
    color: '#242140',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 20px',
    textAlign: 'left' as const,
};

const btnContainer = {
    textAlign: 'center' as const,
    margin: '8px 0 32px',
};

const button = {
    backgroundColor: '#241AA1',
    borderRadius: '9999px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
};

const fallback = {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '12px 0 0',
    textAlign: 'center' as const,
};

const fallbackLink = {
    color: '#6b7280',
    textDecoration: 'underline',
    wordBreak: 'break-all' as const,
};

const card = {
    backgroundColor: '#fafafa',
    border: '1px solid #ececf3',
    borderRadius: '8px',
    padding: '20px 20px 16px',
    margin: '0 0 24px',
};

const cardHeading = {
    color: '#242140',
    fontSize: '20px',
    fontWeight: '700',
    lineHeight: '28px',
    margin: '0 0 4px',
};

const cardMeta = {
    color: '#6b7280',
    fontSize: '13px',
    margin: '0 0 16px',
};

const itemsList = {
    margin: '0 0 4px',
};

const cardHr = {
    borderColor: '#ececf3',
    margin: '16px 0 12px',
};

const priceRow = {
    margin: '0 0 6px',
};

const priceLabel = {
    color: '#242140',
    fontSize: '14px',
    lineHeight: '22px',
};

const priceValue = {
    color: '#242140',
    fontSize: '14px',
    lineHeight: '22px',
    textAlign: 'right' as const,
};

const priceLabelTotal = {
    ...priceLabel,
    fontWeight: '700',
    fontSize: '15px',
};

const priceValueTotal = {
    ...priceValue,
    fontWeight: '700',
    fontSize: '15px',
};

const guaranteeCardActive = {
    backgroundColor: '#f3f1ff',
    border: '1px solid #d9d4ff',
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '0 0 24px',
};

const guaranteeCardUpsell = {
    backgroundColor: '#fafafa',
    border: '1px dashed #d1d5db',
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '0 0 24px',
};

const guaranteeHeading = {
    color: '#241AA1',
    fontSize: '15px',
    fontWeight: '700',
    margin: '0 0 4px',
};

const guaranteeHeadingUpsell = {
    color: '#242140',
    fontSize: '15px',
    fontWeight: '700',
    margin: '0 0 4px',
};

const guaranteeLead = {
    color: '#242140',
    fontSize: '15px',
    fontWeight: '600',
    lineHeight: '24px',
    margin: '0 0 8px',
};

const guaranteeBody = {
    color: '#242140',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 8px',
};

const guaranteeMuted = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '4px 0 0',
};

const signoff = {
    color: '#242140',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '20px 0 0',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '24px 0',
};

const legal = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0 0 6px',
};

const legalLink = {
    color: '#8898aa',
    textDecoration: 'underline',
};

const anchor = {
    color: '#241AA1',
    textDecoration: 'underline',
};
