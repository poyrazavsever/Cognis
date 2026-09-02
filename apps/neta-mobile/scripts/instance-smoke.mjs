const configuredOrigin = process.env.EXPO_PUBLIC_NETA_ORIGIN?.trim();

if (!configuredOrigin) fail('EXPO_PUBLIC_NETA_ORIGIN tanımlı değil.');

const origin = new URL(configuredOrigin).origin;
if (origin !== configuredOrigin || !origin.startsWith('https://')) {
  fail('Production instance origin yalnız HTTPS origin olmalıdır.');
}

const discovery = await requestJson(new URL('/.well-known/neta', origin));
if (discovery.protocol !== 'neta' || discovery.discoveryVersion !== 1 || !readString(discovery.instanceId)) {
  fail('Discovery kontratı geçersiz.');
}

const api = isRecord(discovery.api) ? discovery.api : {};
const healthUrl = trustedUrl(readString(api.healthUrl) ?? '/api/v1/health');
const metaUrl = trustedUrl(readString(api.metaUrl) ?? '/api/v1/meta');
const catalogUrl = trustedUrl(readString(api.catalogUrl) ?? '/api/v1/localization/catalog');

const [health, meta, catalog] = await Promise.all([
  requestJson(healthUrl),
  requestJson(metaUrl),
  requestJson(catalogUrl),
]);

if (!['ok', 'healthy', 'ready'].includes(String(health.status ?? health.readiness).toLowerCase())) {
  fail('Instance health hazır değil.');
}

const metaInstance = isRecord(meta.instance) ? meta.instance : {};
if (metaInstance.id !== discovery.instanceId) fail('Discovery ve meta instance ID eşleşmiyor.');
if (!isRecord(catalog.messages)) fail('Localization catalog messages alanı eksik.');

console.log(`Instance smoke başarılı: ${origin}`);

async function requestJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Neta-Client': 'mobile-smoke' },
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json();
  if (!response.ok) fail(`${url} ${response.status} döndürdü.`);
  return isRecord(body) && body.ok === true && 'data' in body ? body.data : body;
}

function trustedUrl(value) {
  const url = new URL(value, origin);
  if (url.origin !== origin) fail('Discovery farklı origin bildirdi.');
  return url;
}

function readString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
