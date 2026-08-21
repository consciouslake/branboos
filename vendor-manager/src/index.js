// vendor-manager/src/index.js
// Vendor intelligence service — deterministic scoring + Keystone narrative,
// plus the static host for the BranBoos vendor-comparison frontend.

'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const recommendRouter = require('./routes/recommend');
const vendorsRouter = require('./routes/vendors');

const app = express();
const PORT = process.env.PORT ?? 4001;
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ service: 'vendor-manager', status: 'ok', ts: new Date().toISOString() });
});

app.use(recommendRouter);
app.use(vendorsRouter);

// Serve the built React SPA (frontend/dist).
app.use(express.static(FRONTEND_DIST));
app.get('*', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[vendor-manager] listening on :${PORT}`);
});
