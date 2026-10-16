import dotenv from 'dotenv';
dotenv.config();
import { sendTwoFactorEmail } from '../src/server/resendEmailService.ts';

async function main() {
  console.log('--- Testing sendTwoFactorEmail ---');
  const result = await sendTwoFactorEmail({
    to: 'delivered@resend.dev',
    fullName: 'Test Admin',
    otpCode: '123456',
    expiresMinutes: 10
  });
  console.log('sendTwoFactorEmail returned:', result);
  if (!result.success) {
    process.exitCode = 1;
    console.error('Email delivery test failed:', result.error || 'Unknown delivery error');
  }
}

main().catch((error: unknown) => {
  process.exitCode = 1;
  console.error('Email delivery test threw:', error);
});
