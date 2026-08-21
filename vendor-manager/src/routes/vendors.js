// vendor-manager/src/routes/vendors.js
// GET /vendors — proxies the ERP's live supplier list to the frontend, so
// the requirement form can pre-fill real vendor data instead of starting
// from a blank sheet every time.

'use strict';

const express = require('express');
const { listVendors } = require('../erp');

const router = express.Router();

router.get('/vendors', async (_req, res) => {
  try {
    const vendors = await listVendors();
    return res.json({ vendors });
  } catch (err) {
    console.error('[vendor-manager] /vendors failed:', err.message);
    return res.json({ vendors: [] });
  }
});

module.exports = router;
