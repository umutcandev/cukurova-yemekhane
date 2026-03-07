import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MODERATOR_EMAIL = process.env.MODERATOR_EMAIL;
const APP_URL = process.env.APP_URL || "https://www.cukurova.app";

interface ReportNotificationData {
    reporterName: string;
    reporterEmail: string;
    commentAuthorName: string;
    commentContent: string;
    reportReason: string;
    menuDate: string;
    commentId: number;
}

/**
 * Escapes HTML special characters to prevent HTML injection in emails.
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Sends a report notification email to the moderator.
 * Reuses the same nodemailer/SMTP pattern from send-favorite-notifications.ts.
 */
export async function sendReportNotification(data: ReportNotificationData): Promise<boolean> {
    if (!SMTP_USER || !SMTP_PASS || !MODERATOR_EMAIL) {
        console.error("❌ SMTP or MODERATOR_EMAIL credentials missing, skipping report email");
        return false;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    // Escape all dynamic values to prevent HTML injection
    const safeAuthorName = escapeHtml(data.commentAuthorName);
    const safeContent = escapeHtml(data.commentContent);
    const safeReporterName = escapeHtml(data.reporterName);
    const safeReporterEmail = escapeHtml(data.reporterEmail);
    const safeReason = escapeHtml(data.reportReason);
    const safeMenuDate = escapeHtml(data.menuDate);

    const html = `
    <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626; margin-bottom: 20px;">Yorum Raporu Bildirimi</h2>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #991b1b;">Raporlanan Yorum</h3>
            <p style="margin: 0; color: #374151;"><strong>Yazar:</strong> ${safeAuthorName}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Menü Tarihi:</strong> ${safeMenuDate}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Yorum ID:</strong> <span style="font-family: monospace; background: #f3f4f6; border: 1px solid #d1d5db; padding: 1px 6px; border-radius: 4px;">#${data.commentId}</span></p>
            <div style="background: white; border-radius: 4px; padding: 12px; margin-top: 8px;">
                <p style="margin: 0; color: #374151; font-style: italic;">"${safeContent}"</p>
            </div>
        </div>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #374151;">Rapor Detayları</h3>
            <p style="margin: 0; color: #374151;"><strong>Raporlayan:</strong> ${safeReporterName} (${safeReporterEmail})</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Sebep:</strong> ${safeReason}</p>
        </div>

        <div style="margin-bottom: 24px;">
            <a href="${APP_URL}/?date=${safeMenuDate}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 8px;">
                Yorumu Görüntüle
            </a>
            <p style="margin: 6px 0 0 0; color: #9ca3af; font-size: 11px;">${APP_URL}/?date=${safeMenuDate}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 8px;">
            Bu bildirimi moderatör olarak aldınız.
        </p>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Çukurova Yemekhane" <${SMTP_USER}>`,
            to: MODERATOR_EMAIL,
            subject: `Yorum Raporu — Menü ${data.menuDate} — #${data.commentId}`,
            html,
        });
        console.log("✅ Report notification email sent to moderator");
        return true;
    } catch (error) {
        console.error("❌ Failed to send report email:", error);
        return false;
    }
}
