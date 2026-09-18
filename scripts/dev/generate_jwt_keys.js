#!/usr/bin/env node
/**
 * Generates the RSA key pair used by Quarkus SmallRye JWT for local development.
 *
 * The *.pem files are gitignored on purpose (never commit private keys).
 * Run this once after cloning, or let scripts/dev/run_backend.bat|sh do it automatically.
 *
 * Usage:
 *   node scripts/dev/generate_jwt_keys.js                 # generate into src/backend main + test resources
 *   node scripts/dev/generate_jwt_keys.js --force         # overwrite existing keys
 *   node scripts/dev/generate_jwt_keys.js --out <dir>     # generate into a custom directory (for tests)
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const force = args.includes('--force');
const outIndex = args.indexOf('--out');
const root = path.resolve(__dirname, '..', '..');

const targets = outIndex >= 0
  ? [path.resolve(args[outIndex + 1])]
  : [
      path.join(root, 'src', 'backend', 'src', 'main', 'resources'),
      path.join(root, 'src', 'backend', 'src', 'test', 'resources')
    ];

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const publicPem = publicKey.export({ type: 'spki', format: 'pem' });

for (const dir of targets) {
  fs.mkdirSync(dir, { recursive: true });
  const privatePath = path.join(dir, 'privateKey.pem');
  const publicPath = path.join(dir, 'publicKey.pem');

  if (!force && fs.existsSync(privatePath) && fs.existsSync(publicPath)) {
    console.log(`[keys] Skip (already exists): ${dir}`);
    continue;
  }

  fs.writeFileSync(privatePath, privatePem, { mode: 0o600 });
  fs.writeFileSync(publicPath, publicPem);
  console.log(`[keys] Generated: ${privatePath}`);
  console.log(`[keys] Generated: ${publicPath}`);
}
