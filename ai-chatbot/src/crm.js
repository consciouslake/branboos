// atrium/src/crm.js
// Thin client for the CRM's (Frappe CRM) lead-creation and project-read
// endpoints. CRM_API_TOKEN is expected in Frappe's "api_key:api_secret"
// form, sent as `Authorization: token <CRM_API_TOKEN>` per Frappe's REST auth.

'use strict';

const CRM_API_URL = process.env.CRM_API_URL;
const CRM_API_TOKEN = process.env.CRM_API_TOKEN;

function authHeaders() {
  if (!CRM_API_URL) throw new Error('CRM_API_URL is not set');
  if (!CRM_API_TOKEN) throw new Error('CRM_API_TOKEN is not set');
  return { Authorization: `token ${CRM_API_TOKEN}` };
}

async function createLead(payload) {
  const res = await fetch(`${CRM_API_URL}/api/method/branboos_crm.api.lead.create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`CRM request failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

async function listProjects() {
  const res = await fetch(`${CRM_API_URL}/api/method/branboos_crm.api.project.list`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`CRM request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.message?.projects ?? [];
}

module.exports = { createLead, listProjects };
