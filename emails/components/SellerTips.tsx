import { Button, Hr, Link, Section, Text } from '@react-email/components';
import { SwapperLayout } from './SwapperLayout';

interface SellerTipsEmailProps {
    /** Preheader / inbox preview line. */
    previewText: string;
    /** Main headline — carries the event name + timing (e.g. "RFP je za pár dní…"). */
    headline: string;
    /** Opening paragraph; mentions the event by full name once. */
    intro: string;
    /** Event label used in the footer note, e.g. "Rock for People 2026". */
    footerEvent: string;
    /** UTM campaign value, e.g. "rfp26reminder". */
    campaign: string;
}

// The three core tips are the same for every event — only the wrapping copy changes.
const tips = [
    {
        title: 'Propoj Facebook.',
        body: 'Ověřené nabídky se řadí nad ostatní – kupující tě uvidí dřív.',
        profile: true,
    },
    {
        title: 'Uprav cenu.',
        body: 'Nabídek je teď hodně. I pár korun dolů tě posune před konkurenci.',
        profile: false,
    },
    {
        title: 'Přidej profilovou fotku.',
        body: 'Kupující víc věří nabídce, za kterou vidí skutečného člověka.',
        profile: true,
    },
];

export const SellerTipsEmail = ({ previewText, headline, intro, footerEvent, campaign }: SellerTipsEmailProps) => {
    const utm = `utm_source=email&utm_campaign=${campaign}`;
    const dashboardUrl = `https://www.swapper.cz/vstupenky/nabizene?${utm}`;
    const profileUrl = `https://www.swapper.cz/profil?${utm}`;

    return (
        <SwapperLayout previewText={previewText}>
            <Text style={heading}>{headline}</Text>

            <Text style={paragraph}>{intro}</Text>

            {tips.map((tip, index) => (
                <Section key={index} style={tipRow}>
                    <Text style={tipHeaderText}>
                        <span style={tipNumber}>{index + 1}</span>
                        <span style={tipTitle}>{tip.title}</span>
                    </Text>
                    <Text style={tipBody}>
                        {tip.body}
                        {tip.profile && (
                            <>
                                {' '}
                                (
                                <Link style={inlineLink} href={profileUrl}>
                                    Přejít na profil
                                </Link>
                                )
                            </>
                        )}
                    </Text>
                </Section>
            ))}

            <Section style={btnContainer}>
                <Button style={button} href={dashboardUrl}>
                    Upravit moji nabídku
                </Button>
            </Section>

            <Text style={ps}>
                <strong>P.S. Chceš víc dosahu?</strong> Sdílej svoji nabídku do facebookových skupin a označ nás ve
                story (@swapper.cz na Instagramu, @swapper_cz na TikToku) – přesdílíme ji.
            </Text>

            <Text style={helpNote}>Něco nejde? Odpověz na tento e-mail, rád pomůžu.</Text>

            <Text style={signature}>
                Držím palce!
                <br />
                Jiří, zakladatel
            </Text>

            <Hr style={hr} />
            <Text style={footerNote}>
                Tento tip posíláme aktivním prodejcům na {footerEvent}.{' '}
                <Link href="{{{unsubscribe_preferences}}}" style={footerLink}>
                    Odhlásit odběr
                </Link>
            </Text>
        </SwapperLayout>
    );
};

export default SellerTipsEmail;

const heading = {
    color: '#242140',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '32px',
    margin: '0 0 20px',
};

const paragraph = {
    color: '#242140',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 16px',
    textAlign: 'left' as const,
};

const tipRow = {
    margin: '0 0 18px',
};

const tipHeaderText = {
    margin: '0 0 6px',
    lineHeight: '26px',
};

const tipNumber = {
    display: 'inline-block',
    width: '26px',
    height: '26px',
    marginRight: '12px',
    backgroundColor: '#8e84ff',
    color: '#ffffff',
    borderRadius: '9999px',
    fontSize: '14px',
    fontWeight: '700',
    lineHeight: '26px',
    textAlign: 'center' as const,
    verticalAlign: 'middle',
};

const tipTitle = {
    color: '#242140',
    fontSize: '16px',
    fontWeight: '700',
    verticalAlign: 'middle',
};

const tipBody = {
    color: '#242140',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 0 38px',
    textAlign: 'left' as const,
};

const inlineLink = {
    color: '#6b7280',
    fontWeight: '400',
    textDecoration: 'underline',
};

const btnContainer = {
    textAlign: 'center' as const,
    margin: '32px 0 24px',
};

const button = {
    backgroundColor: '#241AA1',
    borderRadius: '9999px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 32px',
};

const ps = {
    color: '#4b5563',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 16px',
    textAlign: 'left' as const,
};

const helpNote = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 16px',
    textAlign: 'left' as const,
};

const signature = {
    color: '#242140',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 16px',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '32px 0 24px',
};

const footerNote = {
    color: '#8898aa',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0',
};

const footerLink = {
    color: '#8898aa',
    textDecoration: 'underline',
};
