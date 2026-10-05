import {
  handleForgotPassword,
  handleVerifyRecoveryToken,
  handleResetPassword,
  getRecoverySystemHealth,
  sendJsonResponse
} from '../../src/server/recoveryApiHandlers.ts';
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
} from '../../src/server/twoFactorApiHandlers.ts';
import { handleSeoSummary } from '../../src/server/seoHandlers.ts';
import { handlePublicJobs } from '../../src/server/publicJobsHandler.ts';

export const handler = async (event: any, context: any) => {
  // Normalize request path
  let rawPath = event.path || '';
  if (rawPath.startsWith('/.netlify/functions/api')) {
    rawPath = rawPath.replace('/.netlify/functions/api', '/api');
  }
  const queryString = new URLSearchParams(event.queryStringParameters || {}).toString();
  const requestUrl = queryString ? `${rawPath}?${queryString}` : rawPath;

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  let statusCode = 200;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
  let body = '';

  const res = {
    get statusCode() { return statusCode; },
    set statusCode(code: number) { statusCode = code; },
    setHeader(key: string, val: string) { headers[key] = val; },
    getHeader(key: string) { return headers[key]; },
    end(data?: string) {
      if (data) body = data;
    },
    json(data: any) {
      body = JSON.stringify(data);
      headers['Content-Type'] = 'application/json';
    }
  };

  let parsedBody: any = {};
  if (event.body) {
    try {
      parsedBody = event.isBase64Encoded 
        ? JSON.parse(Buffer.from(event.body, 'base64').toString('utf8'))
        : JSON.parse(event.body);
    } catch {
      parsedBody = {};
    }
  }

  const req = {
    method: event.httpMethod,
    url: requestUrl,
    originalUrl: requestUrl,
    path: rawPath,
    headers: event.headers || {},
    body: parsedBody,
    socket: {
      remoteAddress: event.headers?.['x-nf-client-connection-ip']
        || event.headers?.['client-ip']
        || event.headers?.['x-forwarded-for']
        || 'unknown'
    },
    on(name: string, cb: Function) {
      if (name === 'data' && event.body) cb(typeof event.body === 'string' ? event.body : JSON.stringify(event.body));
      if (name === 'end') cb();
    }
  };

  try {
    if (rawPath === '/api/auth/2fa/status' && event.httpMethod === 'POST') {
      await handleGet2FaStatus(req, res);
    } else if (rawPath === '/api/auth/2fa/generate-secret' && event.httpMethod === 'POST') {
      await handleGenerateTotpSetup(req, res);
    } else if (rawPath === '/api/auth/2fa/verify-setup' && event.httpMethod === 'POST') {
      await handleVerifyTotpSetup(req, res);
    } else if (rawPath === '/api/auth/2fa/send-email-code' && event.httpMethod === 'POST') {
      await handleSendEmail2FaCode(req, res);
    } else if (rawPath === '/api/auth/2fa/verify-email-setup' && event.httpMethod === 'POST') {
      await handleVerifyEmail2FaSetup(req, res);
    } else if (rawPath === '/api/auth/2fa/verify-login-2fa' && event.httpMethod === 'POST') {
      await handleVerifyLogin2Fa(req, res);
    } else if (rawPath === '/api/auth/2fa/regenerate-backup-codes' && event.httpMethod === 'POST') {
      await handleRegenerateBackupCodes(req, res);
    } else if (rawPath === '/api/auth/2fa/get-backup-codes' && event.httpMethod === 'POST') {
      await handleGetBackupCodes(req, res);
    } else if (rawPath === '/api/auth/2fa/disable' && event.httpMethod === 'POST') {
      await handleDisable2Fa(req, res);
    } else if (rawPath === '/api/auth/forgot-password' && event.httpMethod === 'POST') {
      await handleForgotPassword(req, res);
    } else if (rawPath === '/api/auth/verify-recovery-token' && event.httpMethod === 'POST') {
      await handleVerifyRecoveryToken(req, res);
    } else if (rawPath === '/api/auth/reset-password' && event.httpMethod === 'POST') {
      await handleResetPassword(req, res);
    } else if (rawPath === '/api/seo/summary' && event.httpMethod === 'GET') {
      await handleSeoSummary(req, res);
    } else if (rawPath === '/api/public/jobs' && event.httpMethod === 'GET') {
      await handlePublicJobs(req, res);
    } else if (rawPath === '/api/auth/health' && event.httpMethod === 'GET') {
      sendJsonResponse(res, 200, getRecoverySystemHealth());
    } else {
      sendJsonResponse(res, 404, { success: false, error: `Endpoint not found: ${rawPath}` });
    }
  } catch (err: any) {
    sendJsonResponse(res, 500, { success: false, error: err.message || 'Internal server error' });
  }

  return {
    statusCode,
    headers,
    body,
  };
};
