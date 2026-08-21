// atrium/src/routes/chat.js
// POST /chat — the conversation handler. Forwards to Keystone with
// product: "atrium" and returns the pre-validated { reply, state } shape.

'use strict';

const express = require('express');
const { generate } = require('../keystone');
const { listProjects } = require('../crm');

const router = express.Router();

// Live project inventory changes rarely compared to chat volume — cache it
// for a short window instead of hitting Groundwork on every message.
const PROJECTS_CACHE_TTL_MS = 60_000;
let projectsCache = { projects: [], fetchedAt: 0 };

async function getProjects() {
  const isStale = Date.now() - projectsCache.fetchedAt > PROJECTS_CACHE_TTL_MS;
  if (!isStale) return projectsCache.projects;

  try {
    const projects = await listProjects();
    projectsCache = { projects, fetchedAt: Date.now() };
  } catch (err) {
    console.error('[atrium] failed to refresh project inventory:', err.message);
    // Keep serving the last known-good list rather than blocking the chat.
  }
  return projectsCache.projects;
}

router.post('/chat', async (req, res) => {
  const { message, conversation_history = [] } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  const history = [...conversation_history, { role: 'user', content: message }];

  try {
    const projects = await getProjects();

    const result = await generate({
      product: 'atrium',
      template: 'atrium_conversation',
      variables: { projects_json: projects },
      conversation_history: history,
    });

    // Keystone-level error shape (validation_failed / provider_error / unauthorized):
    // keep prior UI state unchanged per the appendix contract, never crash.
    if (result.error) {
      return res.json({ reply: result.fallback?.reply ?? null, state: null });
    }

    return res.json({ reply: result.reply, state: result.state });
  } catch (err) {
    console.error('[atrium] /chat failed:', err.message);
    return res.json({ reply: 'Let me follow up on that in a moment.', state: null });
  }
});

module.exports = router;
