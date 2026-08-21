import { useEffect, useRef } from 'react';

function Bubble({ role, content }) {
  return (
    <div className={`bb-bubble-row ${role}`}>
      <div className="bb-bubble">{content}</div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="bb-bubble-row assistant">
      <div className="bb-bubble bb-typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default function ChatPanel({ messages, isSending, input, onInputChange, onSend }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  function handleSubmit(e) {
    e.preventDefault();
    onSend();
  }

  return (
    <div className="bb-chat-panel">
      <div className="bb-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="bb-empty-state">
            <h2>Let's talk about your project</h2>
            <p>Tell us what you're planning — residential, commercial, industrial, or interiors — and we'll help you find the right fit.</p>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)
        )}
        {isSending && <TypingIndicator />}
      </div>

      <form className="bb-composer" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={isSending}
          autoFocus
        />
        <button type="submit" className="bb-send-btn" disabled={isSending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
