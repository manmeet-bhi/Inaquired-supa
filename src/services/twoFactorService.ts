import { supabase } from '../lib/supabase';
import type { BackupCodeItem } from '../utils/totp';

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
 * Helper to make API requests with Authorization header
 */
async function postApi(endpoint: string, payload: any): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (e) {}

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'The two-factor authentication request failed.');
  }
  return result;
}

/**
 * Fetch 2FA status for an admin user
 */
export async function get2FaStatus(email: string): Promise<TwoFactorStatus> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await postApi('/api/auth/2fa/status', { email: cleanEmail });
    if (res && res.success && res.data) {
      return res.data;
    }
    throw new Error(res?.error || 'Unable to verify two-factor settings.');
  } catch (err) {
    console.warn('API /api/auth/2fa/status failed:', err);
    throw err;
  }
}

/**
 * Generate Google Authenticator TOTP Setup (Secret & QR Code)
 */
export async function generateTotpSetup(email: string): Promise<TotpSetupResponse> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await postApi('/api/auth/2fa/generate-secret', { email: cleanEmail });
    if (res && res.success) {
      return res;
    }
    throw new Error(res?.error || 'Unable to generate an authenticator secret.');
  } catch (err) {
    console.warn('API /api/auth/2fa/generate-secret failed:', err);
    throw err;
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
  try {
    return await postApi('/api/auth/2fa/verify-setup', {
      email: cleanEmail,
      secret,
      code,
    });
  } catch (err) {
    console.warn('API /api/auth/2fa/verify-setup failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to enable authenticator verification.',
    };
  }
}

/**
 * Request an email verification code (sends via Resend)
 */
export async function sendEmail2FaCode(email: string): Promise<{ success: boolean; message?: string; error?: string; mode?: string; devOtp?: string }> {
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
  try {
    return await postApi('/api/auth/2fa/verify-email-setup', {
      email: cleanEmail,
      code,
    });
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to verify email security code.',
    };
  }
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
  try {
    const res = await postApi('/api/auth/2fa/verify-login-2fa', {
      email: cleanEmail,
      method,
      code,
    });
    return res;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to verify two-factor authentication code.',
    };
  }
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
  } catch (err) {
    console.warn('API /api/auth/2fa/get-backup-codes failed:', err);
  }

  return [];
}

/**
 * Regenerate a new set of 10 backup recovery codes
 */
export async function regenerateBackupCodes(email: string): Promise<{ success: boolean; backupCodes?: BackupCodeItem[]; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    return await postApi('/api/auth/2fa/regenerate-backup-codes', { email: cleanEmail });
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to regenerate backup codes.' };
  }
}

/**
 * Disable 2FA method (totp, email, or all)
 */
export async function disable2Fa(
  email: string,
  method: 'totp' | 'email' | 'all' = 'all'
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    return await postApi('/api/auth/2fa/disable', { email: cleanEmail, method });
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update 2FA configuration.' };
  }
}
