import { Button, Hr, Link, Section, Text } from '@react-email/components';
import { SwapperLayout } from './components/SwapperLayout';

export const SurveyRenegadesEmail = () => {
    return (
        <SwapperLayout previewText="Vyhrajte 2 lístky na Rock for People 2026 🤘">
            <Text style={heading}>Vyhrajte lístky na Rock for People 2026 🤘</Text>

            <Text style={paragraph}>
                <strong>Hrajeme o 2 vstupy na celé 4 dny festivalu!</strong>
            </Text>

            <Text style={paragraph}>
                Zkusili jste Swapper, ale nákup ani prodej jste nakonec nedokončili. Věnujte nám necelou minutu, řekněte
                nám proč, a automaticky vás zařadíme do slosování.
            </Text>

            <Section style={btnContainer}>
                <Button style={button} href="https://www.swapper.cz/raffle-2026?segment=renegade">
                    Vyplnit a soutěžit (3 minuty)
                </Button>
            </Section>

            <Hr style={hr} />
            <Text style={footerNote}>
                Vítěze vylosujeme náhodně a budeme ho kontaktovat na tento e-mail.{' '}
                <Link href="https://www.swapper.cz/raffle-2026-terms" style={footerLink}>
                    Podmínky soutěže
                </Link>
            </Text>
        </SwapperLayout>
    );
};

export default SurveyRenegadesEmail;

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
