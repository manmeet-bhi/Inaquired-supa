import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const uri = process.env.SUPABASE_DIRECT_URL || process.env.DATABASE_URL;

if (!uri) {
  console.error('[CRITICAL] Missing SUPABASE_DIRECT_URL or DATABASE_URL in environment variables.');
  process.exit(1);
}

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('[CRITICAL] Set ADMIN_EMAIL and ADMIN_PASSWORD before provisioning an administrator.');
}

async function createAdmin() {
  console.log(`Creating Admin user in Supabase Postgres...`);
  const client = new Client({
    connectionString: uri,
    ssl: { rejectUnauthorized: true }
  });
  await client.connect();

  try {
    // Check if user already exists
    const checkRes = await client.query('SELECT id, email FROM auth.users WHERE email = $1', [ADMIN_EMAIL]);
    
    if (checkRes.rows.length > 0) {
      console.log(`User ${ADMIN_EMAIL} already exists with ID: ${checkRes.rows[0].id}. Updating password...`);
      await client.query(`
        UPDATE auth.users 
        SET encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')),
            email_confirmed_at = NOW(),
            raw_user_meta_data = '{"role":"admin"}'::jsonb,
            updated_at = NOW()
        WHERE email = $2
      `, [ADMIN_PASSWORD, ADMIN_EMAIL]);
      console.log('Password updated successfully.');
    } else {
      console.log(`Inserting new admin user ${ADMIN_EMAIL}...`);
      
      const newIdRes = await client.query('SELECT gen_random_uuid() as id, extensions.crypt($1, extensions.gen_salt(\'bf\')) as enc_pass', [ADMIN_PASSWORD]);
      const newId = newIdRes.rows[0].id;
      const encPass = newIdRes.rows[0].enc_pass;

      await client.query(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
          confirmation_token, recovery_token, email_change_token_new, email_change
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated',
          $2, $3, NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
          '{"role":"admin"}'::jsonb, NOW(), NOW(), '', '', '', ''
        );
      `, [newId, ADMIN_EMAIL, encPass]);

      await client.query(`
        INSERT INTO auth.identities (
          id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          $1, $1, $1::text, json_build_object('sub', $1::text, 'email', $2::text)::jsonb,
          'email', NOW(), NOW(), NOW()
        );
      `, [newId, ADMIN_EMAIL]);

      await client.query(`
        INSERT INTO public.admin_users (id, email, full_name, role, status, created_at, updated_at)
        VALUES ($1, $2, 'Primary Administrator', 'superadmin', 'active', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [newId, ADMIN_EMAIL]);

      console.log('Inserted admin user and identity successfully.');
    }
  } finally {
    await client.end();
  }

  // Now test logging in with Supabase client!
  console.log(`\nVerifying login with Supabase Auth SDK...`);
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wnpsrdtlqxfiglhmalwq.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_n2im84IXBbQ3v2XluipN6Q_N_gfjbhu';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (error) {
    console.error('Login verification FAILED:', error.message);
    process.exit(1);
  } else {
    console.log('Login verification SUCCEEDED!');
    console.log(`Logged in as: ${data.user?.email}`);
    console.log(`User ID: ${data.user?.id}`);
    console.log(`Metadata Role: ${data.user?.user_metadata?.role}`);
    console.log(`Session Token obtained: YES`);
  }
}

createAdmin().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
