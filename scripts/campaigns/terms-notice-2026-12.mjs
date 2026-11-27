// Legal notice: new terms and conditions from 10. 12. 2026 (art. 9.2 of the
// terms requires it ≥ 15 days ahead). Goes to every registered user.

export default {
    subject: 'Aktualizace obchodních podmínek Swapperu od 10. 12. 2026',
    // Exported React Email template in out/ (source: emails/terms-notice-2026-12.tsx).
    html: 'terms-notice-2026-12.html',
    // Plain-text part, next to this file. Every line of it must also be in the HTML.
    text: 'terms-notice-2026-12.txt',
    attachments: [
        {
            path: 'assets/obchodni-podminky-2026-12.pdf',
            filename: 'obchodni-podminky.pdf',
            type: 'application/pdf',
        },
    ],
    audience: 'all-users',
    // A legal notice: no open or click tracking, no unsubscribe footer, no UTM tags.
    tracking: false,
    // Last day the notice must reach users (15 days before the terms take effect).
    deadline: '2026-11-25',
};
