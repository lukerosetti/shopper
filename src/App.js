import React, { useState, useRef, useEffect } from 'react';
import Chat from './Chat';
import Login from './Login';
import Cart from './Cart';
import Preferences from './Preferences';
import { sendMessage, isMockMode, toggleMockMode, validateSession, addToCart, getCart } from './api';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hey! I'm your shopping assistant. Tell me what you're looking for and I'll help you find the best deals. What are you shopping for today?",
};

function App() {
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [view, setView] = useState('chat'); // chat, cart, prefs
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isMockMode()) {
      setAuthed(true);
      setAuthChecking(false);
      return;
    }
    validateSession().then(valid => {
      setAuthed(valid);
      setAuthChecking(false);
    });
  }, []);

  useEffect(() => {
    if (authed) {
      getCart().then(items => setCartItems(items || [])).catch(() => {});
    }
  }, [authed]);

  const handleLogin = (token) => {
    setAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('shopperToken');
    setAuthed(false);
  };

  const handleAddToCart = async (product) => {
    try {
      const result = await addToCart({
        name: product.name,
        price: product.price,
        store: product.store,
        url: product.url,
        imageUrl: product.image,
      });
      setCartItems(result.cart || []);
      return true;
    } catch {
      return false;
    }
  };

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

  if (authChecking) {
    return <div className="app"><div className="loading-screen">Loading...</div></div>;
  }

  if (!authed) {
    return <Login onLogin={handleLogin} />;
  }

  if (view === 'cart') {
    return (
      <div className="app">
        <Cart onBack={() => setView('chat')} cartItems={cartItems} setCartItems={setCartItems} />
      </div>
    );
  }

  if (view === 'prefs') {
    return (
      <div className="app">
        <Preferences onBack={() => setView('chat')} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>Shopper</h1>
          <span className="header-tag">AI</span>
        </div>
        <div className="header-right">
          {isMockMode() && <span className="mock-badge">MOCK</span>}
          <button className="nav-btn" onClick={() => setView('prefs')} title="Preferences">
            Prefs
          </button>
          <button className="nav-btn cart-nav-btn" onClick={() => setView('cart')} title="Cart">
            Cart{cartItems.length > 0 && <span className="cart-badge">{cartItems.length}</span>}
          </button>
          <button className="clear-btn" onClick={handleClear} title="New chat">
            New
          </button>
        </div>
      </header>

      <Chat messages={messages} isLoading={isLoading} onAddToCart={handleAddToCart} />

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
