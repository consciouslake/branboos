// atrium/src/routes/handoff.js
// POST /handoff — called once handoff_ready is true and the visitor confirms.
// Writes a qualified lead into Groundwork (CRM) with the chatbot's assessment
// and the captured contact details.

'use strict';

const express = require('express');
const { createLead } = require('../crm');

const router = express.Router();

router.post('/handoff', async (req, res) => {
  const { state, conversation_history = [], contact_name, email, phone } = req.body ?? {};

  if (!contact_name && !email && !phone) {
    return res.status(400).json({ error: 'At least one of contact_name, email, or phone is required.' });
  }

  try {
    const lead = await createLead({
      segment: state?.segment ?? null,
      lead_score: state?.lead_score ?? 0,
      stage: state?.stage ?? null,
      conversation_history,
      contact_name,
      email,
      phone,
    });

    return res.json({ ok: true, lead });
  } catch (err) {
    console.error('[atrium] /handoff failed:', err.message);
    return res.status(502).json({ ok: false, error: 'Could not reach the CRM right now. Please try again shortly.' });
  }
});

module.exports = router;
