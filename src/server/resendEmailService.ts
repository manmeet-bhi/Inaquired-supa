import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

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
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  previewUrl?: string;
  devOtp?: string;
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
    return 'inaquired <noreply@noreply.anywhereroles.in>';
  }

  // Handle case where user provided raw domain: "noreply.anywhereroles.in"
  if (from === 'noreply.anywhereroles.in') {
    return 'inaquired <noreply@noreply.anywhereroles.in>';
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
export function buildPasswordResetHtml({
  fullName,
  to,
  resetUrl,
  otpCode,
  expiresMinutes = 30
}: SendResetEmailOptions): string {
  const greeting = fullName ? `Hello ${escapeHtml(fullName)},` : 'Hello Administrator,';
  const safeTo = escapeHtml(to);
  const safeResetUrl = escapeHtml(resetUrl);
  const safeOtpCode = escapeHtml(otpCode);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your inaquired Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      padding: 32px 36px;
      text-align: center;
    }
    .brand-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-badge {
      display: inline-block;
      margin-top: 8px;
      background-color: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(129, 140, 248, 0.4);
      color: #c7d2fe;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 36px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .lead-text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn-primary {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    .code-box {
      margin: 28px 0;
      background-color: #f1f5f9;
      border: 1px dashed #cbd5e1;
      border-radius: 14px;
      padding: 18px 24px;
      text-align: center;
    }
    .code-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 6px;
    }
    .code-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 28px;
      font-weight: 800;
      color: #1e1b4b;
      letter-spacing: 6px;
      margin: 0;
    }
    .expiry-note {
      font-size: 12px;
      color: #64748b;
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 10px 14px;
      border-radius: 6px;
      margin: 24px 0;
      line-height: 1.5;
    }
    .direct-link-note {
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
      margin-top: 24px;
      word-break: break-all;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      padding: 24px 36px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Header -->
      <div class="header">
        <h1 class="brand-title">inaquired</h1>
        <div class="brand-badge">Account Security System</div>
      </div>

      <!-- Main Body -->
      <div class="content">
        <div class="greeting">${greeting}</div>
        <p class="lead-text">
          We received a request to recover access to your administrator account for <strong>${safeTo}</strong>.
          Click the button below to set a new password:
        </p>

        <!-- Direct Action Button -->
        <div class="btn-container">
          <a href="${safeResetUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary">
            Reset Your Password
          </a>
        </div>

        <!-- 6-digit Code Box -->
        <div class="code-box">
          <div class="code-label">Or enter this 6-digit security code on the reset page</div>
          <div class="code-value">${safeOtpCode}</div>
        </div>

        <!-- Expiration warning -->
        <div class="expiry-note">
          ⏳ <strong>Time sensitive:</strong> This link and code will expire in <strong>${expiresMinutes} minutes</strong>. Once expired, you will need to initiate a new recovery request.
        </div>

        <p class="lead-text" style="font-size: 13px; color: #64748b;">
          If you did not request this password reset, no action is needed. Your current password remains secure, and you can safely ignore this email.
        </p>

        <div class="direct-link-note">
          <strong>Button not working?</strong> Copy and paste this link into your browser:<br/>
          <a href="${safeResetUrl}" style="color: #4f46e5;">${safeResetUrl}</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        © ${new Date().getFullYear()} inaquired Portal. All rights reserved.<br/>
        This is an automated security transmission sent via Resend API.<br/>
        Job discovery and management console for tech professionals.
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
  const htmlContent = buildPasswordResetHtml(options);
  const textContent = `
Reset Your inaquired Password

Hello ${options.fullName || 'Administrator'},

We received a request to reset your password for ${options.to}.
To set a new password, visit this link:
${options.resetUrl}

Or enter your 6-digit security code: ${options.otpCode}

This code expires in ${options.expiresMinutes || 30} minutes.
If you did not request this change, you can safely ignore this email.
  `.trim();

  // If Resend API Key is available, dispatch live email via Resend
  if (resend) {
    try {
      console.log(`[Resend] Dispatching password reset email to: ${options.to} from: ${fromEmail}`);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject: 'Reset Your inaquired Password',
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        console.error('[Resend Error]', error);
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
      return {
        success: false,
        error: err.message || 'Failed to dispatch email via Resend API',
        mode: 'resend_live'
      };
    }
  }

  // Developer Fallback (when RESEND_API_KEY is not yet populated in .env)
  console.log('\n================================================================');
  console.log('  [DEV NOTICE] RESEND_API_KEY is not configured in .env');
  console.log(`  Target Email: ${options.to}`);
  console.log(`  6-Digit Security Code: ${options.otpCode}`);
  console.log(`  Reset Password URL: ${options.resetUrl}`);
  console.log('  To send live emails, set RESEND_API_KEY="re_..." in .env');
  console.log('================================================================\n');

  return {
    success: true,
    mode: 'dev_fallback',
    devOtp: options.otpCode,
    previewUrl: options.resetUrl
  };
}

