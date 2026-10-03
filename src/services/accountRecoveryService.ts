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
    console.warn('[API Request Notice] Password recovery endpoint failed:', apiErr.message);
    throw new Error('Password recovery is temporarily unavailable. Please try again later.');
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
    console.warn('[API Verify Notice] Recovery endpoint failed:', err.message);
    return { valid: false, error: 'Recovery verification is temporarily unavailable.' };
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
    console.warn('[API Reset Notice] Recovery endpoint failed:', err.message);
    throw new Error('Password reset is temporarily unavailable. Please try again later.');
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
