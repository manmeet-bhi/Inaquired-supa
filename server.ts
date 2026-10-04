import express from 'express';
import fs from 'fs';
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
import {
  handleRobotsTxt,
  handleSitemapXml,
  handleSeoSummary
} from './src/server/seoHandlers.ts';
import { handlePublicJobs } from './src/server/publicJobsHandler.ts';
import { getRedirectForPath } from './src/services/redirectService.ts';
import { generateMetadata, injectMetadataIntoHtml } from './src/lib/seo/seoEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory sliding-window IP rate limiter to defend against brute force attacks
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimiter(limit: number = 20, windowMs: number = 15 * 60 * 1000) {
  return (req: any, res: any, next: any) => {
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

// Search Engine Optimization (SEO) & Web Crawler Endpoints
app.get('/robots.txt', (req, res) => handleRobotsTxt(req, res));
app.get('/sitemap.xml', (req, res) => handleSitemapXml(req, res));
app.get('/api/seo/summary', (req, res) => handleSeoSummary(req, res));
app.get('/api/public/jobs', (req, res) => handlePublicJobs(req, res));

// 301 / 308 Permanent SEO Redirect Middleware
app.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/assets') || req.path.includes('.')) {
    return next();
  }

  try {
    const redir = await getRedirectForPath(req.path);
    if (redir) {
      return res.redirect(redir.status, redir.destination);
    }
  } catch (e) {
    // Proceed if lookup fails
  }

  next();
});

// Serve frontend static assets (js, css, images)
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath, { index: false }));

// Server-Side Metadata Pre-Rendering & HTML Fallback
app.get('*', async (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send('Application build not found. Please run npm run build.');
  }

  try {
    const rawHtml = fs.readFileSync(indexPath, 'utf-8');
    const origin = `${req.protocol}://${req.get('host') || 'inaquired.app'}`;
    const meta = await generateMetadata(req.path, origin);
    const renderedHtml = injectMetadataIntoHtml(rawHtml, meta);

    res.status(meta.statusCode || 200).send(renderedHtml);
  } catch (err) {
    console.error('[Server SEO Engine] HTML injection error:', err);
    res.sendFile(indexPath);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`inaquired server running on http://0.0.0.0:${PORT}`);
  console.log(`Auth Recovery & 2FA system active with rate limiting enabled.`);
});
