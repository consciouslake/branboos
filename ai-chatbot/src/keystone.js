// atrium/src/keystone.js
// Thin client for Keystone's POST /v1/generate — the only AI call path.
// Atrium never holds a provider API key; Keystone owns that.

'use strict';

const KEYSTONE_URL = process.env.KEYSTONE_URL;
const KEYSTONE_SERVICE_TOKEN = process.env.KEYSTONE_SERVICE_TOKEN;

async function generate({ product, template, variables = {}, conversation_history = [] }) {
  if (!KEYSTONE_URL) throw new Error('KEYSTONE_URL is not set');
  if (!KEYSTONE_SERVICE_TOKEN) throw new Error('KEYSTONE_SERVICE_TOKEN is not set');

  const res = await fetch(`${KEYSTONE_URL}/v1/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEYSTONE_SERVICE_TOKEN}`,
    },
    body: JSON.stringify({ product, template, variables, conversation_history }),
  });

  if (!res.ok) {
    throw new Error(`Keystone request failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

module.exports = { generate };
