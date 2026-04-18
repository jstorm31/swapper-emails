import { Body, Container, Head, Html, Link, Preview, Text } from '@react-email/components';

interface IncompleteListingReminderEmailProps {
    firstName?: string | null;
    fistName?: string | null;
    listingId?: string | number | null;
    eventId?: string | number | null;
    eventSlug?: string | null;
    eventName?: string | null;
}

export const IncompleteListingReminderEmail = ({
    firstName,
    fistName,
    eventId,
    eventSlug,
    eventName,
}: IncompleteListingReminderEmailProps) => {
    const resolvedFirstName = (firstName ?? fistName ?? '{{firstName}}').trim();
    const hasFirstName = resolvedFirstName.length > 0;
    const resolvedEventName = (eventName ?? '{{eventName}}').trim();
    const hasEventName = resolvedEventName.length > 0;
    const resolvedEventId = String(eventId ?? '{{eventId}}').trim();
    const resolvedEventSlug = String(eventSlug ?? '{{eventSlug}}').trim() || '{{eventSlug}}';
    const listingUrl = `https://www.swapper.cz/udalosti/${resolvedEventId}/${resolvedEventSlug}/prodat-vstupenky/krok/1`;

    return (
        <Html lang="cs">
            <Head />
            <Preview>Můžu pomoct s dokončením nabídky?</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={paragraph}>Zdravím{hasFirstName ? ` ${resolvedFirstName}` : ''},</Text>

                    <Text style={paragraph}>
                        můžu Vám nějak pomoct s dokončením nabídky vstupenky
                        {hasEventName ? ` na ${resolvedEventName}` : ''}?
                    </Text>

                    <Text style={paragraph}>
                        Zabere to 2 minuty:{' '}
                        <Link style={link} href={listingUrl}>
                            dokončit vystavení vstupenky
                        </Link>
                        .
                    </Text>

                    <Text style={paragraph}>
                        Pokud se kdekoliv zaseknete, stačí odpovědět na tento e-mail. Rád pomůžu osobně.
                    </Text>

                    <Text style={ps}>P.S. Swapper už využilo 85 000+ lidí pro nákup a prodej vstupenek.</Text>

                    <Text style={signature}>
                        Mějte se!
                        <br />
                        Michal, zakladatel
                    </Text>

                    <Text style={ps}>
                        <Link style={link} href="{{{unsubscribe_preferences}}}">
                            Odhlásit odběr
                        </Link>
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

IncompleteListingReminderEmail.PreviewProps = {
    firstName: '{{firstName}}',
    listingId: '{{listingId}}',
    eventId: '{{eventId}}',
    eventSlug: '{{eventSlug}}',
    eventName: '{{eventName}}',
} satisfies IncompleteListingReminderEmailProps;

export default IncompleteListingReminderEmail;

const main = {
    backgroundColor: '#f5f6f8',
    margin: '0',
    padding: '24px 12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    margin: '0 auto',
    maxWidth: '560px',
    padding: '24px',
};

const paragraph = {
    color: '#111827',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px',
};

const ps = {
    color: '#4b5563',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 16px',
};

const signature = {
    color: '#111827',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px 0',
};

const link = {
    color: '#8E84FF',
    textDecoration: 'underline',
};