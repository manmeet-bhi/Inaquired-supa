import type { Plugin } from 'vite';

// Allow opt-in TLS bypass only if explicitly requested for corporate/antivirus SSL proxies
if (process.env.ALLOW_SELF_SIGNED_CERTS === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import {
  handleForgotPassword,
  handleVerifyRecoveryToken,
  handleResetPassword,
  sendJsonResponse
} from './recoveryApiHandlers.ts';
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
} from './twoFactorApiHandlers.ts';
import {
  handleRobotsTxt,
  handleSitemapXml,
  handleSeoSummary
} from './seoHandlers.ts';
import { handlePublicJobs } from './publicJobsHandler.ts';
import { getRedirectForPath } from '../services/redirectService.ts';
import { generateMetadata, injectMetadataIntoHtml } from '../lib/seo/seoEngine.ts';

export function viteAccountRecoveryPlugin(): Plugin {
  return {
    name: 'vite-account-recovery-plugin',
    async transformIndexHtml(html, ctx) {
      let url = ctx.originalUrl?.split('?')[0] || ctx.path || '/';
      if (url === '/index.html' || !url || url === '') {
        url = '/';
      }
      if (url.startsWith('/admin') || url.startsWith('/api') || url.startsWith('/@')) {
        return html;
      }
      try {
        const anyCtx = ctx as any;
        const host = anyCtx.req?.headers?.host || 'inaquired.app';
        const proto = anyCtx.req?.headers?.['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
        const origin = host.includes('localhost') ? `${proto}://${host}` : 'https://inaquired.app';
        let meta = await generateMetadata(url, origin);
        if (meta.statusCode === 404 && (url === '/' || url === '/index.html')) {
          meta = await generateMetadata('/', origin);
        }
        return injectMetadataIntoHtml(html, meta);
      } catch (err) {
        console.warn('[Vite SEO Engine] Error injecting server metadata:', err);
        return html;
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        // 301 / 308 Permanent SEO Redirect Interception
        if (url && (req.method === 'GET' || req.method === 'HEAD') && !url.startsWith('/api') && !url.startsWith('/@') && !url.includes('.')) {
          try {
            const redir = await getRedirectForPath(url);
            if (redir) {
              res.statusCode = redir.status;
              res.setHeader('Location', redir.destination);
              res.end();
              return;
            }
          } catch (e) {
            // Ignore redirect lookup errors and proceed
          }
        }

        // SEO and Crawler Endpoints
        if ((url === '/robots.txt') && (req.method === 'GET' || req.method === 'HEAD')) {
          return handleRobotsTxt(req, res);
        }

        if ((url === '/sitemap.xml') && (req.method === 'GET' || req.method === 'HEAD')) {
          return handleSitemapXml(req, res);
        }

        if (url === '/api/seo/summary' && req.method === 'GET') {
          return handleSeoSummary(req, res);
        }

        if (url === '/api/public/jobs' && req.method === 'GET') {
          return handlePublicJobs(req, res);
        }

        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.statusCode = 200;
          res.end();
          return;
        }

        // Account Recovery
        if (url === '/api/auth/forgot-password' && req.method === 'POST') {
          return handleForgotPassword(req, res);
        }

        if (url === '/api/auth/verify-recovery-token' && req.method === 'POST') {
          return handleVerifyRecoveryToken(req, res);
        }

        if (url === '/api/auth/reset-password' && req.method === 'POST') {
          return handleResetPassword(req, res);
        }

        // Two-Factor Authentication (2FA) Endpoints
        if (url === '/api/auth/2fa/status' && req.method === 'POST') {
          return handleGet2FaStatus(req, res);
        }

        if (url === '/api/auth/2fa/generate-secret' && req.method === 'POST') {
          return handleGenerateTotpSetup(req, res);
        }

        if (url === '/api/auth/2fa/verify-setup' && req.method === 'POST') {
          return handleVerifyTotpSetup(req, res);
        }

        if (url === '/api/auth/2fa/send-email-code' && req.method === 'POST') {
          return handleSendEmail2FaCode(req, res);
        }

        if (url === '/api/auth/2fa/verify-email-setup' && req.method === 'POST') {
          return handleVerifyEmail2FaSetup(req, res);
        }

        if (url === '/api/auth/2fa/verify-login-2fa' && req.method === 'POST') {
          return handleVerifyLogin2Fa(req, res);
        }

        if (url === '/api/auth/2fa/regenerate-backup-codes' && req.method === 'POST') {
          return handleRegenerateBackupCodes(req, res);
        }

        if (url === '/api/auth/2fa/get-backup-codes' && req.method === 'POST') {
          return handleGetBackupCodes(req, res);
        }

        if (url === '/api/auth/2fa/disable' && req.method === 'POST') {
          return handleDisable2Fa(req, res);
        }

        if (url === '/api/auth/health' && req.method === 'GET') {
          const hasApiKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_'));
          return sendJsonResponse(res, 200, {
            status: 'ok',
            service: 'inaquired-auth-recovery-2fa',
            resendConfigured: hasApiKey,
            fromEmail: process.env.RESEND_FROM_EMAIL || ''
          });
        }

        next();
      });
    }
  };
}
