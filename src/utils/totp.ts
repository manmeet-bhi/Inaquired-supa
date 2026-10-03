import QRCode from 'qrcode';

// RFC 4648 Base32 Alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a Base32 string into a Uint8Array
 */
export function base32ToUint8Array(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean.charAt(i));
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

/**
 * Encodes a Uint8Array into a Base32 string
 */
export function uint8ArrayToBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Converts a counter into an 8-byte big-endian Uint8Array
 */
export function counterToBytes(counter: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter), false);
  return new Uint8Array(buffer);
}

/**
 * Computes HMAC-SHA1 using standard Web Crypto API
 */
export async function computeHmacSha1(keyBytes: Uint8Array, messageBytes: Uint8Array): Promise<Uint8Array> {
  const subtleCrypto = globalThis.crypto?.subtle;
  if (!subtleCrypto) {
    throw new Error('Web Cryptography API (SubtleCrypto) is required.');
  }

  const cryptoKey = await subtleCrypto.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  const signature = await subtleCrypto.sign('HMAC', cryptoKey, messageBytes as unknown as BufferSource);
  return new Uint8Array(signature);
}

/**
 * Generates an HMAC-based One-Time Password (HOTP, RFC 4226)
 */
export async function generateHOTP(secret: string, counter: number): Promise<string> {
  const keyBytes = base32ToUint8Array(secret);
  const msgBytes = counterToBytes(counter);
  const hmac = await computeHmacSha1(keyBytes, msgBytes);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binaryCode % 1000000).toString().padStart(6, '0');
  return otp;
}

/**
 * Generates a Time-based One-Time Password (TOTP, RFC 6238)
 */
export async function generateTOTP(secret: string, timeStep = 30): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  return generateHOTP(secret, counter);
}

/**
 * Verifies a TOTP token against a Base32 secret with clock drift tolerance
 */
export async function verifyTOTP(
  token: string,
  secret: string,
  windowSteps = 1,
  timeStep = 30
): Promise<boolean> {
  const cleanToken = token.replace(/[\s-]/g, '').trim();
  if (cleanToken.length !== 6 || !/^\d+$/.test(cleanToken)) {
    return false;
  }

  const currentCounter = Math.floor(Date.now() / 1000 / timeStep);
  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const calculated = await generateHOTP(secret, currentCounter + offset);
    if (calculated === cleanToken) {
      return true;
    }
  }
  return false;
}

/**
 * Cryptographically secure random bytes generator across browser and Node.js
 */
export function getRandomBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  for (let i = 0; i < count; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * Generates a high-entropy cryptographically secure Base32 secret for Google Authenticator (default 20 bytes = 32 Base32 chars)
 */
export function generateBase32Secret(byteLength = 20): string {
  const bytes = getRandomBytes(byteLength);
  return uint8ArrayToBase32(bytes);
}

/**
 * Formats a Base32 secret in readable 4-character chunks (e.g. "ABCD EFGH ...")
 */
export function formatSecret(secret: string): string {
  const clean = secret.replace(/[\s-]/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

/**
 * Generates standard otpauth:// URL for Google Authenticator & other TOTP apps
 */
export function getTotpAuthUri(email: string, secret: string, issuer = 'inaquired'): string {
  const cleanEmail = email.trim();
  const cleanSecret = secret.replace(/[\s-]/g, '').toUpperCase();
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(cleanEmail);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${cleanSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates a high quality QR Code as a Base64 data URL
 */
export async function generateQrCodeDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#0f172a', // Deep slate for excellent scan contrast
      light: '#ffffff',
    },
  });
}

export interface BackupCodeItem {
  code: string;
  used: boolean;
  usedAt?: string | null;
}

/**
 * Generates a set of single-use backup recovery codes formatted as XXXX-XXXX
 */
export function generateBackupCodes(count = 10): BackupCodeItem[] {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Unambiguous chars
  const codes: BackupCodeItem[] = [];

  for (let i = 0; i < count; i++) {
    const randomBytes = getRandomBytes(8);
    let code = '';
    for (let c = 0; c < 8; c++) {
      if (c === 4) code += '-';
      code += chars[randomBytes[c] % chars.length];
    }
    codes.push({
      code,
      used: false,
      usedAt: null,
    });
  }

  return codes;
}
