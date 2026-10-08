import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";

let transporter: Transporter | null = null;

function getTransporter() {
  if (!env.smtp.host) return null;
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Gebrandetes HTML-Layout für alle E-Mails. `bodyHtml` muss bereits escaped sein. */
export function emailLayout(opts: { title: string; bodyHtml: string; cta?: { label: string; url: string }; footerNote?: string }) {
  const cta = opts.cta
    ? `<p style="margin:28px 0"><a href="${opts.cta.url}" style="background:#d6a84f;color:#0b0b0d;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px;display:inline-block">${escapeHtml(opts.cta.label)}</a></p>
       <p style="font-size:12px;color:#8a8a93">Falls der Button nicht funktioniert: <br><a href="${opts.cta.url}" style="color:#b8892f;word-break:break-all">${opts.cta.url}</a></p>`
    : "";
  return `<!doctype html><html lang="de"><body style="margin:0;background:#f4f2ee;font-family:Arial,Helvetica,sans-serif;color:#1a1a1d">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
  <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#0b0b0d;padding:22px 28px;color:#f3f1ec;font-size:20px;font-weight:700;letter-spacing:.5px">
      Gebraucht<span style="color:#d6a84f">Felgen</span>24
    </td></tr>
    <tr><td style="padding:28px">
      <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(opts.title)}</h1>
      <div style="font-size:15px;line-height:1.6">${opts.bodyHtml}</div>
      ${cta}
    </td></tr>
    <tr><td style="padding:18px 28px;background:#faf9f6;font-size:12px;color:#8a8a93">
      ${opts.footerNote ? escapeHtml(opts.footerNote) + "<br>" : ""}
      ${env.appName} · <a href="${env.appUrl}" style="color:#8a8a93">${env.appUrl.replace(/^https?:\/\//, "")}</a> ·
      <a href="${env.appUrl}/konto/einstellungen" style="color:#8a8a93">Benachrichtigungen verwalten</a>
    </td></tr>
  </table></td></tr></table></body></html>`;
}

export async function sendMail(to: string, subject: string, html: string) {
  const t = getTransporter();
  if (!t) {
    console.info(`[mail] SMTP nicht konfiguriert – E-Mail an ${to}: "${subject}"`);
    const link = html.match(/href="([^"]+(?:token|verify|reset)[^"]*)"/i)?.[1];
    if (link) console.info(`[mail] Link: ${link}`);
    return;
  }
  try {
    await t.sendMail({ from: env.smtp.from, to, subject, html });
  } catch (err) {
    console.error("[mail] Versand fehlgeschlagen", err);
  }
}
