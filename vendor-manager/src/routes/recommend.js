// vendor-manager/src/routes/recommend.js
// POST /recommend — score vendors deterministically, then ask Keystone
// for a narrative over the already-computed comparison (never raw data).

'use strict';

const express = require('express');
const { computeScores } = require('../scoring');
const { generate } = require('../keystone');

const router = express.Router();

router.post('/recommend', async (req, res) => {
  const { label, site, unit, market_avg, vendors } = req.body ?? {};

  if (typeof market_avg !== 'number' || !Array.isArray(vendors) || vendors.length === 0) {
    return res.status(400).json({ error: 'market_avg (number) and vendors (non-empty array) are required' });
  }

  const rankedVendors = computeScores({ label, site, unit, market_avg, vendors });

  try {
    const result = await generate({
      product: 'quarry',
      template: 'quarry_recommend',
      variables: { vendors: rankedVendors },
    });

    if (result.error || !result.valid) {
      return res.json({
        recommendation: result.recommendation ?? 'Please refer to the ranked vendor list above for the recommendation.',
        ranked_vendors: rankedVendors,
      });
    }

    return res.json({ recommendation: result.recommendation, ranked_vendors: rankedVendors });
  } catch (err) {
    console.error('[vendor-manager] /recommend failed:', err.message);
    return res.json({
      recommendation: 'Please refer to the ranked vendor list above for the recommendation.',
      ranked_vendors: rankedVendors,
    });
  }
});

module.exports = router;
