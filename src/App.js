import React, { useState, useRef } from 'react';
import Chat from './Chat';
import { sendMessage } from './api';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hey! I'm your shopping assistant. Tell me what you're looking for and I'll help you find the best deals. What are you shopping for today?",
};

function App() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = updatedMessages
        .map(m => ({ role: m.role, content: m.content }));

      const response = await sendMessage(apiMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I had trouble connecting. Please try again!" },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>Shopper</h1>
          <span className="header-tag">AI</span>
        </div>
        <button className="clear-btn" onClick={handleClear} title="New chat">
          New
        </button>
      </header>

      <Chat messages={messages} isLoading={isLoading} />

      <div className="input-bar">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What are you looking for?"
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={!input.trim() || isLoading} className="send-btn">
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
