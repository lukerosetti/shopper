import React, { useEffect, useRef } from 'react';
import ProductCard, { parseProducts, getTextWithoutProducts } from './ProductCard';

function ChatMessage({ message, onAddToCart, onRetry }) {
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
              <ProductCard key={i} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
          <div className="carousel-hint">swipe for more →</div>
        </div>
      )}
    </div>
  );
}

function Chat({ messages, isLoading, onAddToCart, onRetry }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-area">
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} onAddToCart={onAddToCart} onRetry={msg.isError ? onRetry : null} />
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
