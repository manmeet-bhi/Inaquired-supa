import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  handleForgotPassword,
  handleVerifyRecoveryToken,
  handleResetPassword,
  sendJsonResponse
} from './src/server/recoveryApiHandlers.ts';
import {
  handleGet2FaStatus,
  handleGenerateTotpSetup,
  handleVerifyTotpSetup,
  handleSendEmail2FaCode,
  handleVerifyEmail2FaSetup,
  handleVerifyLogin2Fa,
  handleRegenerateBackupCodes,
  handleGetBackupCodes,
  handleDisable2Fa
} from './src/server/twoFactorApiHandlers.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory sliding-window IP rate limiter to defend against brute force attacks
const rateLimitStore = new Map();

function rateLimiter(limit = 20, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const ip = String(req.socket?.remoteAddress || 'unknown');
    const now = Date.now();
    const entry = rateLimitStore.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    entry.count++;
    rateLimitStore.set(ip, entry);

    if (entry.count > limit) {
      return sendJsonResponse(res, 429, {
        success: false,
        error: 'Too many authentication attempts. Please try again in 15 minutes.'
      });
    }

    next();
  };
}

// Auth Recovery Endpoints with rate limiting
app.post('/api/auth/forgot-password', rateLimiter(10), (req, res) => handleForgotPassword(req, res));
app.post('/api/auth/verify-recovery-token', rateLimiter(15), (req, res) => handleVerifyRecoveryToken(req, res));
app.post('/api/auth/reset-password', rateLimiter(10), (req, res) => handleResetPassword(req, res));

// Two-Factor Authentication (2FA) Endpoints with rate limiting
app.post('/api/auth/2fa/status', (req, res) => handleGet2FaStatus(req, res));
app.post('/api/auth/2fa/generate-secret', (req, res) => handleGenerateTotpSetup(req, res));
app.post('/api/auth/2fa/verify-setup', rateLimiter(15), (req, res) => handleVerifyTotpSetup(req, res));
app.post('/api/auth/2fa/send-email-code', rateLimiter(10), (req, res) => handleSendEmail2FaCode(req, res));
app.post('/api/auth/2fa/verify-email-setup', rateLimiter(15), (req, res) => handleVerifyEmail2FaSetup(req, res));
app.post('/api/auth/2fa/verify-login-2fa', rateLimiter(15), (req, res) => handleVerifyLogin2Fa(req, res));
app.post('/api/auth/2fa/regenerate-backup-codes', (req, res) => handleRegenerateBackupCodes(req, res));
app.post('/api/auth/2fa/get-backup-codes', (req, res) => handleGetBackupCodes(req, res));
app.post('/api/auth/2fa/disable', (req, res) => handleDisable2Fa(req, res));

app.get('/api/auth/health', (req, res) => {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_'));
  return sendJsonResponse(res, 200, {
    status: 'ok',
    service: 'inaquired-auth-recovery-2fa',
    resendConfigured: hasApiKey,
    fromEmail: process.env.RESEND_FROM_EMAIL || ''
  });
});

// Serve frontend static build
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`inaquired server running on http://0.0.0.0:${PORT}`);
  console.log(`Auth Recovery system with Resend active.`);
});
