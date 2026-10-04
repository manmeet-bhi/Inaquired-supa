import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { buildPasswordResetHtml, buildTwoFactorEmailHtml, sendPasswordResetEmail } from '../src/server/resendEmailService.ts';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseKey) {
  throw new Error('Set SUPABASE_SERVICE_ROLE_KEY before running this privileged recovery test.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL || '';
const ORIGINAL_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';
const TEMPORARY_NEW_PASSWORD = process.env.TEST_ADMIN_NEW_PASSWORD || '';

if (!TEST_EMAIL || !ORIGINAL_PASSWORD || !TEMPORARY_NEW_PASSWORD) {
  throw new Error('Set TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, and TEST_ADMIN_NEW_PASSWORD before running this test.');
}

async function runRecoveryVerification() {
  console.log('====================================================');
  console.log('  Account Recovery & Resend System Verification Test');
  console.log('====================================================\n');

  // 1. Verify Resend Email HTML generator
  console.log('1. Testing Resend Email Template Generation...');
  const sampleToken = crypto.randomBytes(32).toString('hex');
  const sampleOtp = '482910';
  const sampleUrl = `http://localhost:3000/admin/reset-password?token=${sampleToken}&email=${encodeURIComponent(TEST_EMAIL)}`;

  const html = buildPasswordResetHtml({
    to: TEST_EMAIL,
    fullName: 'Test Administrator',
    resetUrl: sampleUrl,
    otpCode: sampleOtp,
    expiresMinutes: 30,
    sentAt: new Date('2026-10-03T12:00:00.000Z')
  });

  if (
    !html.includes(sampleOtp) ||
    !html.includes('Admin account recovery') ||
    !html.includes('Requested:') ||
    !html.includes('Expires:') ||
    !html.includes('Oct 3, 2026, 12:00 PM UTC') ||
    html.includes(sampleUrl) ||
    html.includes(TEST_EMAIL)
  ) {
    throw new Error('Resend HTML template failed validation checks.');
  }
  console.log('  [PASS] Resend HTML email template generated successfully.');
  console.log(`  [INFO] Recovery email identifies its purpose, includes UTC timing, and does not expose account/link details.`);

  const twoFactorHtml = buildTwoFactorEmailHtml({
    to: TEST_EMAIL,
    otpCode: sampleOtp,
    expiresMinutes: 10,
    sentAt: new Date('2026-10-03T12:00:00.000Z')
  });
  if (
    !twoFactorHtml.includes(sampleOtp) ||
    !twoFactorHtml.includes('Admin sign-in verification') ||
    !twoFactorHtml.includes('Requested:') ||
    !twoFactorHtml.includes('Expires:') ||
    !twoFactorHtml.includes('Oct 3, 2026, 12:00 PM UTC') ||
    twoFactorHtml.includes(TEST_EMAIL)
  ) {
    throw new Error('2FA email template failed validation checks.');
  }
  console.log('  [PASS] 2FA email explains the sign-in purpose and includes UTC timing without account details.');

  // 2. Test sendPasswordResetEmail function
  console.log('\n2. Testing sendPasswordResetEmail() dispatcher...');
  const sendRes = await sendPasswordResetEmail({
    to: TEST_EMAIL,
    fullName: 'Primary Admin',
    resetUrl: sampleUrl,
    otpCode: sampleOtp
  });
  console.log(`  [PASS] Email dispatcher returned mode: ${sendRes.mode}`);
  if (sendRes.mode === 'resend_live') {
    console.log(`  [LIVE RESEND] Email dispatched! Message ID: ${sendRes.messageId}`);
  } else {
    console.log('  [DEV FALLBACK] Ready for live Resend API Key when provided.');
  }

  // 3. Test Database RPC: admin_request_password_reset
  console.log('\n3. Testing Database RPC: admin_request_password_reset...');
  const actualToken = crypto.randomBytes(32).toString('hex');
  const actualOtp = crypto.randomInt(100000, 1000000).toString();

  const { data: requestData, error: reqErr } = await supabase.rpc('admin_request_password_reset', {
    p_email: TEST_EMAIL,
    p_token: actualToken,
    p_otp_code: actualOtp,
    p_expires_minutes: 30
  });

  if (reqErr) {
    throw new Error(`admin_request_password_reset failed: ${reqErr.message}`);
  }

  if (!requestData || !requestData.exists) {
    throw new Error(`User ${TEST_EMAIL} was not detected by recovery RPC.`);
  }

  console.log('  [PASS] Password reset request registered in database.');
  console.log(`  [INFO] User: ${requestData.full_name} (${requestData.email})`);
  console.log(`  [INFO] Token: ${requestData.token.substring(0, 16)}...`);
  console.log(`  [INFO] OTP Code: ${requestData.otp_code}`);
  console.log(`  [INFO] Expires at: ${requestData.expires_at}`);

  // 4. Test Database RPC: admin_verify_recovery_token
  console.log('\n4. Testing Token & OTP Verification...');
  const { data: verifyByToken, error: verifyErr1 } = await supabase.rpc('admin_verify_recovery_token', {
    p_token_or_otp: actualToken,
    p_email: TEST_EMAIL
  });

  if (verifyErr1 || !verifyByToken?.valid) {
    throw new Error(`Token verification failed: ${verifyErr1?.message || verifyByToken?.error}`);
  }
  console.log('  [PASS] Direct URL Token verification passed.');

  const { data: verifyByOtp, error: verifyErr2 } = await supabase.rpc('admin_verify_recovery_token', {
    p_token_or_otp: actualOtp,
    p_email: TEST_EMAIL
  });

  if (verifyErr2 || !verifyByOtp?.valid) {
    throw new Error(`OTP code verification failed: ${verifyErr2?.message || verifyByOtp?.error}`);
  }
  console.log('  [PASS] 6-Digit OTP Code verification passed.');

  // 5. Test Invalid Token Rejection
  console.log('\n5. Testing Invalid Token Rejection...');
  const { data: verifyFake } = await supabase.rpc('admin_verify_recovery_token', {
    p_token_or_otp: 'invalid_code_999999'
  });
  if (verifyFake?.valid) {
    throw new Error('Security flaw: Invalid token was accepted!');
  }
  console.log('  [PASS] Invalid recovery code was properly rejected.');

  // 6. Test Password Reset Execution
  console.log('\n6. Testing Password Reset Completion with Temporary Password...');
  const { data: completeData, error: completeErr } = await supabase.rpc('admin_complete_password_reset', {
    p_token_or_otp: actualOtp,
    p_new_password: TEMPORARY_NEW_PASSWORD,
    p_email: TEST_EMAIL
  });

  if (completeErr || !completeData?.success) {
    throw new Error(`admin_complete_password_reset failed: ${completeErr?.message}`);
  }
  console.log('  [PASS] Password updated successfully in database.');

  // 7. Verify login with the NEW password
  console.log('\n7. Verifying Supabase Authentication with New Password...');
  const { data: loginNew, error: loginErrNew } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEMPORARY_NEW_PASSWORD
  });

  if (loginErrNew) {
    throw new Error(`Login with updated password failed: ${loginErrNew.message}`);
  }
  console.log(`  [PASS] Successfully signed in with new password! User ID: ${loginNew.user?.id}`);

  // 8. Verify the used token cannot be reused (Replay Attack Prevention)
  console.log('\n8. Testing Token Invalidation (Replay Prevention)...');
  const { data: replayVerify } = await supabase.rpc('admin_verify_recovery_token', {
    p_token_or_otp: actualOtp
  });
  if (replayVerify?.valid) {
    throw new Error('Security flaw: Used token is still marked valid!');
  }
  console.log('  [PASS] Recovery code cannot be reused.');

  // 9. Restore original password for clean test cleanup
  console.log('\n9. Restoring original administrator credentials...');
  const restoreToken = crypto.randomBytes(32).toString('hex');
  const restoreOtp = '999111';

  await supabase.rpc('admin_request_password_reset', {
    p_email: TEST_EMAIL,
    p_token: restoreToken,
    p_otp_code: restoreOtp,
    p_expires_minutes: 5
  });

  await supabase.rpc('admin_complete_password_reset', {
    p_token_or_otp: restoreToken,
    p_new_password: ORIGINAL_PASSWORD,
    p_email: TEST_EMAIL
  });

  // Verify login with original password
  const { error: origLoginErr } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: ORIGINAL_PASSWORD
  });

  if (origLoginErr) {
    throw new Error(`Failed to restore original password: ${origLoginErr.message}`);
  }
  console.log('  [PASS] Original admin credentials restored and verified.');

  console.log('\n====================================================');
  console.log('  ALL ACCOUNT RECOVERY & RESEND TESTS PASSED (9/9)  ');
  console.log('====================================================\n');
}

runRecoveryVerification().catch((err) => {
  console.error('\nVerification Test Failed:', err);
  process.exit(1);
});
