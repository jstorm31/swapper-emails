import { Body, Column, Container, Head, Hr, Html, Link, Preview, Row, Section, Text } from '@react-email/components';
import * as React from 'react';
import { v } from './components/DirectComponents';

// Case 8 — Ops: manual action request. Internal email to the operator. Two modes,
// discriminated by `reasonCode`:
//
//  · REFUND (LoveID auto-cancel / dispute): NO_SEND_24H | NO_CONFIRM_14D |
//    DISPUTE_REVERSAL → refund now in the gateway portal (ops-manual, ADR 0002).
//  · ESCALATION (NFCTron timeouts): ESCALATION_NO_SEND | ESCALATION_NO_CONFIRM →
//    a deadline lapsed but NFCTron has no auto-cancel/refund — this is "review
//    this, DON'T refund yet." Ops investigate and decide. See ADR 0003.
//
// Same template so there is one ops inbox surface; the intro + steps branch on
// whether the code is an escalation. Deliberately a stripped, scannable internal
// layout — no customer masthead, no marketing footer, no tykání.
interface DirectRefundOpsRequestEmailProps {
    orderId?: string;
    amount?: string;
    buyerEmail?: string;
    paymentExternalId?: string;
    gateway?: string;
    reasonCode?: string;
    eventName?: string;
}

