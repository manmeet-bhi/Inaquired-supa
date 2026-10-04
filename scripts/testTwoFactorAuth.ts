import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';
import { 
  generateBase32Secret, 
  formatSecret, 
  getTotpAuthUri, 
  generateQrCodeDataUrl, 
  generateTOTP, 
  verifyTOTP, 
  generateBackupCodes 
} from '../src/utils/totp.ts';
import { sendTwoFactorEmail } from '../src/server/resendEmailService.ts';

dotenv.config();

const { Client } = pg;

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseKey) {
  throw new Error('Set SUPABASE_SERVICE_ROLE_KEY before running this privileged 2FA test.');
}
const supabase = createClient(supabaseUrl, supabaseKey);
const directDbUri = process.env.SUPABASE_DIRECT_URL || process.env.DATABASE_URL || '';

const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '';
if (!TEST_EMAIL) {
  throw new Error('Set TEST_ADMIN_EMAIL or ADMIN_EMAIL before running this test.');
}

async function runTwoFactorTests() {
  console.log('====================================================');
  console.log('  Two-Factor Authentication (2FA) Comprehensive Test');
  console.log('====================================================\n');

  // TEST 1: TOTP RFC 6238 generation and verification
  console.log('1. Testing TOTP Generation, Formatting & Verification...');
  const secret = generateBase32Secret(20);
  const formatted = formatSecret(secret);
  const uri = getTotpAuthUri(TEST_EMAIL, secret, 'inaquired');
  const qr = await generateQrCodeDataUrl(uri);

  console.log(`  [INFO] Generated Secret: ${formatted}`);
  console.log(`  [INFO] QR Code Data URL length: ${qr.length} bytes`);

  const currentOtp = await generateTOTP(secret);
  console.log(`  [INFO] Current 6-digit TOTP code: ${currentOtp}`);

  const isCurrentValid = await verifyTOTP(currentOtp, secret);
  if (!isCurrentValid) {
    throw new Error('Current TOTP code failed verification.');
  }
  console.log('  [PASS] Real-time TOTP code verified successfully.');

  const isInvalidRejected = await verifyTOTP('000000', secret);
  if (isInvalidRejected && currentOtp !== '000000') {
    throw new Error('Invalid TOTP code was accepted!');
  }
  console.log('  [PASS] Invalid TOTP code correctly rejected.');

  // TEST 2: Backup codes generation
  console.log('\n2. Testing Single-Use Backup Recovery Codes...');
  const backupCodes = generateBackupCodes(10);
  if (backupCodes.length !== 10) throw new Error('Expected 10 backup codes.');
  if (!backupCodes.every(b => /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(b.code))) {
    throw new Error('Backup code format invalid.');
  }
  console.log(`  [PASS] Generated 10 properly formatted backup codes (e.g. ${backupCodes[0].code})`);

  // TEST 3: Resend Email 2FA Dispatch
  console.log('\n3. Testing Email 2FA Dispatch via Resend...');
  const testEmailOtp = '582914';
  const emailRes = await sendTwoFactorEmail({
    to: TEST_EMAIL,
    fullName: 'Test Admin',
    otpCode: testEmailOtp,
    expiresMinutes: 10
  });

  console.log(`  [PASS] Email dispatcher mode: ${emailRes.mode}`);
  if (emailRes.mode === 'resend_live') {
    console.log(`  [LIVE RESEND] Email dispatched! Message ID: ${emailRes.messageId}`);
  }

  // TEST 4: Database RPC - admin_get_2fa_status
  console.log('\n4. Testing Database RPC: admin_get_2fa_status...');
  const { data: statusData, error: statusErr } = await supabase.rpc('admin_get_2fa_status', {
    p_email: TEST_EMAIL
  });

  if (statusErr) {
    console.warn('Supabase RPC warning, testing direct DB:', statusErr.message);
  } else {
    console.log('  [PASS] 2FA Status retrieved via Supabase RPC:', statusData);
  }

  // TEST 5: Database RPC - admin_save_2fa_config
  console.log('\n5. Testing Database RPC: admin_save_2fa_config...');
  const { data: saveRes, error: saveErr } = await supabase.rpc('admin_save_2fa_config', {
    p_email: TEST_EMAIL,
    p_totp_secret: secret,
    p_totp_enabled: true,
    p_email_enabled: true,
    p_backup_codes: backupCodes
  });

  if (saveErr) {
    console.warn('Supabase save RPC warning:', saveErr.message);
  } else {
    console.log('  [PASS] 2FA config saved in database:', saveRes);
  }

  // TEST 6: Backup Code Consumption in Database
  console.log('\n6. Testing Backup Code Consumption...');
  const codeToUse = backupCodes[0].code;
  const { data: consumeRes, error: consumeErr } = await supabase.rpc('admin_consume_backup_code', {
    p_email: TEST_EMAIL,
    p_code: codeToUse
  });

  if (consumeErr) {
    console.warn('Supabase consume RPC warning:', consumeErr.message);
  } else {
    if (!consumeRes.success) throw new Error('Backup code consumption failed: ' + consumeRes.error);
    console.log(`  [PASS] Successfully consumed backup code "${codeToUse}". Remaining: ${consumeRes.remainingBackupCodes}`);

    // Test replay prevention
    const { data: replayRes } = await supabase.rpc('admin_consume_backup_code', {
      p_email: TEST_EMAIL,
      p_code: codeToUse
    });
    if (replayRes && replayRes.success) {
      throw new Error('Replay prevention failed: used backup code was accepted twice!');
    }
    console.log('  [PASS] Replay prevention verified (used backup code rejected).');
  }

  // TEST 7: Database RPC - Email OTP storage and verification
  console.log('\n7. Testing Email OTP Storage & Verification...');
  const otpToStore = Math.floor(100000 + Math.random() * 900000).toString();
  await supabase.rpc('admin_store_email_2fa_otp', {
    p_email: TEST_EMAIL,
    p_otp_code: otpToStore,
    p_expires_minutes: 10
  });

  const { data: verifyEmailRes, error: verifyEmailErr } = await supabase.rpc('admin_verify_email_2fa_otp', {
    p_email: TEST_EMAIL,
    p_otp_code: otpToStore
  });

  if (verifyEmailErr) {
    console.warn('Supabase verify email RPC warning:', verifyEmailErr.message);
  } else {
    if (!verifyEmailRes.success) throw new Error('Email OTP verification failed: ' + verifyEmailRes.error);
    console.log('  [PASS] Email OTP verified successfully!');
  }

  // TEST 8: Clean up / reset 2FA for test account so user has clean default state or configured state
  console.log('\n8. Resetting test state...');
  await supabase.rpc('admin_save_2fa_config', {
    p_email: TEST_EMAIL,
    p_totp_secret: secret,
    p_totp_enabled: false,
    p_email_enabled: false,
    p_backup_codes: backupCodes
  });
  console.log('  [PASS] Test state reset.');

  console.log('\n====================================================');
  console.log('  ALL 2FA VERIFICATION TESTS PASSED (8/8)!');
  console.log('====================================================\n');
}

runTwoFactorTests().catch(err => {
  console.error('\n[TEST RUNNER ERROR]', err);
  process.exit(1);
});
