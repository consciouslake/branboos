import { useEffect, useState } from 'react';
import Header from './components/Header';
import RequirementForm from './components/RequirementForm';
import VendorCard from './components/VendorCard';
import { getRecommendation, getVendors } from './api';

export default function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [liveVendors, setLiveVendors] = useState(null);

  useEffect(() => {
    getVendors().then(setLiveVendors);
  }, []);

  async function handleSubmit(requirement) {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await getRecommendation(requirement);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Header />
      <div className="bb-page">
        <div>
          <h2>Run a vendor match</h2>
          <p className="bb-page-sub">
            Scoring is deterministic — price, on-time record, and disputes are weighed the same way every time. The AI only narrates the result.
          </p>
        </div>

        {liveVendors === null ? (
          <div className="bb-card">Loading vendor list…</div>
        ) : (
          <RequirementForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
            initialVendors={liveVendors}
          />
        )}

        {result && (
          <>
            <div className="bb-recommendation">
              <h3>Recommendation</h3>
              <p>{result.recommendation}</p>
            </div>

            <div className="bb-vendor-cards">
              {result.ranked_vendors.map((v, i) => (
                <VendorCard key={v.name + i} vendor={v} rank={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
