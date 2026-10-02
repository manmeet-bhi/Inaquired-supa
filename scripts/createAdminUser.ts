import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const uri = 'postgresql://postgres.wnpsrdtlqxfiglhmalwq:aXihkgIxLsig4svi@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const ADMIN_EMAIL = 'admin@inaquired.app';
const ADMIN_PASSWORD = 'AdminPassword123!';

async function createAdmin() {
  console.log(`Creating Admin user in Supabase Postgres...`);
  const client = new Client({
    connectionString: uri,
    ssl: { rejectUnauthorized: false }
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
      const insertQuery = `
        DO $$
        DECLARE
          new_id uuid := gen_random_uuid();
          user_email text := '${ADMIN_EMAIL}';
          user_pass text := '${ADMIN_PASSWORD}';
          enc_pass text;
        BEGIN
          enc_pass := extensions.crypt(user_pass, extensions.gen_salt('bf'));

          INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
          ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_id,
            'authenticated',
            'authenticated',
            user_email,
            enc_pass,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"role":"admin"}'::jsonb,
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
          );

          INSERT INTO auth.identities (
            id,
            user_id,
            provider_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
          ) VALUES (
            new_id,
            new_id,
            new_id::text,
            json_build_object('sub', new_id::text, 'email', user_email)::jsonb,
            'email',
            NOW(),
            NOW(),
            NOW()
          );
        END $$;
      `;
      await client.query(insertQuery);
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
