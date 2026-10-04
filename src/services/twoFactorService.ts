import { supabase } from '../lib/supabase';
import {
  generateBase32Secret,
  formatSecret,
  getTotpAuthUri,
  generateQrCodeDataUrl,
  verifyTOTP,
  generateBackupCodes,
  type BackupCodeItem
} from '../utils/totp';

export type { BackupCodeItem };

export interface TwoFactorStatus {
  success: boolean;
  twoFactorEnabled: boolean;
  totpEnabled: boolean;
  email2faEnabled: boolean;
  hasTotpSecret: boolean;
  remainingBackupCodes: number;
}

export interface TotpSetupResponse {
  success: boolean;
  secret: string;
  formattedSecret: string;
  otpauthUri: string;
  qrCodeUrl: string;
  error?: string;
}

export interface Verify2FaResponse {
  success: boolean;
  message?: string;
  error?: string;
  backupCodes?: BackupCodeItem[];
  remainingBackupCodes?: number;
  user?: {
    id: string;
    email: string;
    fullName?: string;
    role?: string;
  };
}

/**
 * Helper to make API requests with Authorization header and safe response parsing
 */
async function postApi(endpoint: string, payload: any): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (e) {}

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    throw new Error(err?.message || `Network error connecting to ${endpoint}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(`Endpoint ${endpoint} returned an HTML document. The API service may be unavailable on this route.`);
    }
    throw new Error(`Unexpected non-JSON response from server: ${text.slice(0, 80)}`);
  }

  let result: any;
  try {
    result = await response.json();
  } catch (jsonErr: any) {
    throw new Error('Failed to parse server response as JSON.');
  }

  if (!response.ok) {
    throw new Error(result?.error || 'The two-factor authentication request failed.');
  }
  return result;
}

/**
 * Fetch 2FA status for an admin user
 */
export async function get2FaStatus(email: string): Promise<TwoFactorStatus> {
  const cleanEmail = email.trim().toLowerCase();

  const res = await postApi('/api/auth/2fa/status', { email: cleanEmail });
  if (res && res.success && res.data) {
    return res.data;
  }

  throw new Error('Failed to retrieve two-factor authentication status.');
}

/**
 * Generate Google Authenticator TOTP Setup (Secret & QR Code)
 * Generated directly in the browser using Web Crypto & QR Code engine
 * for zero latency, zero network failure risk, and complete offline capability.
 */
export async function generateTotpSetup(email: string): Promise<TotpSetupResponse> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    // Generate fresh high-entropy Base32 secret (20 bytes = 32 Base32 characters)
    const secret = generateBase32Secret(20);
    const formattedSecret = formatSecret(secret);
    const otpauthUri = getTotpAuthUri(cleanEmail, secret, 'inaquired');
    const qrCodeUrl = await generateQrCodeDataUrl(otpauthUri);

    return {
      success: true,
      secret,
      formattedSecret,
      otpauthUri,
      qrCodeUrl,
    };
  } catch (err: any) {
    console.error('Failed to generate TOTP setup:', err);
    return {
      success: false,
      secret: '',
      formattedSecret: '',
      otpauthUri: '',
      qrCodeUrl: '',
      error: err?.message || 'Failed to generate Authenticator setup key.',
    };
  }
}

/**
 * Verify initial code and enable Google Authenticator 2FA
 */
export async function verifyAndEnableTotp(
  email: string,
  secret: string,
  code: string
): Promise<Verify2FaResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.replace(/\D/g, '').trim();

  // 1. Client-side TOTP validation with ±1 time step tolerance (30s)
  const isValid = await verifyTOTP(cleanCode, secret, 1, 30);
  if (!isValid) {
    return {
      success: false,
      error: 'Invalid 6-digit code. Check your authenticator app and try again.',
    };
  }

  // 2. Attempt 1: Call API endpoint
  try {
    const res = await postApi('/api/auth/2fa/verify-setup', {
      email: cleanEmail,
      secret,
      code: cleanCode,
    });
    if (res && res.success) {
      return res;
    }
  } catch (err: any) {
    console.warn('API /api/auth/2fa/verify-setup failed, falling back to direct Supabase save:', err.message);
  }

  // 3. Attempt 2: Direct Supabase RPC save
  try {
    const newBackupCodes = generateBackupCodes(10);
    const { data, error } = await supabase.rpc('admin_save_2fa_config', {
      p_email: cleanEmail,
      p_totp_secret: secret,
      p_totp_enabled: true,
      p_email_enabled: false,
      p_backup_codes: newBackupCodes,
    });

    if (!error && (data?.success || data === true)) {
      return {
        success: true,
        message: 'Google Authenticator 2FA enabled successfully!',
        backupCodes: newBackupCodes,
        remainingBackupCodes: newBackupCodes.length,
      };
    }
    if (error) {
      throw new Error(error.message);
    }
  } catch (dbErr: any) {
    console.error('Direct Supabase 2FA save error:', dbErr);
    return {
      success: false,
      error: dbErr.message || 'Failed to save 2FA configuration to database.',
    };
  }

  return {
    success: false,
    error: 'Failed to complete Google Authenticator setup.',
  };
}

/**
 * Request an email verification code (sends via Resend)
 */
export async function sendEmail2FaCode(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    return await postApi('/api/auth/2fa/send-email-code', { email: cleanEmail });
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to email verification service.',
    };
  }
}

/**
 * Verify code and enable Email 2FA
 */
export async function verifyAndEnableEmail2Fa(
  email: string,
  code: string
): Promise<Verify2FaResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.replace(/\D/g, '').trim();

  // Attempt 1: Call API endpoint
  try {
    return await postApi('/api/auth/2fa/verify-email-setup', {
      email: cleanEmail,
      code: cleanCode,
    });
  } catch (err: any) {
    console.warn('API /api/auth/2fa/verify-email-setup notice:', err.message);
  }

  // Attempt 2: Direct Supabase RPC verify
  try {
    const { data, error } = await supabase.rpc('admin_verify_email_2fa_otp', {
      p_email: cleanEmail,
      p_otp_code: cleanCode,
    });

    if (!error && data?.success) {
      const currStatus = await get2FaStatus(cleanEmail);
      const newBackupCodes = generateBackupCodes(10);
      await supabase.rpc('admin_save_2fa_config', {
        p_email: cleanEmail,
        p_totp_secret: null,
        p_totp_enabled: Boolean(currStatus.totpEnabled),
        p_email_enabled: true,
        p_backup_codes: newBackupCodes,
      });

      return {
        success: true,
        message: 'Email Two-Factor Authentication activated!',
        backupCodes: newBackupCodes,
        remainingBackupCodes: newBackupCodes.length,
      };
    }
    if (data?.error) {
      return { success: false, error: data.error };
    }
  } catch (dbErr: any) {
    console.warn('Direct Supabase email verify fallback notice:', dbErr.message);
  }

  return {
    success: false,
    error: 'Failed to verify email security code.',
  };
}

/**
 * Verify 2FA challenge during Administrator sign in
 */
export async function verifyLogin2Fa(
  email: string,
  method: 'totp' | 'email' | 'backup',
  code: string
): Promise<Verify2FaResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  // Attempt 1: Call API endpoint
  try {
    const res = await postApi('/api/auth/2fa/verify-login-2fa', {
      email: cleanEmail,
      method,
      code: cleanCode,
    });
    return res;
  } catch (err: any) {
    console.warn('API /api/auth/2fa/verify-login-2fa failed, attempting direct Supabase fallback:', err.message);
  }

  // Attempt 2: Direct Supabase RPC fallback for backup codes
  if (method === 'backup') {
    try {
      const { data, error } = await supabase.rpc('admin_consume_backup_code', {
        p_email: cleanEmail,
        p_code: cleanCode.toUpperCase(),
      });
      if (!error && data?.success) {
        return {
          success: true,
          message: 'Backup code accepted. Access granted.',
        };
      }
      if (data?.error) {
        return { success: false, error: data.error };
      }
    } catch (rpcErr: any) {
      console.warn('Direct Supabase backup code fallback notice:', rpcErr.message);
    }
  }

  return {
    success: false,
    error: 'Failed to verify two-factor authentication code.',
  };
}

/**
 * Fetch backup codes for authenticated admin
 */
export async function getBackupCodes(email: string): Promise<BackupCodeItem[]> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await postApi('/api/auth/2fa/get-backup-codes', { email: cleanEmail });
    if (res && res.success && Array.isArray(res.backupCodes)) {
      return res.backupCodes;
    }
  } catch (err: any) {
    console.warn('API /api/auth/2fa/get-backup-codes notice:', err.message);
  }

  return [];
}

/**
 * Regenerate a new set of 10 backup recovery codes
 */
export async function regenerateBackupCodes(email: string): Promise<{ success: boolean; backupCodes?: BackupCodeItem[]; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // Attempt 1: Call API
  try {
    const res = await postApi('/api/auth/2fa/regenerate-backup-codes', { email: cleanEmail });
    if (res && res.success) {
      return res;
    }
  } catch (err: any) {
    console.warn('API /api/auth/2fa/regenerate-backup-codes notice:', err.message);
  }

  // Attempt 2: Direct Supabase RPC fallback
  try {
    const newCodes = generateBackupCodes(10);
    const { data, error } = await supabase.rpc('admin_save_2fa_config', {
      p_email: cleanEmail,
      p_totp_secret: '',
      p_totp_enabled: true,
      p_email_enabled: false,
      p_backup_codes: newCodes,
    });
    if (!error && (data?.success || data === true)) {
      return { success: true, backupCodes: newCodes };
    }
  } catch (dbErr: any) {
    console.warn('Direct Supabase regenerate backup codes fallback notice:', dbErr.message);
  }

  return { success: false, error: 'Failed to regenerate backup codes.' };
}

/**
 * Disable 2FA method (totp, email, or all)
 */
export async function disable2Fa(
  email: string,
  method: 'totp' | 'email' | 'all' = 'all'
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // Attempt 1: Call API
  try {
    const res = await postApi('/api/auth/2fa/disable', { email: cleanEmail, method });
    if (res && res.success) {
      return res;
    }
  } catch (err: any) {
    console.warn('API /api/auth/2fa/disable notice:', err.message);
  }

  // Attempt 2: Direct Supabase RPC fallback
  try {
    const { data, error } = await supabase.rpc('admin_disable_2fa', {
      p_email: cleanEmail,
      p_method: method,
    });
    if (!error && (data?.success || data === true)) {
      return { success: true };
    }
  } catch (dbErr: any) {
    console.warn('Direct Supabase disable 2FA fallback notice:', dbErr.message);
  }

  return { success: false, error: 'Failed to update 2FA configuration.' };
}
