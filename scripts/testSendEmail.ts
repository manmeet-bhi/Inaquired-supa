import dotenv from 'dotenv';
dotenv.config();
import { sendTwoFactorEmail } from '../src/server/resendEmailService.ts';

async function main() {
  console.log('--- Testing sendTwoFactorEmail ---');
  try {
    const res = await sendTwoFactorEmail({
      to: 'delivered@resend.dev',
      fullName: 'Test Admin',
      otpCode: '123456',
      expiresMinutes: 10
    });
    console.log('sendTwoFactorEmail returned:', res);
  } catch (err: any) {
    console.error('sendTwoFactorEmail threw:', err);
  }
}

main();
