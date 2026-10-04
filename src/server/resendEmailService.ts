import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Allow opt-in bypass only if explicitly requested for corporate/antivirus SSL proxies
if (process.env.ALLOW_SELF_SIGNED_CERTS === 'true' || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

function formatEmailTimestamp(date: Date): string {
  const formatted = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date);
  return `${formatted} UTC`;
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

export interface SendResetEmailOptions {
  to: string;
  fullName: string;
  resetUrl: string;
  otpCode: string;
  expiresMinutes?: number;
  sentAt?: Date;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mode: 'resend_live' | 'dev_fallback';
}

/**
 * Cleans and returns a configured Resend client instance if RESEND_API_KEY is present
 */
function getResendClient(): Resend | null {
  const apiKey = (process.env.RESEND_API_KEY || '').replace(/['"]/g, '').trim();
  if (!apiKey || apiKey === 're_your_api_key_here' || apiKey.length < 5) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Normalizes and validates the sender email address format
 */
export function normalizeFromEmail(rawFrom?: string): string {
  let from = (rawFrom || '').replace(/['"]/g, '').trim();
  if (!from) {
    // Fallback pulled from environment — never hardcoded
    return process.env.RESEND_FROM_EMAIL?.replace(/['"]/g, '').trim() || 'noreply@noreply.anywhereroles.in';
  }

  // Handle case where user provided raw domain: "noreply.anywhereroles.in"
  if (from === 'noreply.anywhereroles.in') {
    return `inaquired <noreply@${from}>`;
  }

  // Handle format like "inaquired <noreply.anywhereroles.in>" missing '@'
  if (from.includes('<') && from.includes('>') && !from.includes('@')) {
    const match = from.match(/^(.*)<([^>]+)>(.*)$/);
    if (match) {
      const namePart = match[1].trim() || 'inaquired';
      const domainPart = match[2].trim();
      return `${namePart} <noreply@${domainPart}>`;
    }
  }

  // If user provided noreply@anywhereroles.in without the verified subdomain
  if (from.includes('@anywhereroles.in') && !from.includes('@noreply.anywhereroles.in')) {
    from = from.replace('@anywhereroles.in', '@noreply.anywhereroles.in');
  }

  // Handle bare domain like "noreply.anywhereroles.in" missing '@'
  if (!from.includes('@')) {
    return `inaquired <noreply@${from}>`;
  }

  return from;
}

/**
 * Builds the responsive HTML email template for password recovery
 */
export function buildPasswordResetHtml(options: SendResetEmailOptions): string {
  const safeOtpCode = escapeHtml(options.otpCode);
  const expiresMinutes = options.expiresMinutes || 30;
  const sentAt = options.sentAt || new Date();
  const expiresAt = new Date(sentAt.getTime() + expiresMinutes * 60_000);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inaquired admin account recovery</title>
</head>
<body style="margin:0;background:#f8fafc;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="padding:32px 16px;">
    <div style="max-width:400px;margin:0 auto;overflow:hidden;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <div style="padding:20px;background:#312e81;text-align:center;color:#fff;font-size:20px;font-weight:800;">inaquired</div>
      <div style="padding:28px 24px;text-align:center;">
        <h1 style="margin:0 0 8px;color:#0f172a;font-size:18px;">Admin account recovery</h1>
        <p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.5;">Use this code to reset your Inaquired administrator password. If you did not request a reset, you can ignore this email.</p>
        <div style="padding:20px 16px;border:1px solid #e0e7ff;border-radius:12px;background:#f5f3ff;color:#4338ca;font-family:Consolas,monospace;font-size:36px;font-weight:800;letter-spacing:10px;">
          ${safeOtpCode}
        </div>
        <p style="margin:16px 0 0;color:#64748b;font-size:12px;">Requested: ${formatEmailTimestamp(sentAt)}</p>
        <p style="margin:4px 0 0;color:#64748b;font-size:12px;">Expires: ${formatEmailTimestamp(expiresAt)} (${expiresMinutes} minutes)</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches a password recovery email using Resend API (or logs in dev fallback)
 */
export async function sendPasswordResetEmail(options: SendResetEmailOptions): Promise<SendEmailResult> {
  const resend = getResendClient();
  const fromEmail = normalizeFromEmail(process.env.RESEND_FROM_EMAIL);
  const emailOptions = { ...options, sentAt: options.sentAt || new Date() };
  const htmlContent = buildPasswordResetHtml(emailOptions);
  const expiresAt = new Date(emailOptions.sentAt.getTime() + (options.expiresMinutes || 30) * 60_000);
  const textContent = `Inaquired admin account recovery\nUse this code to reset your administrator password: ${options.otpCode}\nIf you did not request a reset, ignore this email.\nRequested: ${formatEmailTimestamp(emailOptions.sentAt)}\nExpires: ${formatEmailTimestamp(expiresAt)} (${options.expiresMinutes || 30} minutes).`;
  const subject = 'Inaquired admin password recovery code';

  // If Resend API Key is available, dispatch live email via Resend
  if (resend) {
    try {
      console.log(`[Resend] Dispatching password reset email to: ${options.to} from: ${fromEmail}`);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        console.error('[Resend Error]', error);
        const isCert = error.message?.includes('certificate') || error.message?.includes('CERT');
        if (isCert) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Resend Dev Fallback] Password reset email was not delivered:', error.message);
          return {
            success: false,
            mode: 'dev_fallback',
            error: error.message
          };
        }
        return {
          success: false,
          error: error.message,
          mode: 'resend_live'
        };
      }

      console.log(`[Resend Success] Email sent successfully. Message ID: ${data?.id}`);
      return {
        success: true,
        messageId: data?.id,
        mode: 'resend_live'
      };
    } catch (err: any) {
      console.error('[Resend Exception]', err);
      const isCert = (err.message && (err.message.includes('certificate') || err.message.includes('self-signed'))) || err.code === 'SELF_SIGNED_CERT_IN_CHAIN';
      if (isCert) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        try {
          console.log('[Resend Retry] Retrying password reset dispatch with TLS validation bypass...');
          const retryRes = await resend.emails.send({
            from: fromEmail,
            to: options.to,
            subject,
            html: htmlContent,
            text: textContent,
          });
          if (!retryRes.error) {
            return { success: true, messageId: retryRes.data?.id, mode: 'resend_live' };
          }
        } catch {}
      }

      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Resend Dev Fallback] Password reset email was not delivered.');
        return {
          success: false,
          mode: 'dev_fallback',
          error: err.message
        };
      }

      return {
        success: false,
        error: isCert ? 'SSL certificate inspection error with email provider. Check proxy settings.' : (err.message || 'Failed to dispatch email via Resend API'),
        mode: 'resend_live'
      };
    }
  }

  // Developer Fallback (when RESEND_API_KEY is not yet populated in .env)
  console.warn('[Email Delivery] RESEND_API_KEY is not configured; password reset email was not delivered.');

  return {
    success: false,
    mode: 'dev_fallback',
    error: 'Email delivery is not configured.'
  };
}

export interface SendTwoFactorEmailOptions {
  to: string;
  fullName?: string;
  otpCode: string;
  expiresMinutes?: number;
  sentAt?: Date;
}

/**
 * Builds the responsive HTML email template for 2FA Verification Codes
 */
export function buildTwoFactorEmailHtml(options: SendTwoFactorEmailOptions): string {
  const safeOtpCode = escapeHtml(options.otpCode);
  const expiresMinutes = options.expiresMinutes || 10;
  const sentAt = options.sentAt || new Date();
  const expiresAt = new Date(sentAt.getTime() + expiresMinutes * 60_000);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inaquired admin sign-in verification</title>
  <style>
    body {
      margin: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      padding: 32px 16px;
    }
    .card {
      max-width: 400px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);
      overflow: hidden;
    }
    .header {
      background: #312e81;
      padding: 22px 24px;
      text-align: center;
    }
    .brand-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      margin: 0;
    }
    .body {
      padding: 28px 24px;
      text-align: center;
    }
    .otp-container {
      background: #f5f3ff;
      border: 1px solid #e0e7ff;
      border-radius: 12px;
      padding: 20px 16px;
    }
    .otp-digits {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #4338ca;
      margin: 0;
      padding-left: 10px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand-title">inaquired</h1>
      </div>
      <div class="body">
        <h1 style="margin:0 0 8px;color:#0f172a;font-size:18px;">Admin sign-in verification</h1>
        <p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.5;">Use this code to complete your Inaquired administrator sign-in. If you did not try to sign in, do not share this code and secure your account.</p>
        <div class="otp-container">
          <div class="otp-digits">${safeOtpCode}</div>
        </div>
        <p style="margin: 16px 0 0; color: #64748b; font-size: 12px;">
          Requested: ${formatEmailTimestamp(sentAt)}
        </p>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">
          Expires: ${formatEmailTimestamp(expiresAt)} (${expiresMinutes} minutes)
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends a 2FA Verification Email using Resend
 */
export async function sendTwoFactorEmail(options: SendTwoFactorEmailOptions): Promise<SendEmailResult> {
  const resend = getResendClient();
  const fromEmail = normalizeFromEmail(process.env.RESEND_FROM_EMAIL);
  const emailOptions = { ...options, sentAt: options.sentAt || new Date() };
  const htmlContent = buildTwoFactorEmailHtml(emailOptions);
  const expiresAt = new Date(emailOptions.sentAt.getTime() + (options.expiresMinutes || 10) * 60_000);
  const textContent = `Inaquired admin sign-in verification\nUse this code to complete your administrator sign-in: ${options.otpCode}\nIf you did not try to sign in, do not share this code and secure your account.\nRequested: ${formatEmailTimestamp(emailOptions.sentAt)}\nExpires: ${formatEmailTimestamp(expiresAt)} (${options.expiresMinutes || 10} minutes).`;
  const subject = 'Inaquired admin sign-in verification code';

  if (resend) {
    try {
      console.log(`[Resend] Dispatching 2FA verification email to: ${options.to} from: ${fromEmail}`);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        console.error('[Resend Error]', error);
        const isCert = error.message?.includes('certificate') || error.message?.includes('CERT');
        if (isCert) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Resend Dev Fallback] Two-factor email was not delivered:', error.message);
          return {
            success: false,
            mode: 'dev_fallback',
            error: error.message
          };
        }
        return {
          success: false,
          error: error.message,
          mode: 'resend_live'
        };
      }

      console.log(`[Resend Success] 2FA Email sent successfully. Message ID: ${data?.id}`);
      return {
        success: true,
        messageId: data?.id,
        mode: 'resend_live'
      };
    } catch (err: any) {
      console.error('[Resend Exception]', err);
      const isCert = (err.message && (err.message.includes('certificate') || err.message.includes('self-signed'))) || err.code === 'SELF_SIGNED_CERT_IN_CHAIN';
      if (isCert) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        try {
          console.log('[Resend Retry] Retrying 2FA email dispatch with TLS validation bypass...');
          const retryRes = await resend.emails.send({
            from: fromEmail,
            to: options.to,
            subject,
            html: htmlContent,
            text: textContent,
          });
          if (!retryRes.error) {
            return { success: true, messageId: retryRes.data?.id, mode: 'resend_live' };
          }
        } catch {}
      }

      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Resend Dev Fallback] Two-factor email was not delivered.');
        return {
          success: false,
          mode: 'dev_fallback',
          error: err.message
        };
      }

      return {
        success: false,
        error: isCert ? 'SSL certificate inspection error with email provider. Check proxy settings.' : (err.message || 'Failed to dispatch 2FA email via Resend API'),
        mode: 'resend_live'
      };
    }
  }

  // Fallback for local development if Resend API key is not present
  return {
    success: false,
    mode: 'dev_fallback',
    error: 'Email delivery is not configured.',
  };
}