export interface SendTwoFactorEmailOptions {
  to: string;
  fullName?: string;
  otpCode: string;
  expiresMinutes?: number;
}

/**
 * Builds the responsive HTML email template for 2FA Verification Codes
 */
export function buildTwoFactorEmailHtml({
  fullName,
  to,
  otpCode,
  expiresMinutes = 10
}: SendTwoFactorEmailOptions): string {
  const greeting = fullName ? `Hello ${escapeHtml(fullName)},` : 'Hello Administrator,';
  const safeTo = escapeHtml(to);
  const safeOtpCode = escapeHtml(otpCode);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your inaquired 2FA Security Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 16px;
    }
    .card {
      max-width: 540px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #312e81 0%, #4338ca 50%, #1e1b4b 100%);
      padding: 32px 28px;
      text-align: center;
    }
    .brand-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .header-badge {
      display: inline-block;
      margin-top: 10px;
      padding: 4px 12px;
      border-radius: 9999px;
      background-color: rgba(255, 255, 255, 0.15);
      color: #c7d2fe;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .body {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 24px 0;
    }
    .otp-container {
      background: #f1f5f9;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      padding: 24px 16px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-bottom: 8px;
      display: block;
    }
    .otp-digits {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #4338ca;
      margin: 0;
      padding-left: 10px; /* balances letter-spacing */
    }
    .otp-meta {
      font-size: 12px;
      color: #64748b;
      margin-top: 10px;
    }
    .security-notice {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 24px 0 0 0;
      font-size: 12px;
      line-height: 1.5;
      color: #92400e;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand-title">inaquired</h1>
        <span class="header-badge">Two-Factor Authentication</span>
      </div>
      <div class="body">
        <p class="greeting">${greeting}</p>
        <p class="text">
          A security verification was requested for your administrator account (<strong style="color: #0f172a;">${safeTo}</strong>).
          Enter the following single-use verification code to complete your two-factor sign-in or security update:
        </p>
        
        <div class="otp-container">
          <span class="otp-label">Security Verification Code</span>
          <div class="otp-digits">${safeOtpCode}</div>
          <div class="otp-meta">Expires in ${expiresMinutes} minutes</div>
        </div>

        <p class="text" style="font-size: 13px; color: #64748b;">
          Never share this code with anyone. Inaquired staff will never ask for your two-factor authentication code.
        </p>

        <div class="security-notice">
          <strong>Security Notice:</strong> If you did not initiate this sign-in attempt, someone may know your password.
          Please change your password immediately in the Admin Console.
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} inaquired. All rights reserved.</p>
        <p style="margin: 0;">Securing candidate and enterprise talent operations worldwide.</p>
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
  const htmlContent = buildTwoFactorEmailHtml(options);
  const textContent = `
Your inaquired Two-Factor Authentication Security Code:
${options.otpCode}

This code expires in ${options.expiresMinutes || 10} minutes.
Enter this code on the screen to complete your authentication.

If you did not request this code, please reset your password immediately.
  `.trim();

  if (resend) {
    try {
      console.log(`[Resend] Dispatching 2FA verification email to: ${options.to} from: ${fromEmail}`);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject: `Your inaquired verification code: ${options.otpCode}`,
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        console.error('[Resend Error]', error);
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
      return {
        success: false,
        error: err.message || 'Failed to dispatch 2FA email via Resend API',
        mode: 'resend_live'
      };
    }
  }

  // Fallback for local development if Resend API key is not present
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log('\n================================================================');
    console.log('  [DEV NOTICE] 2FA Security Code Dispatched');
    console.log(`  Target: ${options.to}`);
    console.log('================================================================\n');
  }

  return {
    success: true,
    mode: 'dev_fallback',
    devOtp: isDev ? options.otpCode : undefined,
  };
}

