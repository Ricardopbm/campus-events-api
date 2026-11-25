// Read-only smoke test: node scripts/check-deploy.mjs https://your-service.example
import process from 'node:process';
import console from 'node:console';
import { URL } from 'node:url';
const baseUrl = process.argv[2];
if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  console.error('Usage: node scripts/check-deploy.mjs <http(s)://base-url>');
  process.exit(1);
}

for (const path of ['/health', '/health/deep', '/events']) {
  const url = new URL(path, baseUrl);
  const response = await globalThis.fetch(url, { signal: globalThis.AbortSignal.timeout(120000) });
  const body = await response.json();
  const valid = path === '/events' ? Array.isArray(body) : body.status === 'healthy';
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      url: url.toString(),
      status: response.status,
      body,
    }),
  );
  if (response.status !== 200 || !valid) {
    throw new Error(`Deployment check failed: ${path}`);
  }
}
