// vendor-manager/src/scoring.js
// Deterministic vendor scoring — no LLM involved. Per design spec §7:
// the AI only narrates a score that's already computed and auditable.

'use strict';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * @param {{ market_avg: number, vendors: Array<{name:string,city:string,quote:number,on_time:number,quality:number,disputes:number,past_projects:number}> }} req
 * @returns {Array} vendors with matchScore/priceDelta/flag, sorted best first
 */
function computeScores(req) {
  const marketAvg = req.market_avg;

  return req.vendors
    .map((v) => {
      const priceDelta = ((v.quote - marketAvg) / marketAvg) * 100;
      const priceScore = clamp(100 - Math.abs(priceDelta) * 2.5, 0, 100);
      const performanceScore = v.on_time * 0.5 + v.quality * 20 * 0.5;
      const disputePenalty = v.disputes * 4;
      const matchScore = clamp(priceScore * 0.4 + performanceScore * 0.5 - disputePenalty, 0, 100);

      let flag = 'ok';
      if (priceDelta > 12) flag = 'above';
      else if (priceDelta < -12) flag = 'below';

      return { ...v, priceDelta, matchScore: Math.round(matchScore), flag };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { computeScores };
