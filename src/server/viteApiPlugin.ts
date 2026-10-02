import type { Plugin } from 'vite';
import {
  handleForgotPassword,
  handleVerifyRecoveryToken,
  handleResetPassword,
  sendJsonResponse
} from './recoveryApiHandlers.ts';

export function viteAccountRecoveryPlugin(): Plugin {
  return {
    name: 'vite-account-recovery-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.statusCode = 200;
          res.end();
          return;
        }

        if (url === '/api/auth/forgot-password' && req.method === 'POST') {
          return handleForgotPassword(req, res);
        }

        if (url === '/api/auth/verify-recovery-token' && req.method === 'POST') {
          return handleVerifyRecoveryToken(req, res);
        }

        if (url === '/api/auth/reset-password' && req.method === 'POST') {
          return handleResetPassword(req, res);
        }

        if (url === '/api/auth/health' && req.method === 'GET') {
          const hasApiKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_'));
          return sendJsonResponse(res, 200, {
            status: 'ok',
            service: 'inaquired-auth-recovery',
            resendConfigured: hasApiKey,
            fromEmail: process.env.RESEND_FROM_EMAIL || 'inaquired <onboarding@resend.dev>'
          });
        }

        next();
      });
    }
  };
}
