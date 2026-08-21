export async function sendMessage(message, conversationHistory) {
  const res = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_history: conversationHistory }),
  });

  if (!res.ok) {
    throw new Error(`Chat request failed: ${res.status}`);
  }

  return res.json();
}

export async function sendHandoff({ state, conversationHistory, contactName, email, phone }) {
  const res = await fetch('/handoff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      state,
      conversation_history: conversationHistory,
      contact_name: contactName,
      email,
      phone,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Handoff request failed: ${res.status}`);
  }
  return data;
}
