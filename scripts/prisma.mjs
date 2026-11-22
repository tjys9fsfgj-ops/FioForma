#!/usr/bin/env node
/**
 * Executa o Prisma CLI normalizando o DSN do banco gerenciado
 * (ssl={"rejectUnauthorized":true} -> sslaccept=strict).
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function normalize(raw) {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    if (url.searchParams.has('ssl')) {
      url.searchParams.delete('ssl');
      url.searchParams.set('sslaccept', 'strict');
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const env = { ...process.env };
env.DATABASE_URL = normalize(env.DATABASE_URL);
if (env.DRIZZLE_DATABASE_URL) env.DRIZZLE_DATABASE_URL = normalize(env.DRIZZLE_DATABASE_URL);

const child = spawn('pnpm', ['exec', 'prisma', ...process.argv.slice(2)], {
  cwd: root,
  env,
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 1));
