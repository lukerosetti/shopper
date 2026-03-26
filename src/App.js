import React, { useState, useRef, useEffect } from 'react';
import Chat from './Chat';
import Login from './Login';
import Cart from './Cart';
import Preferences from './Preferences';
import { sendMessage, isMockMode, toggleMockMode, validateSession, addToCart, getCart } from './api';

const GREETINGS = [
  "Hey Brooke! What are we hunting for today?",
  "Brooke! Ready to find something amazing?",
  "Welcome back, Brooke! Let's shop!",
  "Hey girl! What's on the wishlist today?",
  "Brooke! I've been waiting to help you shop!",
  "Hey Brooke! Let's find your next favorite thing!",
  "Shopping time, Brooke! What are we looking for?",
  "Hey Brooke! Tell me what's on your mind!",
  "Brooke! Let's find some deals today!",
  "Hey there, Brooke! What sounds good today?",
];

function getRandomGreeting() {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [greeting] = useState(getRandomGreeting);
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
        { role: 'assistant', content: "Oops! I had trouble connecting. Tap retry or send your message again.", isError: true },
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

  const handleRetry = () => {
    // Remove the error message and resend the last user message
    setMessages(prev => {
      const withoutError = prev.filter(m => !m.isError);
      const lastUserMsg = [...withoutError].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        setInput(lastUserMsg.content);
        return withoutError.slice(0, -1); // remove last user message too, handleSend will re-add it
      }
      return withoutError;
    });
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
          <div className="header-brand">
            <img src="/logo.png" alt="" className="header-logo" />
            <div>
              <h1>Closet Concierge</h1>
              <span className="header-greeting">{greeting}</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          {isMockMode() && <span className="mock-badge">MOCK</span>}
          <button className="nav-btn cart-nav-btn" onClick={() => setView('cart')} title="Cart">
            🛒{cartItems.length > 0 && <span className="cart-badge">{cartItems.length}</span>}
          </button>
          <button className="menu-btn" onClick={() => setMenuOpen(true)} title="Menu">
            ☰
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="side-nav-overlay" onClick={() => setMenuOpen(false)} />
          <div className="side-nav">
            <div className="side-nav-header">
              <h2>Menu</h2>
              <button className="side-nav-close" onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <div className="side-nav-items">
              <button className="side-nav-item" onClick={() => { handleClear(); setMenuOpen(false); }}>
                <span className="nav-icon">✨</span> New Chat
              </button>
              <button className="side-nav-item" onClick={() => { setView('prefs'); setMenuOpen(false); }}>
                <span className="nav-icon">👤</span> My Preferences
              </button>
              <button className="side-nav-item" onClick={() => { setView('cart'); setMenuOpen(false); }}>
                <span className="nav-icon">🛒</span> Shopping Cart
                {cartItems.length > 0 && <span className="nav-badge">{cartItems.length}</span>}
              </button>
            </div>
            <div className="side-nav-footer">
              <div className="side-nav-mock">
                Mode:
                <button className="side-nav-mock-btn" onClick={toggleMockMode}>
                  {isMockMode() ? '🟡 Mock' : '🟢 Live'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Chat messages={messages} isLoading={isLoading} onAddToCart={handleAddToCart} onRetry={handleRetry} />

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
