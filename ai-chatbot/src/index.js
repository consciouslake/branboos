// atrium/src/index.js
// API gateway + static host for the Amara chatbot frontend (BranBoos).
// Never holds a provider API key: all AI calls go through Keystone.

'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const chatRouter = require('./routes/chat');
const handoffRouter = require('./routes/handoff');

const app = express();
const PORT = process.env.PORT ?? 4000;
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ service: 'atrium', status: 'ok', ts: new Date().toISOString() });
});

app.use(chatRouter);
app.use(handoffRouter);

// Serve the built React SPA (frontend/dist), with a catch-all fallback to
// index.html so client-side routing (if any is added later) still works.
app.use(express.static(FRONTEND_DIST));
app.get('*', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[atrium] listening on :${PORT}`);
});
