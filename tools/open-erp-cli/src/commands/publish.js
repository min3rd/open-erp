import { readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readManifest } from '../lib/manifest.js';

export async function publishCommand(flags) {
  const dir = resolve(flags.dir || process.cwd());
  const manifest = readManifest(dir);
  const registry = (flags.registry || process.env.OPENERP_REGISTRY || 'http://localhost:8088').replace(/\/+$/, '');
  const token = resolveToken(flags.credential);
  const source = flags.source || 'bundle';
  if (!['bundle', 'image'].includes(source)) {
    throw new Error('--source must be "bundle" or "image"');
  }

  const payload = {
    plugin_key: manifest.id,
    name_key: manifest.name_key,
    description_key: manifest.description_key,
    version: manifest.version,
    source,
  };

  if (source === 'bundle') {
    const artifact = flags.artifact ? resolve(flags.artifact) : join(dir, 'dist/bundle.zip');
    const result = await uploadArtifact(registry, token, artifact);
    payload.artifact_ref = result.artifact_ref;
    payload.checksum = result.checksum;
    payload.credential_id = flags.credential;
  } else {
    const distribution = manifest.distribution || {};
    const registryHost = new URL(registry).host;
    const repository = flags.repository || distribution.repository;
    const tag = flags.tag || distribution.tag;
    if (!repository || !tag) {
      throw new Error('image source requires --repository and --tag (or distribution.repository/tag in plugin.json)');
    }
    const localImage = flags.image || distribution.image_ref;
    if (!localImage) {
      throw new Error('image source requires --image or distribution.image_ref in plugin.json');
    }
    const remoteImage = `${registryHost}/${repository}:${tag}`;
    docker(['tag', localImage, remoteImage]);
    docker(['push', remoteImage]);
    payload.image_ref = remoteImage;
    payload.registry_host = registryHost;
    payload.repository = repository;
    payload.tag = tag;
    payload.credential_id = flags.credential;
  }

  console.log(`Publish payload for ${manifest.id}@${manifest.version} (${source}):`);
  console.log(JSON.stringify(payload, null, 2));
}

function resolveToken(credential) {
  if (credential && process.env[credential] !== undefined) {
    return process.env[credential];
  }
  const token = credential || process.env.OPENERP_TOKEN;
  if (!token) {
    throw new Error('Missing credential. Pass --credential <env-var-name|token> or set OPENERP_TOKEN.');
  }
  return token;
}

async function uploadArtifact(registry, token, artifactPath) {
  const form = new FormData();
  form.append('file', new Blob([readFileSync(artifactPath)]), basename(artifactPath));
  const response = await fetch(`${registry}/api/v1/tenant/plugins/artifacts/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(`artifact upload failed (${body.code || response.status}): ${body.message || response.statusText}`);
  }
  return body.data || {};
}

function docker(args) {
  const result = spawnSync('docker', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) {
    throw new Error(`docker ${args[0]} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`docker ${args[0]} failed with exit code ${result.status}`);
  }
}
