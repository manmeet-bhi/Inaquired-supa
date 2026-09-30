/**
 * TOTP (Time-based One-Time Password) utilities compliant with RFC 6238
 * Uses Web Crypto API for secure HMAC computation without external C-bindings
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(length: number = 20): string {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  let result = '';
  for (let i = 0; i < randomBytes.length; i++) {
    result += BASE32_CHARS.charAt(randomBytes[i] % 32);
  }
  return result;
}

export function base32ToUint8Array(base32: string): Uint8Array {
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_CHARS.indexOf(cleaned.charAt(i));
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

export function generateTotpUri(issuer: string, accountName: string, secret: string): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Computes a 6-digit TOTP code for a given timestamp
 */
export async function generateTotpCode(secretBase32: string, timestamp: number = Date.now()): Promise<string> {
  const epochSeconds = Math.floor(timestamp / 1000);
  const counter = Math.floor(epochSeconds / 30);

  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const keyBytes = base32ToUint8Array(secretBase32);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
  const signatureBytes = new Uint8Array(signature);
  const offset = signatureBytes[signatureBytes.length - 1] & 0x0f;

  const binary =
    ((signatureBytes[offset] & 0x7f) << 24) |
    ((signatureBytes[offset + 1] & 0xff) << 16) |
    ((signatureBytes[offset + 2] & 0xff) << 8) |
    (signatureBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies user-entered token against TOTP secret with a +/- 1 step (30s) clock drift tolerance window
 */
export async function verifyTotpToken(secretBase32: string, token: string): Promise<boolean> {
  const sanitizedToken = token.trim();
  if (sanitizedToken.length !== 6 || !/^\d{6}$/.test(sanitizedToken)) {
    return false;
  }

  const now = Date.now();
  // Check current window, previous 30s, and next 30s for time drift tolerance
  for (const offset of [-30000, 0, 30000]) {
    try {
      const expected = await generateTotpCode(secretBase32, now + offset);
      if (expected === sanitizedToken) {
        return true;
      }
    } catch (e) {
      console.error('TOTP verification error:', e);
    }
  }
  return false;
}

/**
 * Generates 8 one-time emergency backup recovery codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < count; i++) {
    let code = '';
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    for (let j = 0; j < 8; j++) {
      code += chars[array[j] % chars.length];
      if (j === 3) code += '-';
    }
    codes.push(code);
  }
  return codes;
}
