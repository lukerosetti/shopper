import React, { useEffect, useRef } from 'react';
import ProductCard, { parseProducts, getTextWithoutProducts } from './ProductCard';

function ChatMessage({ message, onAddToCart, onAddToWishlist, onFeedback, onRetry }) {
  if (message.role === 'user') {
    return (
      <div className="message user-message fade-in">
        <div className="bubble user-bubble">{message.content}</div>
      </div>
    );
  }

  const products = parseProducts(message.content);
  const text = getTextWithoutProducts(message.content);

  return (
    <div className="message ai-message fade-in">
      {text && (
        <div className={`bubble ai-bubble ${message.isError ? 'error-bubble' : ''}`}>
          {text}
          {message.isError && onRetry && (
            <button className="retry-btn" onClick={onRetry}>Retry</button>
          )}
        </div>
      )}
      {products.length > 0 && (
        <div className="products-carousel">
          <div className="products-carousel-track">
            {products.map((product, i) => (
              <ProductCard key={i} product={product} onAddToCart={onAddToCart} onAddToWishlist={onAddToWishlist} onFeedback={onFeedback} />
            ))}
          </div>
          <div className="carousel-hint">swipe for more →</div>
        </div>
      )}
    </div>
  );
}

function Chat({ messages, isLoading, onAddToCart, onAddToWishlist, onFeedback, onRetry, quickPrompts, onQuickPrompt }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-area">
      {messages.length === 0 && <div className="chat-empty-spacer" />}
      {messages.length <= 1 && quickPrompts && (
        <div className="quick-prompts">
          {quickPrompts.map((prompt, i) => (
            <button key={i} className="quick-prompt-btn" onClick={() => onQuickPrompt(prompt.text)}>
              <span className="quick-prompt-icon">{prompt.icon}</span>
              <span className="quick-prompt-text">{prompt.label}</span>
            </button>
          ))}
        </div>
      )}
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} onAddToCart={onAddToCart} onAddToWishlist={onAddToWishlist} onFeedback={onFeedback} onRetry={msg.isError ? onRetry : null} />
      ))}
      {isLoading && (
        <div className="message ai-message">
          <div className="bubble ai-bubble loading-bubble">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export default Chat;
