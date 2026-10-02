import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  handleForgotPassword,
  handleVerifyRecoveryToken,
  handleResetPassword,
  sendJsonResponse
} from './src/server/recoveryApiHandlers.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Auth Recovery Endpoints
app.post('/api/auth/forgot-password', (req, res) => handleForgotPassword(req, res));
app.post('/api/auth/verify-recovery-token', (req, res) => handleVerifyRecoveryToken(req, res));
app.post('/api/auth/reset-password', (req, res) => handleResetPassword(req, res));
app.get('/api/auth/health', (req, res) => {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_'));
  return sendJsonResponse(res, 200, {
    status: 'ok',
    service: 'inaquired-auth-recovery',
    resendConfigured: hasApiKey,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'inaquired <onboarding@resend.dev>'
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
