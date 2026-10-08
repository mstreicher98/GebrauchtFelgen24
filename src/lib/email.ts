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
    ? `<p style="margin:28px 0"><a href="${opts.cta.url}" style="background:#0d47a1;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px;display:inline-block">${escapeHtml(opts.cta.label)}</a></p>
       <p style="font-size:12px;color:#5f697c">Falls der Button nicht funktioniert: <br><a href="${opts.cta.url}" style="color:#0d47a1;word-break:break-all">${opts.cta.url}</a></p>`
    : "";
  return `<!doctype html><html lang="de"><body style="margin:0;background:#eef2f8;font-family:Arial,Helvetica,sans-serif;color:#0b0e14">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
  <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#06080c;padding:22px 28px;color:#f2f5fa;font-size:20px;font-weight:800;letter-spacing:.3px;line-height:1">
      GebrauchtFelgen<span style="color:#5b93ff">24</span>
    </td></tr>
    <tr><td style="padding:28px">
      <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(opts.title)}</h1>
      <div style="font-size:15px;line-height:1.6">${opts.bodyHtml}</div>
      ${cta}
    </td></tr>
    <tr><td style="padding:18px 28px;background:#f5f7fb;font-size:12px;color:#5f697c">
      ${opts.footerNote ? escapeHtml(opts.footerNote) + "<br>" : ""}
      ${env.appName} · <a href="${env.appUrl}" style="color:#5f697c">${env.appUrl.replace(/^https?:\/\//, "")}</a> ·
      <a href="${env.appUrl}/konto/einstellungen" style="color:#5f697c">Benachrichtigungen verwalten</a>
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
