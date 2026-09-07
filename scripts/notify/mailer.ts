import nodemailer from "nodemailer";
import type { OutgoingEmail } from "./types.js";

/**
 * Gönderimler arası minimum boşluk. Sayaç modül seviyesinde tutulur:
 * rate limit KANALLAR ARASI ortaktır, yoksa iki kanal aynı anda Gmail'in
 * limitine yüklenir ve ikisi birden susturulur.
 */
const SEND_INTERVAL_MS = 200;
let lastSentAt = 0;

async function throttle() {
    const wait = SEND_INTERVAL_MS - (Date.now() - lastSentAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastSentAt = Date.now();
}

export interface Mailer {
    send(email: OutgoingEmail): Promise<void>;
}

export function createMailer(opts: {
    user: string;
    pass: string;
    dryRun: boolean;
}): Mailer {
    // Dry run'da transporter hiç kurulmaz: yanlışlıkla gerçek gönderim
    // yapılamayacağını yapı garanti etsin, bir if'e güvenmesin.
    const transporter = opts.dryRun
        ? null
        : nodemailer.createTransport({
              host: "smtp.gmail.com",
              port: 587,
              secure: false,
              auth: { user: opts.user, pass: opts.pass },
          });

    return {
        async send(email) {
            if (!transporter) return;
            await throttle();
            await transporter.sendMail({
                from: `"Çukurova Yemekhane" <${opts.user}>`,
                to: email.to,
                subject: email.subject,
                html: email.html,
            });
        },
    };
}
