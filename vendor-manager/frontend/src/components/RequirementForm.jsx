import { useState } from 'react';

const EMPTY_VENDOR = { name: '', city: '', quote: '', on_time: '', quality: '', disputes: '', past_projects: '' };

const VENDOR_FIELDS = [
  { key: 'name', label: 'Vendor' },
  { key: 'city', label: 'City' },
  { key: 'quote', label: 'Quote' },
  { key: 'on_time', label: 'On-time %' },
  { key: 'quality', label: 'Quality (0-5)' },
  { key: 'disputes', label: 'Disputes' },
  { key: 'past_projects', label: 'Past projects' },
];

function toRow(vendor) {
  return {
    name: vendor.name ?? '',
    city: vendor.city ?? '',
    quote: vendor.quote ?? '',
    on_time: vendor.on_time ?? '',
    quality: vendor.quality ?? '',
    disputes: vendor.disputes ?? '',
    past_projects: vendor.past_projects ?? '',
  };
}

export default function RequirementForm({ onSubmit, isSubmitting, error, initialVendors = [] }) {
  const [label, setLabel] = useState('');
  const [site, setSite] = useState('');
  const [unit, setUnit] = useState('');
  const [marketAvg, setMarketAvg] = useState('');
  const [vendors, setVendors] = useState(() =>
    initialVendors.length > 0 ? initialVendors.map(toRow) : [{ ...EMPTY_VENDOR }, { ...EMPTY_VENDOR }]
  );

  function updateVendor(index, key, value) {
    setVendors((prev) => prev.map((v, i) => (i === index ? { ...v, [key]: value } : v)));
  }

  function addVendor() {
    setVendors((prev) => [...prev, { ...EMPTY_VENDOR }]);
  }

  function removeVendor(index) {
    setVendors((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const parsedVendors = vendors
      .filter((v) => v.name.trim())
      .map((v) => ({
        name: v.name.trim(),
        city: v.city.trim(),
        quote: Number(v.quote) || 0,
        on_time: Number(v.on_time) || 0,
        quality: Number(v.quality) || 0,
        disputes: Number(v.disputes) || 0,
        past_projects: Number(v.past_projects) || 0,
      }));

    onSubmit({
      label,
      site,
      unit,
      market_avg: Number(marketAvg) || 0,
      vendors: parsedVendors,
    });
  }

  const canSubmit = marketAvg && vendors.some((v) => v.name.trim()) && !isSubmitting;

  return (
    <form className="bb-card" onSubmit={handleSubmit}>
      <div className="bb-form-grid">
        <div className="bb-field">
          <label>Requirement</label>
          <input placeholder="e.g. RMC for foundation" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="bb-field">
          <label>Site</label>
          <input placeholder="e.g. Site B" value={site} onChange={(e) => setSite(e.target.value)} />
        </div>
        <div className="bb-field">
          <label>Unit</label>
          <input placeholder="e.g. cu.m" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div className="bb-field">
          <label>Market avg. price</label>
          <input type="number" placeholder="6000" value={marketAvg} onChange={(e) => setMarketAvg(e.target.value)} />
        </div>
      </div>

      <div className="bb-vendor-table">
        {initialVendors.length > 0 && (
          <p className="bb-page-sub" style={{ marginBottom: 10 }}>
            Loaded {initialVendors.length} vendors from the ERP — edit or remove any before running the match.
          </p>
        )}
        <div className="bb-vendor-row">
          {VENDOR_FIELDS.map((f) => (
            <div key={f.key} className="bb-vendor-row-label">
              {f.label}
            </div>
          ))}
          <div />
        </div>

        {vendors.map((vendor, i) => (
          <div className="bb-vendor-row" key={i}>
            {VENDOR_FIELDS.map((f) => (
              <input
                key={f.key}
                type={f.key === 'name' || f.key === 'city' ? 'text' : 'number'}
                value={vendor[f.key]}
                onChange={(e) => updateVendor(i, f.key, e.target.value)}
              />
            ))}
            <button type="button" className="bb-remove-btn" onClick={() => removeVendor(i)} aria-label="Remove vendor">
              ×
            </button>
          </div>
        ))}

        <button type="button" className="bb-add-btn" onClick={addVendor}>
          + Add vendor
        </button>
      </div>

      {error && <div className="bb-form-error">{error}</div>}

      <div className="bb-form-actions">
        <button type="submit" className="bb-submit-btn" disabled={!canSubmit}>
          {isSubmitting ? 'Scoring…' : 'Run match'}
        </button>
      </div>
    </form>
  );
}
