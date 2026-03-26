import React, { useState, useRef, useEffect, useCallback } from 'react';
import Chat from './Chat';
import Login from './Login';
import Cart from './Cart';
import Preferences from './Preferences';
import Wishlist from './Wishlist';
import ChatHistory from './ChatHistory';
import { sendMessage, isMockMode, toggleMockMode, validateSession, addToCart, getCart, saveFeedback, addToWishlist, saveChatHistory, getUsage } from './api';

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

const QUICK_PROMPTS = [
  { label: 'Date night outfit', text: "I need a date night outfit" },
  { label: 'Comfy shoes', text: "I'm looking for comfortable everyday shoes" },
  { label: 'New bag', text: "Help me find a cute bag" },
  { label: 'Summer looks', text: "Show me trendy summer outfits" },
  { label: 'Work clothes', text: "I need professional work clothes" },
  { label: 'Deals under $30', text: "Find me cute clothes under $30" },
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
  const [view, setView] = useState('chat'); // chat, cart, prefs, wishlist, history
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [greeting] = useState(getRandomGreeting);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('shopperDarkMode') === 'true');
  const [chatId] = useState(() => Date.now().toString(36));
  const [usage, setUsage] = useState({ usedTokens: 0, remainingTokens: 75, totalTokens: 75 });
  const inputRef = useRef(null);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('shopperDarkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

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
      getUsage().then(u => setUsage(u)).catch(() => {});
    }
  }, [authed]);

  // Handle iOS keyboard - messaging app style
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const appEl = document.querySelector('.app');
    if (!appEl) return;

    let initialHeight = vv.height;

    const onResize = () => {
      // When keyboard opens, vv.height shrinks
      // Resize the app container to fit the visible viewport
      appEl.style.height = `${vv.height}px`;
      // Prevent the page from scrolling behind the keyboard
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      // Scroll chat to bottom so latest messages stay visible
      const chatArea = document.querySelector('.chat-area');
      if (chatArea) {
        requestAnimationFrame(() => {
          chatArea.scrollTop = chatArea.scrollHeight;
        });
      }
    };

    vv.addEventListener('resize', onResize);

    // Also prevent body scroll
    const onTouchMove = (e) => {
      // Allow scrolling inside chat-area, prevent body scroll
      if (!e.target.closest('.chat-area') && !e.target.closest('.side-nav')) {
        if (vv.height < initialHeight - 100) {
          e.preventDefault();
        }
      }
    };
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      vv.removeEventListener('resize', onResize);
      document.removeEventListener('touchmove', onTouchMove);
      appEl.style.height = '';
    };
  }, []);

  // Auto-save chat history when messages change (if more than just welcome)
  const saveChat = useCallback(() => {
    if (messages.length > 2) {
      const title = messages.find(m => m.role === 'user')?.content?.slice(0, 50) || 'Chat';
      saveChatHistory(chatId, title, messages).catch(() => {});
    }
  }, [messages, chatId]);

  useEffect(() => {
    if (messages.length > 2) {
      const timeout = setTimeout(saveChat, 2000);
      return () => clearTimeout(timeout);
    }
  }, [messages, saveChat]);

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

  const handleAddToWishlist = async (product) => {
    try {
      await addToWishlist({
        name: product.name,
        price: product.price,
        store: product.store,
        url: product.url,
        imageUrl: product.image,
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || isLoading) return;

    // Check if limit is reached
    if (usage.limitReached) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: "You've used all your tokens for today! Come back tomorrow for more shopping." },
      ]);
      setInput('');
      return;
    }

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = updatedMessages
        .map(m => ({ role: m.role, content: m.content }));

      const result = await sendMessage(apiMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      if (result.usage) {
        setUsage(prev => ({
          ...prev,
          usedTokens: result.usage.usedTokens,
          remainingTokens: result.usage.remainingTokens,
          totalTokens: result.usage.totalTokens,
        }));
      }
    } catch (err) {
      const isLimitError = err.message && err.message.includes('tokens');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: isLimitError ? err.message : "Oops! I had trouble connecting. Tap retry or send your message again.", isError: !isLimitError },
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

  const handleFeedback = async (product, liked) => {
    try {
      await saveFeedback({
        name: product.name,
        store: product.store,
        price: product.price,
        liked,
      });
    } catch {
      // Silent fail
    }
  };

  const handleRetry = () => {
    setMessages(prev => {
      const withoutError = prev.filter(m => !m.isError);
      const lastUserMsg = [...withoutError].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        setInput(lastUserMsg.content);
        return withoutError.slice(0, -1);
      }
      return withoutError;
    });
  };

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
  };

  const handleLoadChat = (chat) => {
    setMessages(chat.messages);
    setView('chat');
  };

  const handleQuickPrompt = (text) => {
    handleSend(text);
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

  if (view === 'wishlist') {
    return (
      <div className="app">
        <Wishlist onBack={() => setView('chat')} setCartItems={setCartItems} />
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="app">
        <ChatHistory onBack={() => setView('chat')} onLoadChat={handleLoadChat} />
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
            +{cartItems.length > 0 && <span className="cart-badge">{cartItems.length}</span>}
          </button>
          <button className="menu-btn" onClick={() => setMenuOpen(true)} title="Menu">
            ≡
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="side-nav-overlay" onClick={() => setMenuOpen(false)} />
          <div className="side-nav">
            <div className="side-nav-header">
              <h2>Menu</h2>
              <button className="side-nav-close" onClick={() => setMenuOpen(false)}>×</button>
            </div>
            <div className="side-nav-items">
              <button className="side-nav-item" onClick={() => { handleClear(); setMenuOpen(false); }}>
                <span className="nav-icon">+</span> New Chat
              </button>
              <button className="side-nav-item" onClick={() => { setView('history'); setMenuOpen(false); }}>
                <span className="nav-icon">≡</span> Chat History
              </button>
              <button className="side-nav-item" onClick={() => { setView('prefs'); setMenuOpen(false); }}>
                <span className="nav-icon">◎</span> My Preferences
              </button>
              <button className="side-nav-item" onClick={() => { setView('wishlist'); setMenuOpen(false); }}>
                <span className="nav-icon">♡</span> Wishlist
              </button>
              <button className="side-nav-item" onClick={() => { setView('cart'); setMenuOpen(false); }}>
                <span className="nav-icon">+</span> Shopping Cart
                {cartItems.length > 0 && <span className="nav-badge">{cartItems.length}</span>}
              </button>
              <button className="side-nav-item" onClick={() => { setDarkMode(d => !d); }}>
                <span className="nav-icon">{darkMode ? '○' : '●'}</span> {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
            <div className="side-nav-footer">
              <div className="side-nav-mock">
                Mode:
                <button className="side-nav-mock-btn" onClick={toggleMockMode}>
                  {isMockMode() ? '○ Mock' : '● Live'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Chat
        messages={messages}
        isLoading={isLoading}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
        onFeedback={handleFeedback}
        onRetry={handleRetry}
        quickPrompts={QUICK_PROMPTS}
        onQuickPrompt={handleQuickPrompt}
      />

      <div className="input-section">
        <div className="token-bar">
          <span className="token-label">{usage.remainingTokens} tokens remaining</span>
          <div className="token-meter">
            <div className="token-fill" style={{ width: `${Math.max(0, (usage.remainingTokens / usage.totalTokens) * 100)}%` }} />
          </div>
        </div>
        <div className="input-bar">
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="send"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { window.scrollTo(0, 0); }}
            placeholder="What are you looking for?"
            disabled={isLoading}
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="send-btn">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
