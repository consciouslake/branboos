import { useState } from 'react';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import SidePanel from './components/SidePanel';
import { sendMessage, sendHandoff } from './api';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [state, setState] = useState(null);

  const [isHandingOff, setIsHandingOff] = useState(false);
  const [handoffConfirmed, setHandoffConfirmed] = useState(false);
  const [handoffError, setHandoffError] = useState(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const result = await sendMessage(text, messages);
      setMessages([...nextMessages, { role: 'assistant', content: result.reply }]);
      if (result.state) setState(result.state);
    } catch (err) {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: "Sorry, something went wrong on our end. Let's try that again in a moment." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleHandoff({ contactName, email, phone }) {
    setIsHandingOff(true);
    setHandoffError(null);
    try {
      await sendHandoff({ state, conversationHistory: messages, contactName, email, phone });
      setHandoffConfirmed(true);
    } catch (err) {
      setHandoffError(err.message);
    } finally {
      setIsHandingOff(false);
    }
  }

  return (
    <div className="bb-app">
      <Header />
      <div className="bb-layout">
        <ChatPanel messages={messages} isSending={isSending} input={input} onInputChange={setInput} onSend={handleSend} />
        <SidePanel
          state={state}
          onHandoff={handleHandoff}
          isHandingOff={isHandingOff}
          handoffConfirmed={handoffConfirmed}
          handoffError={handoffError}
        />
      </div>
    </div>
  );
}
