import crypto from 'crypto';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendTwoFactorEmail } from './resendEmailService.ts';
import { sendJsonResponse, parseRequestBody } from './recoveryApiHandlers.ts';
import { 
  generateBase32Secret, 
  formatSecret, 
  getTotpAuthUri, 
  generateQrCodeDataUrl, 
  verifyTOTP, 
  generateBackupCodes 
} from '../utils/totp.ts';

dotenv.config();

const { Client } = pg;

// Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Direct DB connection string fallback - strictly from environment variables
const directDbUri = process.env.SUPABASE_DIRECT_URL || '';

/**
 * Execute RPC function via Supabase JS client or direct Postgres connection
 */
async function callDbRpc(procedureName: string, params: Record<string, any>): Promise<any> {
  // First attempt via Supabase RPC
  try {
    const { data, error } = await supabase.rpc(procedureName, params);
    if (!error && data !== null) {
      return data;
    }
    if (error) {
      console.warn(`[Supabase RPC Notice] ${procedureName}:`, error.message);
    }
  } catch (rpcErr: any) {
    console.warn(`[Supabase RPC Exception] ${procedureName}:`, rpcErr.message);
  }

  // Fallback: Direct PostgreSQL Client
  console.log(`[DB Fallback] Executing ${procedureName} via direct PostgreSQL connection...`);
  const client = new Client({
    connectionString: directDbUri,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();

    if (procedureName === 'admin_get_2fa_status') {
      const { rows } = await client.query(
        'SELECT public.admin_get_2fa_status($1) as res;',
        [params.p_email]
      );
      return rows[0]?.res;
    }

    if (procedureName === 'admin_save_2fa_config') {
      const { rows } = await client.query(
        'SELECT public.admin_save_2fa_config($1, $2, $3, $4, $5) as res;',
        [
          params.p_email,
          params.p_totp_secret,
          params.p_totp_enabled,
          params.p_email_enabled,
          JSON.stringify(params.p_backup_codes || [])
        ]
      );
      return rows[0]?.res;
    }

    if (procedureName === 'admin_store_email_2fa_otp') {
      const { rows } = await client.query(
        'SELECT public.admin_store_email_2fa_otp($1, $2, $3) as res;',
        [params.p_email, params.p_otp_code, params.p_expires_minutes || 10]
      );
      return rows[0]?.res;
    }

    if (procedureName === 'admin_verify_email_2fa_otp') {
      const { rows } = await client.query(
        'SELECT public.admin_verify_email_2fa_otp($1, $2) as res;',
        [params.p_email, params.p_otp_code]
      );
      return rows[0]?.res;
    }

    if (procedureName === 'admin_consume_backup_code') {
      const { rows } = await client.query(
        'SELECT public.admin_consume_backup_code($1, $2) as res;',
        [params.p_email, params.p_code]
      );
      return rows[0]?.res;
    }

    if (procedureName === 'admin_disable_2fa') {
      const { rows } = await client.query(
        'SELECT public.admin_disable_2fa($1) as res;',
        [params.p_email]
      );
      return rows[0]?.res;
    }

    throw new Error(`Unsupported 2FA fallback procedure: ${procedureName}`);
  } finally {
    try { await client.end(); } catch {}
  }
}

/**
 * Fetch raw admin record from database (totp_secret, backup_codes)
 */
async function getAdminRecord(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  
  // Try via supabase table select
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, two_factor_enabled, totp_enabled, email_2fa_enabled, totp_secret, backup_codes')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('[Supabase getAdminRecord Notice]', err);
  }

  // Fallback direct postgres
  const client = new Client({
    connectionString: directDbUri,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT id, email, full_name, role, two_factor_enabled, totp_enabled, email_2fa_enabled, totp_secret, backup_codes
       FROM public.admin_users WHERE LOWER(email) = $1 LIMIT 1;`,
      [cleanEmail]
    );
    return rows[0] || null;
  } finally {
    try { await client.end(); } catch {}
  }
}

/**
 * Authenticates that the incoming request has a valid Supabase Bearer token matching the target user or superadmin
 */
async function verifyRequestAdmin(req: any, targetEmail?: string): Promise<{ authorized: boolean; error?: string; user?: any }> {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'Unauthorized. Authorization Bearer token required.' };
  }

  const token = authHeader.substring(7).trim();
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { authorized: false, error: 'Invalid or expired authentication session.' };
    }

    const adminRecord = await getAdminRecord(user.email || '');
    if (!adminRecord || adminRecord.id !== user.id || adminRecord.status !== 'active') {
      return { authorized: false, error: 'An active administrator account is required.' };
    }

    if (targetEmail && user.email?.toLowerCase() !== targetEmail.toLowerCase()) {
      if (adminRecord?.role !== 'superadmin') {
        return { authorized: false, error: 'Forbidden. You do not have permission to manage 2FA for this user.' };
      }
    }

    return { authorized: true, user };
  } catch (err: any) {
    return { authorized: false, error: err.message || 'Authentication error.' };
  }
}

/**
 * POST /api/auth/2fa/status
 * Get the current 2FA status for an admin user
 */
export async function handleGet2FaStatus(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'A valid email address is required.'
      });
    }

    const authCheck = await verifyRequestAdmin(req, email);
    if (!authCheck.authorized) {
      return sendJsonResponse(res, 401, { success: false, error: authCheck.error });
    }

    const status = await callDbRpc('admin_get_2fa_status', { p_email: email });

    if (!status || !status.success) {
      return sendJsonResponse(res, 404, {
        success: false,
        error: status?.error || 'Admin user account not found.'
      });
    }

    return sendJsonResponse(res, 200, {
      success: true,
      data: status
    });
  } catch (err: any) {
    console.error('[2FA Status Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to retrieve 2FA security status.'
    });
  }
}

/**
 * POST /api/auth/2fa/generate-secret
 * Generates a fresh Base32 secret key, otpauth URL, and QR Code for Google Authenticator
 */
export async function handleGenerateTotpSetup(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'A valid email address is required.'
      });
    }

    const authCheck = await verifyRequestAdmin(req, email);
    if (!authCheck.authorized) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: authCheck.error || 'Authentication required to setup 2FA.'
      });
    }

    // Generate fresh high-entropy Base32 secret (32 Base32 characters)
    const secret = generateBase32Secret(20);
    const formattedSecret = formatSecret(secret);
    const otpauthUri = getTotpAuthUri(email, secret, 'inaquired');
    const qrCodeUrl = await generateQrCodeDataUrl(otpauthUri);

    return sendJsonResponse(res, 200, {
      success: true,
      secret,
      formattedSecret,
      otpauthUri,
      qrCodeUrl
    });
  } catch (err: any) {
    console.error('[Generate TOTP Setup Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to generate Authenticator setup key.'
    });
  }
}

/**
 * POST /api/auth/2fa/verify-setup
 * Verifies initial 6-digit TOTP code and activates Google Authenticator
 */
export async function handleVerifyTotpSetup(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const email = body.email?.trim().toLowerCase();
    const secret = body.secret?.trim();
    const code = body.code?.trim();

    if (!email || !secret || !code) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Email, authenticator secret, and 6-digit code are required.'
      });
    }

    const authCheck = await verifyRequestAdmin(req, email);
    if (!authCheck.authorized) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: authCheck.error || 'Authentication required to activate 2FA.'
      });
    }

    // Verify 6-digit code with ±1 time step tolerance (30 seconds)
    const isValid = await verifyTOTP(code, secret, 1, 30);
    if (!isValid) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Invalid 6-digit code. Please verify the current code in your authenticator app and try again.'
      });
    }

    // Retrieve user and backup codes
    const userRecord = await getAdminRecord(email);
    let backupCodes = userRecord?.backup_codes || [];

    // If no unused backup codes exist, generate 10 new ones
    const hasUnused = Array.isArray(backupCodes) && backupCodes.some((c: any) => !c.used);
    let generatedNewBackupCodes = false;
    if (!hasUnused) {
      backupCodes = generateBackupCodes(10);
      generatedNewBackupCodes = true;
    }

    // Save in database
    const saveResult = await callDbRpc('admin_save_2fa_config', {
      p_email: email,
      p_totp_secret: secret,
      p_totp_enabled: true,
      p_email_enabled: userRecord?.email_2fa_enabled || false,
      p_backup_codes: backupCodes
    });

    if (!saveResult || !saveResult.success) {
      return sendJsonResponse(res, 500, {
        success: false,
        error: saveResult?.error || 'Failed to save 2FA configuration in database.'
      });
    }

    return sendJsonResponse(res, 200, {
      success: true,
      message: 'Google Authenticator 2FA enabled successfully!',
      backupCodes: generatedNewBackupCodes ? backupCodes : undefined,
      remainingBackupCodes: Array.isArray(backupCodes) ? backupCodes.filter((c: any) => !c.used).length : 0
    });
  } catch (err: any) {
    console.error('[Verify TOTP Setup Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to complete Google Authenticator setup.'
    });
  }
}

/**
 * POST /api/auth/2fa/send-email-code
 * Dispatches a 6-digit 2FA security code via Resend email
 */
export async function handleSendEmail2FaCode(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'A valid email address is required.'
      });
    }

    const authCheck = await verifyRequestAdmin(req, email);
    if (!authCheck.authorized) {
      return sendJsonResponse(res, 401, { success: false, error: authCheck.error });
    }

    // Generate cryptographically secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    // Store in database
    const storeResult = await callDbRpc('admin_store_email_2fa_otp', {
      p_email: email,
      p_otp_code: otpCode,
      p_expires_minutes: 10
    });

    if (!storeResult || !storeResult.success) {
      return sendJsonResponse(res, 404, {
        success: false,
        error: storeResult?.error || 'Admin account not found.'
      });
    }

    // Dispatch email using Resend
    const sendResult = await sendTwoFactorEmail({
      to: email,
      fullName: storeResult.fullName || 'Administrator',
      otpCode,
      expiresMinutes: 10
    });

    const isDev = process.env.NODE_ENV === 'development';
    return sendJsonResponse(res, 200, {
      success: true,
      message: `A 6-digit security code has been sent to ${email}.`,
      expiresMinutes: 10,
      mode: sendResult.mode,
      devOtp: isDev && sendResult.mode === 'dev_fallback' ? sendResult.devOtp : undefined
    });
  } catch (err: any) {
    console.error('[Send Email 2FA Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to dispatch email verification code.'
    });
  }
}

/**
 * POST /api/auth/2fa/verify-email-setup
 * Verifies email OTP and activates Email 2FA
 */
export async function handleVerifyEmail2FaSetup(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.trim();

    if (!email || !code) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Email and verification code are required.'
      });
    }

    const authCheck = await verifyRequestAdmin(req, email);
    if (!authCheck.authorized) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: authCheck.error || 'Authentication required to activate 2FA.'
      });
    }

    // Verify OTP in DB
    const verifyResult = await callDbRpc('admin_verify_email_2fa_otp', {
      p_email: email,
      p_otp_code: code
    });

    if (!verifyResult || !verifyResult.success) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: verifyResult?.error || 'Invalid or expired verification code.'
      });
    }

    // Retrieve user and backup codes
    const userRecord = await getAdminRecord(email);
    let backupCodes = userRecord?.backup_codes || [];

    const hasUnused = Array.isArray(backupCodes) && backupCodes.some((c: any) => !c.used);
    let generatedNewBackupCodes = false;
    if (!hasUnused) {
      backupCodes = generateBackupCodes(10);
      generatedNewBackupCodes = true;
    }

    // Save in database
    await callDbRpc('admin_save_2fa_config', {
      p_email: email,
      p_totp_secret: null,
      p_totp_enabled: userRecord?.totp_enabled || false,
      p_email_enabled: true,
      p_backup_codes: backupCodes
    });

    return sendJsonResponse(res, 200, {
      success: true,
      message: 'Email Two-Factor Authentication enabled successfully!',
      backupCodes: generatedNewBackupCodes ? backupCodes : undefined,
      remainingBackupCodes: Array.isArray(backupCodes) ? backupCodes.filter((c: any) => !c.used).length : 0
    });
  } catch (err: any) {
    console.error('[Verify Email 2FA Setup Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to complete Email 2FA setup.'
    });
  }
}

/**
 * POST /api/auth/2fa/verify-login-2fa
 * Verifies 2FA during administrator login (Supports TOTP, Email Code, or Backup Code)
 */
export async function handleVerifyLogin2Fa(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const email = body.email?.trim().toLowerCase();
    const method = body.method as 'totp' | 'email' | 'backup';
    const code = body.code?.trim();

    if (!email || !method || !code) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Email, verification method, and code are required.'
      });
    }

    const authCheck = await verifyRequestAdmin(req, email);
    if (!authCheck.authorized) {
      return sendJsonResponse(res, 401, { success: false, error: authCheck.error });
    }

    const userRecord = await getAdminRecord(email);
    if (!userRecord) {
      return sendJsonResponse(res, 404, {
        success: false,
        error: 'Administrator account not found.'
      });
    }

    // Method 1: Google Authenticator (TOTP)
    if (method === 'totp') {
      const secret = userRecord.totp_secret;
      if (!secret || !userRecord.totp_enabled) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Authenticator App 2FA is not enabled on this account.'
        });
      }

      const isValid = await verifyTOTP(code, secret, 1, 30);
      if (!isValid) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Invalid 6-digit authenticator code. Check your app and try again.'
        });
      }

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Authenticator verified successfully.',
        user: {
          id: userRecord.id,
          email: userRecord.email,
          fullName: userRecord.full_name,
          role: userRecord.role
        }
      });
    }

    // Method 2: Email Security Code
    if (method === 'email') {
      const verifyResult = await callDbRpc('admin_verify_email_2fa_otp', {
        p_email: email,
        p_otp_code: code
      });

      if (!verifyResult || !verifyResult.success) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: verifyResult?.error || 'Invalid or expired email code.'
        });
      }

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Email security code verified successfully.',
        user: {
          id: verifyResult.userId || userRecord.id,
          email: verifyResult.email || userRecord.email,
          fullName: verifyResult.fullName || userRecord.full_name,
          role: verifyResult.role || userRecord.role
        }
      });
    }

    // Method 3: Backup Recovery Code
    if (method === 'backup') {
      const backupResult = await callDbRpc('admin_consume_backup_code', {
        p_email: email,
        p_code: code
      });

      if (!backupResult || !backupResult.success) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: backupResult?.error || 'Invalid or already used backup code.'
        });
      }

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Backup recovery code accepted.',
        remainingBackupCodes: backupResult.remainingBackupCodes,
        user: {
          id: backupResult.userId || userRecord.id,
          email: backupResult.email || userRecord.email,
          fullName: backupResult.fullName || userRecord.full_name,
          role: backupResult.role || userRecord.role
        }
      });
    }

    return sendJsonResponse(res, 400, {
      success: false,
      error: `Unsupported verification method: ${method}`
    });
  } catch (err: any) {
    console.error('[Verify Login 2FA Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Authentication error during 2FA verification.'
    });
  }
}

/**
 * POST /api/auth/2fa/regenerate-backup-codes
 * Generates 10 new backup recovery codes and replaces existing ones
 */
export async function handleRegenerateBackupCodes(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'A valid email address is required.'
      });
    }

    const authCheck = await verifyRequestAdmin(req, email);
    if (!authCheck.authorized) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: authCheck.error || 'Unauthorized. Valid admin session token required.'
      });
    }

    const newCodes = generateBackupCodes(10);

    const client = new Client({
      connectionString: directDbUri,
      ssl: { rejectUnauthorized: true },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      const { rowCount } = await client.query(
        `UPDATE public.admin_users 
         SET backup_codes = $1, updated_at = NOW() 
         WHERE LOWER(email) = $2;`,
        [JSON.stringify(newCodes), email]
      );

      if (rowCount === 0) {
        return sendJsonResponse(res, 404, {
          success: false,
          error: 'Admin user not found.'
        });
      }
    } finally {
      try { await client.end(); } catch {}
    }

    return sendJsonResponse(res, 200, {
      success: true,
      message: 'New backup codes generated successfully.',
      backupCodes: newCodes
    });
  } catch (err: any) {
    console.error('[Regenerate Backup Codes Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to regenerate backup codes.'
    });
  }
}

/**
 * POST /api/auth/2fa/get-backup-codes
 * Fetches existing backup codes for the currently authenticated admin
 */
export async function handleGetBackupCodes(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'A valid email address is required.'
      });
    }

    const authCheck = await verifyRequestAdmin(req, email);
    if (!authCheck.authorized) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: authCheck.error || 'Unauthorized. Valid admin session token required.'
      });
    }

    const record = await getAdminRecord(email);
    if (!record) {
      return sendJsonResponse(res, 404, {
        success: false,
        error: 'Admin user not found.'
      });
    }

    const backupCodes = Array.isArray(record.backup_codes) ? record.backup_codes : [];
    return sendJsonResponse(res, 200, {
      success: true,
      backupCodes
    });
  } catch (err: any) {
    console.error('[Get Backup Codes Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to fetch backup codes.'
    });
  }
}

/**
 * POST /api/auth/2fa/disable
 * Disables TOTP, Email 2FA, or all 2FA
 */
export async function handleDisable2Fa(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const email = body.email?.trim().toLowerCase();
    const method = body.method as 'totp' | 'email' | 'all';

    if (!email) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Email is required.'
      });
    }

    const authCheck = await verifyRequestAdmin(req, email);
    if (!authCheck.authorized) {
      return sendJsonResponse(res, 401, {
        success: false,
        error: authCheck.error || 'Unauthorized. Valid admin session token required.'
      });
    }

    const client = new Client({
      connectionString: directDbUri,
      ssl: { rejectUnauthorized: true },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();

      if (method === 'totp') {
        await client.query(
          `UPDATE public.admin_users
           SET totp_enabled = false,
               two_factor_enabled = (email_2fa_enabled = true),
               updated_at = NOW()
           WHERE LOWER(email) = $1;`,
          [email]
        );
      } else if (method === 'email') {
        await client.query(
          `UPDATE public.admin_users
           SET email_2fa_enabled = false,
               temp_email_otp = NULL,
               temp_email_otp_expires = NULL,
               two_factor_enabled = (totp_enabled = true),
               updated_at = NOW()
           WHERE LOWER(email) = $1;`,
          [email]
        );
      } else {
        await client.query(
          `UPDATE public.admin_users
           SET two_factor_enabled = false,
               totp_enabled = false,
               email_2fa_enabled = false,
               temp_email_otp = NULL,
               temp_email_otp_expires = NULL,
               updated_at = NOW()
           WHERE LOWER(email) = $1;`,
          [email]
        );
      }
    } finally {
      try { await client.end(); } catch {}
    }

    return sendJsonResponse(res, 200, {
      success: true,
      message: '2FA settings updated successfully.'
    });
  } catch (err: any) {
    console.error('[Disable 2FA Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to update 2FA configuration.'
    });
  }
}
