import { Body, Container, Font, Head, Html, Img, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

interface SwapperLayoutProps {
    previewText: string;
    children: React.ReactNode;
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';

export const SwapperLayout = ({ previewText, children }: SwapperLayoutProps) => {
    return (
        <Html lang="cs">
            <Head>
                <Font
                    fontFamily="Sofia Pro"
                    fallbackFontFamily="sans-serif"
                    fontWeight={400}
                    fontStyle="normal"
                    webFont={{
                        url: `${baseUrl}/static/fonts/SofiaProRegularAz.woff`,
                        format: 'woff',
                    }}
                />
                <Font
                    fontFamily="Sofia Pro"
                    fallbackFontFamily="sans-serif"
                    fontWeight={300}
                    fontStyle="normal"
                    webFont={{
                        url: `${baseUrl}/static/fonts/SofiaProLightAz.woff`,
                        format: 'woff',
                    }}
                />
                <Font
                    fontFamily="Sofia Pro"
                    fallbackFontFamily="sans-serif"
                    fontWeight={700}
                    fontStyle="normal"
                    webFont={{
                        url: `${baseUrl}/static/fonts/SofiaProBoldAz.woff`,
                        format: 'woff',
                    }}
                />
            </Head>
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Compact Header using Brand Color and Logo */}
                    <Section style={header}>
                        <Img
                            src={`${baseUrl}/static/swapper-logo-full-white.png`}
                            width="140"
                            height="auto"
                            alt="Swapper"
                            style={logoImg}
                        />
                    </Section>

                    <Section style={content}>{children}</Section>

                    <Section style={footer}>
                        <Text style={footerText}>Swapper: bezpečné tržiště se vstupenkami</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default SwapperLayout;

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '"Sofia Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '0',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    marginBottom: '64px',
    marginTop: '40px',
    maxWidth: '600px',
};

const header = {
    padding: '8px 24px', // Reduced padding for a more compact design
    backgroundColor: '#8e84ff', // Brand color
    textAlign: 'center' as const,
};

const logoImg = {
    display: 'block',
    margin: '0 auto',
};

const content = {
    padding: '32px 16px',
};

const footer = {
    padding: '0 32px 16px',
    textAlign: 'center' as const,
};

const footerText = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    margin: '0',
};
