import { useState } from 'react';
import ScoreGauge from './ScoreGauge';

const SEGMENTS = ['Residential', 'Commercial', 'Industrial & PMC', 'Interiors'];
const STAGES = [
  { key: 'greeting', label: 'Getting to know you' },
  { key: 'qualifying', label: 'Understanding your project' },
  { key: 'showcasing', label: 'Exploring options' },
  { key: 'handoff', label: 'Ready to connect' },
];

function HandoffForm({ onSubmit, isSubmitting, confirmed, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  if (confirmed) {
    return (
      <section className="bb-handoff-box">
        <h4>You're all set</h4>
        <p>Thanks — someone from BranBoos will reach out shortly.</p>
      </section>
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ contactName: name, email, phone });
  }

  const canSubmit = (name.trim() || email.trim() || phone.trim()) && !isSubmitting;

  return (
    <section className="bb-handoff-box">
      <h4>You're all set</h4>
      <p>Leave your details and we'll connect you with the right team at BranBoos.</p>
      <form onSubmit={handleSubmit} className="bb-handoff-form">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {error && <div className="bb-handoff-error">{error}</div>}
        <button type="submit" className="bb-handoff-btn" disabled={!canSubmit}>
          {isSubmitting ? 'Sending…' : 'Connect me with the team'}
        </button>
      </form>
    </section>
  );
}

export default function SidePanel({ state, onHandoff, isHandingOff, handoffConfirmed, handoffError }) {
  const segment = state?.segment ?? null;
  const leadScore = state?.lead_score ?? 0;
  const stage = state?.stage ?? 'greeting';
  const handoffReady = Boolean(state?.handoff_ready);
  const currentStageIdx = STAGES.findIndex((s) => s.key === stage);

  return (
    <aside className="bb-side-panel">
      <section>
        <h3>Project type</h3>
        <div className="bb-segment-grid">
          {SEGMENTS.map((s) => (
            <div key={s} className={`bb-segment-pill ${s === segment ? 'active' : ''}`}>
              {s}
            </div>
          ))}
        </div>
      </section>

      <section className="bb-score-card">
        <h3>Lead score</h3>
        <ScoreGauge score={leadScore} />
        <div className="bb-score-value">{leadScore}</div>
        <div className="bb-score-label">out of 100</div>
      </section>

      <section>
        <h3>Progress</h3>
        <div className="bb-stage-track">
          {STAGES.map((s, i) => (
            <div
              key={s.key}
              className={`bb-stage-step ${i < currentStageIdx ? 'done' : ''} ${i === currentStageIdx ? 'current' : ''}`}
            >
              <span className="bb-stage-dot" />
              {s.label}
            </div>
          ))}
        </div>
      </section>

      {handoffReady && (
        <HandoffForm
          onSubmit={onHandoff}
          isSubmitting={isHandingOff}
          confirmed={handoffConfirmed}
          error={handoffError}
        />
      )}
    </aside>
  );
}
