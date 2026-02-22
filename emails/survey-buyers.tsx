import { Button, Hr, Link, Section, Text } from '@react-email/components';
import { SwapperLayout } from './components/SwapperLayout';

export const SurveyBuyersEmail = () => {
    return (
        <SwapperLayout previewText="Vyhraj 2 lístky na Rock for People 2026 🤘">
            <Text style={heading}>Vyhraj 2 lístky na Rock for People 2026 🤘</Text>

            <Text style={paragraph}>
                <strong>Hrajeme o 2 vstupy na celé 4 dny festivalu!</strong>
            </Text>

            <Text style={paragraph}>
                Nedávno se ti povedlo pořídit lístek přes Swapper. Jak to šlo? Ohodnoť svůj nákup a automaticky tě
                zařadíme do slosování.
            </Text>

            <Section style={btnContainer}>
                <Button style={button} href="https://www.swapper.cz/raffle-2026?segment=buyer">
                    Vyplnit a soutěžit (3 minuty)
                </Button>
            </Section>

            <Hr style={hr} />
            <Text style={footerNote}>
                Vítěze vylosujeme náhodně a ozveme se mu na tento e-mail.{' '}
                <Link href="https://www.swapper.cz/raffle-2026-terms" style={footerLink}>
                    Podmínky soutěže
                </Link>
            </Text>
        </SwapperLayout>
    );
};

export default SurveyBuyersEmail;

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

const btnContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
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
