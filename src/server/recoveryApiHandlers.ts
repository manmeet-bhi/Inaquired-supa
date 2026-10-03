import crypto from 'crypto';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendPasswordResetEmail } from './resendEmailService.ts';

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

    if (procedureName === 'admin_request_password_reset') {
      const { rows } = await client.query(
        'SELECT public.admin_request_password_reset($1, $2, $3, $4, $5) as res;',
        [params.p_email, params.p_token, params.p_otp_code, params.p_expires_minutes || 30, params.p_ip || null]
      );
      return rows[0]?.res;
    }

    if (procedureName === 'admin_verify_recovery_token') {
      const { rows } = await client.query(
        'SELECT public.admin_verify_recovery_token($1, $2) as res;',
        [params.p_token_or_otp, params.p_email || null]
      );
      return rows[0]?.res;
    }

    if (procedureName === 'admin_complete_password_reset') {
      const { rows } = await client.query(
        'SELECT public.admin_complete_password_reset($1, $2, $3) as res;',
        [params.p_token_or_otp, params.p_new_password, params.p_email || null]
      );
      return rows[0]?.res;
    }

    throw new Error(`Unsupported fallback procedure: ${procedureName}`);
  } finally {
    try { await client.end(); } catch {}
  }
}

/**
 * Parses JSON request body safely
 */
export async function parseRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
  });
}

/**
 * Responds with JSON payload
 */
export function sendJsonResponse(res: any, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

/**
 * POST /api/auth/forgot-password
 */
export async function handleForgotPassword(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'A valid email address is required.'
      });
    }

    let appOrigin: string;
    if (process.env.APP_URL) {
      try {
        const configuredUrl = new URL(process.env.APP_URL);
        if (
          !['https:', 'http:'].includes(configuredUrl.protocol) ||
          (process.env.NODE_ENV !== 'development' && configuredUrl.protocol !== 'https:')
        ) {
          throw new Error('APP_URL must use HTTPS outside development.');
        }
        appOrigin = configuredUrl.origin;
      } catch {
        return sendJsonResponse(res, 500, {
          success: false,
          error: 'Password recovery is temporarily unavailable.'
        });
      }
    } else if (process.env.NODE_ENV === 'development') {
      appOrigin = 'http://localhost:3000';
    } else {
      return sendJsonResponse(res, 500, {
        success: false,
        error: 'Password recovery is temporarily unavailable.'
      });
    }

    // Generate cryptographically secure token & 6-digit OTP code using crypto
    const token = crypto.randomBytes(32).toString('hex');
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    // Call stored procedure
    const result = await callDbRpc('admin_request_password_reset', {
      p_email: email,
      p_token: token,
      p_otp_code: otpCode,
      p_expires_minutes: 30,
      p_ip: req.socket?.remoteAddress || null
    });

    if (!result || !result.exists) {
      return sendJsonResponse(res, 200, {
        success: true,
        message: 'If an administrator account exists for this address, recovery instructions will be sent.'
      });
    }

    const resetUrl = `${appOrigin}/admin/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Dispatch email using Resend
    const sendResult = await sendPasswordResetEmail({
      to: email,
      fullName: result.full_name || 'Administrator',
      resetUrl,
      otpCode,
      expiresMinutes: 30
    });

    if (sendResult.mode === 'resend_live' && !sendResult.success) {
      console.error('[Forgot Password Email Delivery Error]', sendResult.error);
    }

    const isDev = process.env.NODE_ENV === 'development';
    return sendJsonResponse(res, 200, {
      success: true,
      message: 'If an administrator account exists for this address, recovery instructions will be sent.',
      mode: isDev ? sendResult.mode : undefined,
      devOtp: isDev && sendResult.mode === 'dev_fallback' ? sendResult.devOtp : undefined,
      previewUrl: isDev && sendResult.mode === 'dev_fallback' ? sendResult.previewUrl : undefined
    });

  } catch (err: any) {
    console.error('[Forgot Password Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'An error occurred while processing your recovery request.'
    });
  }
}

/**
 * POST /api/auth/verify-recovery-token
 */
export async function handleVerifyRecoveryToken(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const token = body.token?.trim();
    const email = body.email?.trim() || null;

    if (!token) {
      return sendJsonResponse(res, 400, {
        valid: false,
        error: 'A recovery token or 6-digit code is required.'
      });
    }

    const result = await callDbRpc('admin_verify_recovery_token', {
      p_token_or_otp: token,
      p_email: email
    });

    if (!result || !result.valid) {
      return sendJsonResponse(res, 400, {
        valid: false,
        error: result?.error || 'Invalid or expired recovery code.'
      });
    }

    return sendJsonResponse(res, 200, {
      valid: true,
      email: result.email,
      expiresAt: result.expires_at
    });

  } catch (err: any) {
    console.error('[Verify Token Error]', err);
    return sendJsonResponse(res, 500, {
      valid: false,
      error: err.message || 'Failed to verify recovery token.'
    });
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function handleResetPassword(req: any, res: any) {
  try {
    const body = await parseRequestBody(req);
    const token = body.token?.trim();
    const newPassword = body.newPassword?.trim();
    const email = body.email?.trim() || null;

    if (!token) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'A recovery token or code is required.'
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Your new password must be at least 8 characters in length.'
      });
    }

    const result = await callDbRpc('admin_complete_password_reset', {
      p_token_or_otp: token,
      p_new_password: newPassword,
      p_email: email
    });

    if (!result || !result.success) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: result?.error || 'Failed to update password.'
      });
    }

    return sendJsonResponse(res, 200, {
      success: true,
      message: 'Your password has been reset successfully. You may now log in.',
      email: result.email
    });

  } catch (err: any) {
    console.error('[Reset Password Error]', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'An error occurred while resetting your password.'
    });
  }
}
