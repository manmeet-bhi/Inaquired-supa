import { supabase } from '../lib/supabase';

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  mode?: 'resend_live' | 'dev_fallback';
  devOtp?: string;
  previewUrl?: string;
  error?: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  email?: string;
  expiresAt?: string;
  error?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  email?: string;
  error?: string;
}

export interface RecoverySystemHealth {
  status: string;
  resendConfigured: boolean;
  fromEmail: string;
}

/**
 * Sends a password reset request via API or Supabase fallback
 */
export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  // Attempt API route first (which triggers Resend email dispatch)
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send recovery email.');
    }

    return data;
  } catch (apiErr: any) {
    console.warn('[API Request Notice] Falling back to direct Supabase RPC:', apiErr.message);

    // Fallback directly to Supabase RPC if API is offline
    const fallbackToken = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_request_password_reset', {
      p_email: cleanEmail,
      p_token: fallbackToken,
      p_otp_code: fallbackOtp,
      p_expires_minutes: 30
    });

    if (rpcErr) {
      throw new Error(rpcErr.message);
    }

    if (!rpcData || !rpcData.exists) {
      throw new Error('No administrator account was found with that email address.');
    }

    const resetUrl = `${window.location.origin}/admin/reset-password?token=${fallbackToken}&email=${encodeURIComponent(cleanEmail)}`;

    return {
      success: true,
      message: `Recovery code generated. (${cleanEmail})`,
      mode: 'dev_fallback',
      devOtp: fallbackOtp,
      previewUrl: resetUrl
    };
  }
}

/**
 * Validates whether a token or 6-digit OTP code is valid and active
 */
export async function verifyRecoveryToken(tokenOrOtp: string, email?: string): Promise<VerifyTokenResponse> {
  const cleanToken = tokenOrOtp.trim();

  if (!cleanToken) {
    return { valid: false, error: 'A recovery code is required.' };
  }

  try {
    const res = await fetch('/api/auth/verify-recovery-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: cleanToken, email: email?.trim() || null }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { valid: false, error: data.error || 'Invalid or expired recovery code.' };
    }

    return data;
  } catch (err: any) {
    console.warn('[API Verify Notice] Falling back to direct Supabase RPC:', err.message);

    const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_verify_recovery_token', {
      p_token_or_otp: cleanToken,
      p_email: email?.trim() || null
    });

    if (rpcErr || !rpcData || !rpcData.valid) {
      return {
        valid: false,
        error: rpcData?.error || rpcErr?.message || 'Invalid or expired recovery code.'
      };
    }

    return {
      valid: true,
      email: rpcData.email,
      expiresAt: rpcData.expires_at
    };
  }
}

/**
 * Submits the new password using the validated token
 */
export async function resetAdminPassword(
  tokenOrOtp: string,
  newPassword: string,
  email?: string
): Promise<ResetPasswordResponse> {
  const cleanToken = tokenOrOtp.trim();
  const cleanPassword = newPassword.trim();

  if (!cleanToken) {
    throw new Error('Recovery token or code is missing.');
  }

  if (cleanPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: cleanToken,
        newPassword: cleanPassword,
        email: email?.trim() || null
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password.');
    }

    return data;
  } catch (err: any) {
    console.warn('[API Reset Notice] Falling back to direct Supabase RPC:', err.message);

    const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_complete_password_reset', {
      p_token_or_otp: cleanToken,
      p_new_password: cleanPassword,
      p_email: email?.trim() || null
    });

    if (rpcErr) {
      throw new Error(rpcErr.message);
    }

    if (!rpcData || !rpcData.success) {
      throw new Error('Unable to reset password. The code may have expired.');
    }

    return {
      success: true,
      message: 'Password successfully reset.',
      email: rpcData.email
    };
  }
}

/**
 * Checks system health for Resend and recovery service
 */
export async function checkRecoveryHealth(): Promise<RecoverySystemHealth> {
  try {
    const res = await fetch('/api/auth/health');
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return {
    status: 'standalone',
    resendConfigured: false,
    fromEmail: 'onboarding@resend.dev'
  };
}
