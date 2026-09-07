import { SITE_URL } from "./env.js";

/** Yemek adını title case'e çevirir */
export function toTitleCase(str: string): string {
    return str
        .toLocaleLowerCase("tr-TR")
        .replace(/(^|\s)\S/g, (char) => char.toLocaleUpperCase("tr-TR"));
}

/** E-posta adresini maskeler: u***@gmail.com */
export function maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!local || !domain) return "***";
    const masked = local.charAt(0) + "***";
    return `${masked}@${domain}`;
}

/**
 * Kullanıcı adı OAuth profilinden gelir, yemek adı scraper'dan — ikisi de
 * şablona ham girmemeli. lib/mail.ts ile aynı kaçış.
 */
export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** Yemek/malzeme adı: önce title case, sonra kaçış. Şablonlarda hep bu kullanılır. */
export function safeTitle(raw: string): string {
    return escapeHtml(toTitleCase(raw));
}

interface EmailShellOptions {
    /** Mailin başlığı — konu satırıyla aynı tonda olmalı */
    heading: string;
    date: string;
    userName: string;
    /** Selamlamadan sonraki giriş cümlesi */
    intro: string;
    /** Asıl içerik (liste, uyarı kutuları...) */
    body: string;
    /** hr altındaki açıklama/opt-out paragrafları */
    footer: string;
}

/**
 * Tüm bildirim maillerinin ortak iskeleti. Kanallar yalnızca kendi gövdesini
 * yazar; kapsayıcı, selamlama, CTA ve ayraç burada tek yerde durur ki iki
 * mail zamanla birbirinden görsel olarak ayrışmasın.
 */
export function emailShell({
    heading,
    date,
    userName,
    intro,
    body,
    footer,
}: EmailShellOptions): string {
    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h3 style="color: #1a1a1a; margin-bottom: 4px;">${heading}</h3>
        <p style="color: #666; font-size: 13px; margin-top: 0;">${escapeHtml(date)}</p>

        <p style="color: #333; font-size: 14px;">
            Merhaba <strong>${escapeHtml(userName)}</strong>,
        </p>

        <p style="color: #333; font-size: 14px;">
            ${intro}
        </p>

        ${body}

        <a href="${SITE_URL}" style="display: inline-block; background: #18181b; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500; margin-top: 16px;">
            Menüyü Görüntüle
        </a>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

        ${footer}
    </div>
    `;
}
