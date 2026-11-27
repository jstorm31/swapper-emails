import { Hr, Link, Section, Text } from '@react-email/components';
import { GENERAL_TERMS_URL } from './components/PostOrderComponents';
import { SwapperLayout } from './components/SwapperLayout';

// One-time legal notice: new terms and conditions from 10. 12. 2026 (art. 9.2).
// Sent by scripts/send-campaign.mjs (campaign terms-notice-2026-12) through the Mail Send API, not as a
// SendGrid dynamic template, so it has no Handlebars and no unsubscribe link.
// The wording is approved by the owner — keep it verbatim. The plain-text part in
// scripts/campaigns/terms-notice-2026-12.txt must say the same thing; the send
// script refuses to send when a line of it is missing from this HTML.

const PREVIOUS_TERMS_URL = `${GENERAL_TERMS_URL}/2026-04`;
const PROFILE_URL = 'https://www.swapper.cz/profil';

const changes = [
    'Když pořadatel akci zruší bez náhradního termínu a vrací vstupné, nákup zrušíme. Kupující dostane zpět celou částku včetně našeho poplatku a poplatku za Swapper Garanci.',
    'Vstupné pořadatel vrací prodejci. Pokud jsme mu už peníze z prodeje vyplatili, vrátí nám je do 14 dnů od naší výzvy a my je do 3 pracovních dnů pošleme kupujícímu.',
    'Peníze jdou vždy přes Swapper. Prodejce a kupující si je mezi sebou neposílají.',
    'Když pořadatel vstupné nevrací nebo se akce přesune na jiný termín či místo, nákup platí dál.',
];

export const TermsNotice202612Email = () => {
    return (
        <SwapperLayout previewText="Přibyl v nich článek 4.9 o zrušených akcích.">
            <Text style={paragraph}>Ahoj,</Text>

            <Text style={paragraph}>
                od 10. 12. 2026 platí nové obchodní podmínky Swapperu. Přibyl v nich článek 4.9 o zrušených akcích:
            </Text>

            <Section style={list}>
                {changes.map((item) => (
                    <table key={item} role="presentation" cellPadding={0} cellSpacing={0} style={listRow}>
                        <tbody>
                            <tr>
                                <td style={bulletCell}>•</td>
                                <td style={listText}>{item}</td>
                            </tr>
                        </tbody>
                    </table>
                ))}
            </Section>

            <Text style={paragraph}>Opravili jsme také údaj o zápisu v obchodním rejstříku. Nic jiného se nemění.</Text>

            <Text style={paragraph}>
                Nové podmínky najdeš v příloze a na{' '}
                <Link style={anchor} href={GENERAL_TERMS_URL}>
                    {GENERAL_TERMS_URL}
                </Link>
                .
                <br />
                Dosavadní znění:{' '}
                <Link style={anchor} href={PREVIOUS_TERMS_URL}>
                    {PREVIOUS_TERMS_URL}
                </Link>
            </Text>

            <Text style={paragraph}>
                Pokud s novými podmínkami nesouhlasíš, smaž si do 9. 12. 2026 účet na{' '}
                <Link style={anchor} href={PROFILE_URL}>
                    {PROFILE_URL}
                </Link>
                . Když budeš Swapper používat i od 10. 12. 2026, platí pro tebe nové podmínky.
            </Text>

            <Text style={paragraph}>S otázkami odpověz na tenhle email.</Text>

            <Text style={paragraph}>— Tým Swapper</Text>

            <Hr style={hr} />

            <Text style={footer}>
                Provozovatel služby: Swapper s.r.o., Školská 660/3, Nové Město, 110 00 Praha 1 · IČO 17945925 · Spisová
                značka C 452209, Městský soud v Praze
            </Text>
        </SwapperLayout>
    );
};

export default TermsNotice202612Email;

const paragraph = {
    color: '#242140',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 16px',
    textAlign: 'left' as const,
};

const list = {
    margin: '0 0 16px',
};

const listRow = {
    width: '100%',
    margin: '0 0 10px',
};

const bulletCell = {
    width: '20px',
    verticalAlign: 'top' as const,
    color: '#241AA1',
    fontSize: '16px',
    lineHeight: '26px',
};

const listText = {
    color: '#242140',
    fontSize: '16px',
    lineHeight: '26px',
    textAlign: 'left' as const,
};

const anchor = {
    color: '#241AA1',
    textDecoration: 'underline',
    wordBreak: 'break-all' as const,
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '24px 0 16px',
};

const footer = {
    color: '#6b6880',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0',
    textAlign: 'left' as const,
};
