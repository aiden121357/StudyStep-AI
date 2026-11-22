const fs = require('node:fs');
const path = require('node:path');

let cachedKey;
let cachedExpiresAt = 0;

class KeygenError extends Error {
  constructor(message, fix, status = 502) {
    super(message);
    this.name = 'KeygenError';
    this.fix = fix;
    this.status = status;
  }
}

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith('#')) continue;
    if (process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

function expirationInMs(value) {
  if (typeof value === 'number') {
    return value < 1e12 ? value * 1000 : value;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

async function requestNewKey() {
  loadEnvFile();

  const keygenUrl = process.env.KEYGEN_URL;
  const token = process.env.KEYGEN_TOKEN;
  if (!keygenUrl || !token || keygenUrl === 'paste-here' || token === 'paste-here') {
    throw new KeygenError(
      'The AI key service is not configured yet.',
      'Set KEYGEN_URL and KEYGEN_TOKEN in .env.'
    );
  }

  let response;
  try {
    response = await fetch(`${keygenUrl.replace(/\/+$/, '')}/api/lookup-key`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    throw new KeygenError('The AI key service could not be reached.', error.message);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new KeygenError(
      'The AI key service returned an unreadable response.',
      `Key service returned HTTP ${response.status}.`
    );
  }

  if (!response.ok || body?.error) {
    const message = body?.error?.message || `The AI key service returned HTTP ${response.status}.`;
    const fix = body?.error?.fix || 'Check the key service configuration and try again.';
    throw new KeygenError(message, fix, response.status);
  }

  const expiresAt = expirationInMs(body?.expiresAt);
  if (!body?.apiKey || !Number.isFinite(expiresAt)) {
    throw new KeygenError(
      'The AI key service returned an invalid key.',
      'Make sure the response contains apiKey and expiresAt.'
    );
  }

  return { apiKey: body.apiKey, expiresAt };
}

/**
 * Get a server-side AI key. The cached key is reused until expiresAt.
 * Pass forceRefresh after OpenAI rejects the current key.
 */
async function getKey({ forceRefresh = false } = {}) {
  if (!forceRefresh && cachedKey && Date.now() < cachedExpiresAt) {
    return cachedKey;
  }

  try {
    const fresh = await requestNewKey();
    cachedKey = fresh.apiKey;
    cachedExpiresAt = fresh.expiresAt;
    return cachedKey;
  } catch (error) {
    if (error instanceof KeygenError && error.fix) {
      console.error(error.fix);
    }
    throw error;
  }
}

function isOpenAIKeyRejection(value) {
  const status = value?.status ?? value?.statusCode ?? value?.response?.status;
  const code = value?.code ?? value?.error?.code;
  return status === 401 || code === 'invalid_api_key' || /invalid api key|incorrect api key/i.test(value?.message || '');
}

/**
 * Run one server-side OpenAI request and refresh the key once if OpenAI rejects it.
 * requestWithKey receives the key but must never send it to the browser.
 */
async function withOpenAIKey(requestWithKey) {
  const currentKey = await getKey();
  try {
    const result = await requestWithKey(currentKey);
    if (!isOpenAIKeyRejection(result)) return result;
  } catch (error) {
    if (!isOpenAIKeyRejection(error)) throw error;
  }

  const refreshedKey = await getKey({ forceRefresh: true });
  return requestWithKey(refreshedKey);
}

// A server route can pass its response object here; only the safe message crosses to the page.
function sendKeygenError(response, error) {
  response.statusCode = error.status || 502;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ error: { message: error.message } }));
}

module.exports = { getKey, withOpenAIKey, sendKeygenError, KeygenError };
