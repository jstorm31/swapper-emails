import { Button, Hr, Link, Section, Text } from '@react-email/components';
import { SwapperLayout } from './components/SwapperLayout';

interface SwapperTransactionalEmailProps {
    title: string;
    message: string;
    actionLabel?: string;
    actionUrl?: string;
    supportEmail?: string;
}

export const SwapperTransactionalEmail = ({
    title,
    message,
    actionLabel,
    actionUrl,
    supportEmail = 'podpora@swapper.cz',
}: SwapperTransactionalEmailProps) => {
    return (
        <SwapperLayout previewText={title}>
            <Text style={heading}>{title}</Text>

            <Text style={paragraph}>{message}</Text>

            {actionLabel && actionUrl && (
                <Section style={btnContainer}>
                    {/* Full Rounded Button using Primary Color */}
                    <Button style={button} href={actionUrl}>
                        {actionLabel}
                    </Button>
                </Section>
            )}

            <Hr style={hr} />

            <Text style={paragraph}>
                Pokud máte jakékoliv dotazy, odpovězte na tento e-mail nebo nás kontaktujte na{' '}
                <Link style={anchor} href={`mailto:${supportEmail}`}>
                    {supportEmail}
                </Link>
                .
            </Text>

            <Text style={paragraph}>
                S pozdravem,
                <br />
                Tým Swapper
            </Text>
        </SwapperLayout>
    );
};

SwapperTransactionalEmail.PreviewProps = {
    title: 'Potvrďte svou e-mailovou adresu',
    message: 'Vítejte ve Swapperu! Klikněte na tlačítko níže pro ověření vaší e-mailové adresy a nastavení účtu.',
    actionLabel: 'Ověřit e-mail',
    actionUrl: 'https://www.swapper.cz/verify',
} satisfies SwapperTransactionalEmailProps;

export default SwapperTransactionalEmail;

const heading = {
    color: '#242140', // Text color
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '32px',
    margin: '0 0 20px',
};

const paragraph = {
    color: '#242140', // Text color
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 24px',
    textAlign: 'left' as const,
};

const btnContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#241AA1', // Primary color
    borderRadius: '9999px', // Full rounded corners
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 32px',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '32px 0 24px',
};

const anchor = {
    color: '#241AA1', // Primary color
    textDecoration: 'none',
};