export const DirectRefundOpsRequestEmail = (props: DirectRefundOpsRequestEmailProps) => {
    const orderId = v(props.orderId, 'orderId');
    const amount = v(props.amount, 'amount');
    const buyerEmail = v(props.buyerEmail, 'buyerEmail');
    const paymentExternalId = v(props.paymentExternalId, 'paymentExternalId');
    const gateway = v(props.gateway, 'gateway');
    const eventName = v(props.eventName, 'eventName');

    const field = (label: string, value: string, mono = false) => (
        <Row style={fieldRow}>
            <Column style={fieldLabel}>{label}</Column>
            <Column style={mono ? fieldValueMono : fieldValue}>{value}</Column>
        </Row>
    );

    // SendGrid {{#equals}} is exact-match only (no OR), so gate the escalation-vs-
    // refund copy by nesting both escalation codes around the same node. The
    // escalation node is authored once and reused in both branches; only the
    // exported HTML duplicates it. `refundNode` is the {{else}} default, so legacy
    // refund-only sends (and any unknown code) render the refund flow.
    const escalationOr = (escalationNode: React.ReactNode, refundNode: React.ReactNode) => (
        <>
            {`{{#equals reasonCode "ESCALATION_NO_SEND"}}`}
            {escalationNode}
            {`{{else}}`}
            {`{{#equals reasonCode "ESCALATION_NO_CONFIRM"}}`}
            {escalationNode}
            {`{{else}}`}
            {refundNode}
            {`{{/equals}}`}
            {`{{/equals}}`}
        </>
    );

    const escalationIntro = (
        <>
            <Text style={heading}>Vyžaduje pozornost — zatím nerefunduj</Text>
            <Text style={lead}>
                U objednávky níže vypršel časový limit (NFCTron). Nic se nestalo automaticky — <strong>nerefunduj hned</strong>,
                nejdřív prošetři situaci s prodejcem/kupujícím a rozhodni o dalším postupu.
            </Text>
        </>
    );
    const refundIntro = (
        <>
            <Text style={heading}>Manuální refundace — akce v portálu</Text>
            <Text style={lead}>
                U objednávky níže je potřeba provést refundaci ručně v portálu brány a poté objednávku označit jako
                vyřízenou.
            </Text>
        </>
    );

    const escalationSteps = (
        <>
            <Text style={checklistHeading}>Postup</Text>
            <Text style={checklistItem}>1. Ověř stav u prodejce i kupujícího podle důvodu výše.</Text>
            <Text style={checklistItem}>
                2. Rozhodni: doručení dokončit, prodloužit lhůtu, nebo objednávku {orderId} vrátit.
            </Text>
            <Text style={checklistItem}>
                3. Teprve při domluvě na vrácení refunduj {amount} v portálu {gateway} a označ objednávku jako
                vyřízenou.
            </Text>
        </>
    );
    const refundSteps = (
        <>
            <Text style={checklistHeading}>Postup</Text>
            <Text style={checklistItem}>1. Otevři transakci {paymentExternalId} v portálu {gateway}.</Text>
            <Text style={checklistItem}>2. Vrať částku {amount} kupujícímu.</Text>
            <Text style={checklistItem}>
                3. Označ objednávku {orderId} ve Swapperu jako refundovanou / vyřízenou.
            </Text>
        </>
    );

    return (
        <Html lang="cs">
            <Head />
            <Preview>
                Swapper Direct OPS — objednávka {orderId}, {amount}
            </Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={headerText}>Swapper Direct · OPS</Text>
                    </Section>

                    <Section style={content}>
                        {escalationOr(escalationIntro, refundIntro)}

                        <Section style={adminBtnWrap}>
                            <Link style={adminBtn} href={`https://admin.swapper.cz/order/${orderId}`}>
                                Otevřít objednávku v adminu →
                            </Link>
                        </Section>

                        {/* Human-readable reason (mapped from reasonCode). */}
                        <Section style={reasonBox}>
                            <Text style={reasonLabel}>Důvod</Text>
                            <Text style={reasonValue}>
                                {`{{#equals reasonCode "NO_SEND_24H"}}`}Prodejce neodeslal vstupenky do 24 h
                                {`{{else}}`}
                                {`{{#equals reasonCode "NO_CONFIRM_14D"}}`}Kupující nepotvrdil přijetí do 14 dní
                                {`{{else}}`}
                                {`{{#equals reasonCode "DISPUTE_REVERSAL"}}`}Reverzace sporu (dispute)
                                {`{{else}}`}
                                {`{{#equals reasonCode "ESCALATION_NO_SEND"}}`}NFCTron: prodejce nevložil odkaz na vstupenku do 24 h
                                {`{{else}}`}
                                {`{{#equals reasonCode "ESCALATION_NO_CONFIRM"}}`}NFCTron: kupující nevyzvedl vstupenku do 14 dní
                                {`{{else}}`}
                                {`{{reasonCode}}`}
                                {`{{/equals}}`}
                                {`{{/equals}}`}
                                {`{{/equals}}`}
                                {`{{/equals}}`}
                                {`{{/equals}}`}
                            </Text>
                            <Text style={reasonCodeMuted}>
                                Kód: <span style={codeInline}>{`{{reasonCode}}`}</span>
                            </Text>
                        </Section>

                        <Hr style={hr} />

                        {field('Objednávka', orderId)}
                        {field('Událost', eventName)}
                        {field('Částka', amount)}
                        {field('Kupující', buyerEmail, true)}
                        {field('ID platby (brána)', paymentExternalId, true)}
                        {field('Platební brána', gateway)}

                        <Hr style={hr} />

                        {escalationOr(escalationSteps, refundSteps)}

                        <Text style={footnote}>
                            Automaticky generováno pro Swapper Direct. Neodpovídej na tento e-mail.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

DirectRefundOpsRequestEmail.PreviewProps = {
    orderId: '12345',
    amount: '1 712 Kč',
    buyerEmail: 'kupujici@email.cz',
    paymentExternalId: 'gpwp_8f2c1a9e',
    gateway: 'GP webpay',
    reasonCode: 'ESCALATION_NO_SEND',
    eventName: 'Lucie ve Foru',
} satisfies DirectRefundOpsRequestEmailProps;

export default DirectRefundOpsRequestEmail;

// ── styles (internal tool look — not the customer brand) ────────────────────
const main = {
    backgroundColor: '#f1f5f9',
    margin: '0',
    padding: '24px 12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    margin: '0 auto',
    maxWidth: '560px',
    overflow: 'hidden',
};

const header = {
    backgroundColor: '#241AA1',
    padding: '12px 20px',
};

const headerText = {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700' as const,
    letterSpacing: '0.5px',
    margin: '0',
};

const content = {
    padding: '24px 20px',
};

const heading = {
    color: '#0f172a',
    fontSize: '20px',
    fontWeight: '700' as const,
    lineHeight: '28px',
    margin: '0 0 8px',
};

const lead = {
    color: '#475569',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 16px',
};

const adminBtnWrap = {
    margin: '0 0 20px',
};

const adminBtn = {
    display: 'inline-block',
    backgroundColor: '#241AA1',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600' as const,
    textDecoration: 'none',
    borderRadius: '6px',
    padding: '9px 18px',
};

const reasonBox = {
    backgroundColor: '#f3f1ff',
    border: '1px solid #d9d4ff',
    borderRadius: '6px',
    padding: '12px 16px',
    margin: '0 0 4px',
};

const reasonLabel = {
    color: '#241AA1',
    fontSize: '11px',
    fontWeight: '700' as const,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    margin: '0 0 4px',
};

const reasonValue = {
    color: '#0f172a',
    fontSize: '16px',
    fontWeight: '600' as const,
    lineHeight: '22px',
    margin: '0 0 6px',
};

const reasonCodeMuted = {
    color: '#64748b',
    fontSize: '12px',
    margin: '0',
};

const codeInline = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    padding: '1px 5px',
};

const fieldRow = {
    margin: '0 0 8px',
};

const fieldLabel = {
    color: '#64748b',
    fontSize: '13px',
    lineHeight: '20px',
    width: '40%',
    verticalAlign: 'top' as const,
};

const fieldValue = {
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: '600' as const,
    lineHeight: '20px',
    textAlign: 'right' as const,
};

const fieldValueMono = {
    ...fieldValue,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontWeight: '500' as const,
    wordBreak: 'break-all' as const,
};

const checklistHeading = {
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: '700' as const,
    letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    margin: '0 0 8px',
};

const checklistItem = {
    color: '#334155',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 4px',
};

const footnote = {
    color: '#94a3b8',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '20px 0 0',
};

const hr = {
    borderColor: '#e2e8f0',
    margin: '16px 0',
};
