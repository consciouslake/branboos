export default function VendorCard({ vendor, rank }) {
  return (
    <div className={`bb-vendor-card ${rank === 0 ? 'rank-0' : ''}`}>
      <div className="bb-vendor-card-top">
        <div>
          <div className="bb-vendor-name">{vendor.name}</div>
          {vendor.city && <div className="bb-vendor-city">{vendor.city}</div>}
        </div>
        <div className="bb-match-score">{vendor.matchScore}</div>
      </div>

      <div className="bb-vendor-stats">
        <div>
          Quote: <strong>₹{vendor.quote}</strong>
        </div>
        <div>
          Δ price: <strong>{vendor.priceDelta > 0 ? '+' : ''}{vendor.priceDelta.toFixed(1)}%</strong>
        </div>
        <div>
          On-time: <strong>{vendor.on_time}%</strong>
        </div>
        <div>
          Disputes: <strong>{vendor.disputes}</strong>
        </div>
      </div>

      <span className={`bb-flag ${vendor.flag}`}>
        {vendor.flag === 'ok' ? 'Fair price' : vendor.flag === 'above' ? 'Above market' : 'Below market'}
      </span>
    </div>
  );
}
