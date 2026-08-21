// vendor-manager/src/erp.js
// Thin client for the ERP's (ERPNext) vendor-read endpoint.
// ERP_API_TOKEN is expected in Frappe's "api_key:api_secret" form,
// sent as `Authorization: token <ERP_API_TOKEN>` per Frappe's REST auth.

'use strict';

const ERP_API_URL = process.env.ERP_API_URL;
const ERP_API_TOKEN = process.env.ERP_API_TOKEN;

async function listVendors() {
  if (!ERP_API_URL) throw new Error('ERP_API_URL is not set');
  if (!ERP_API_TOKEN) throw new Error('ERP_API_TOKEN is not set');

  const res = await fetch(`${ERP_API_URL}/api/method/branboos_erp.api.vendor.list`, {
    method: 'GET',
    headers: { Authorization: `token ${ERP_API_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`ERP request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.message?.vendors ?? [];
}

module.exports = { listVendors };
