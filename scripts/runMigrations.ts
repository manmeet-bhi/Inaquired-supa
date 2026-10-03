import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

// Database connection URI from environment
const DB_URL = process.env.SUPABASE_DIRECT_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('[CRITICAL] Missing SUPABASE_DIRECT_URL or DATABASE_URL in environment.');
  process.exit(1);
}

async function getConnectedClient(): Promise<pg.Client> {
  const candidates = [
    { name: 'Primary Database Connection', uri: DB_URL },
  ];

  for (const candidate of candidates) {
    console.log(`Attempting connection via ${candidate.name}...`);
    let client = new Client({
      connectionString: candidate.uri,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      console.log(`Connected successfully to Supabase PostgreSQL via ${candidate.name}!`);
      return client;
    } catch (err: any) {
      console.warn(`Connection failed for ${candidate.name}: ${err.message}`);
      try { await client.end(); } catch {}
    }
  }

  throw new Error('Unable to connect to Supabase PostgreSQL using any available connection candidates.');
}

async function runMigrations() {
  console.log('====================================================');
  console.log('  inaquired – Supabase Database Migration Runner');
  console.log('====================================================');

  const client = await getConnectedClient();

  try {
    // 1. Ensure schema_migrations table exists
    console.log('Checking migration tracking table (public.schema_migrations)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        checksum TEXT
      );
    `);
    console.log('public.schema_migrations table ready.');

    // 2. Fetch already applied migrations
    const { rows: appliedRows } = await client.query(`
      SELECT version, name, checksum, applied_at FROM public.schema_migrations ORDER BY version ASC;
    `);
    const appliedMap = new Map(appliedRows.map((r: any) => [r.version, r]));
    console.log(`Found ${appliedMap.size} previously recorded migration(s) in database.`);

    // 3. Scan migrations directory
    const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} production migration file(s) in supabase/migrations/`);

    const activeVersions = new Set<string>();
    let appliedCount = 0;

    for (const file of files) {
      const version = file.split('_')[0];
      activeVersions.add(version);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');

      const existing: any = appliedMap.get(version);
      const isForce = process.argv.includes('--force');

      if (existing && !isForce) {
        if (existing.name !== file || existing.checksum !== checksum) {
          throw new Error(
            `Migration ${version} differs from its recorded file/checksum. Refusing to reapply it; add a new migration or review explicitly with --force.`
          );
        }
        console.log(`  [SKIP] ${file} (already up-to-date)`);
        continue;
      }

      console.log(`  [APPLYING] ${file}...`);
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(`
          INSERT INTO public.schema_migrations (version, name, checksum, applied_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (version) DO UPDATE 
          SET name = EXCLUDED.name, checksum = EXCLUDED.checksum, applied_at = NOW();
        `, [version, file, checksum]);
        await client.query('COMMIT');

        console.log(`  [SUCCESS] Applied ${file}`);
        appliedCount++;
      } catch (migrationErr: any) {
        await client.query('ROLLBACK');
        console.error(`  [FAILED] Error applying ${file}:`, migrationErr.message);
        throw migrationErr;
      }
    }

    // Clean up any historical pre-merge orphaned migration records
    const orphaned = appliedRows.filter((r: any) => !activeVersions.has(r.version));
    if (orphaned.length > 0) {
      console.log(`\nPruning ${orphaned.length} legacy pre-merge tracking record(s) from schema_migrations...`);
      for (const o of orphaned) {
        await client.query('DELETE FROM public.schema_migrations WHERE version = $1', [o.version]);
        console.log(`  • Removed legacy record version ${o.version} (${o.name})`);
      }
    }

    // 4. Verify all tables in public schema
    console.log('\n--- Verifying Public Schema Tables ---');
    const { rows: tableRows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Active Public Tables:');
    for (const t of tableRows) {
      const { rows: countRows } = await client.query(`SELECT count(*)::int as count FROM public."${t.table_name}";`);
      console.log(`  • public.${t.table_name} (${countRows[0].count} rows)`);
    }

    // 5. Verify migrations table content
    console.log('\n--- Schema Migrations History ---');
    const { rows: history } = await client.query(`
      SELECT version, name, applied_at FROM public.schema_migrations ORDER BY version ASC;
    `);
    for (const h of history) {
      console.log(`  • Version ${h.version}: ${h.name} (Applied at: ${h.applied_at})`);
    }

    console.log('\n====================================================');
    console.log(`  Migration execution complete. (${appliedCount} newly applied)`);
    console.log('====================================================');

  } finally {
    await client.end();
  }
}

runMigrations().catch((err) => {
  console.error('\nFatal Migration Error:', err);
  process.exit(1);
});
