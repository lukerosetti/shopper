import React, { useEffect, useRef } from 'react';
import ProductCard, { parseProducts, getTextWithoutProducts } from './ProductCard';

function ChatMessage({ message, onAddToCart }) {
  if (message.role === 'user') {
    return (
      <div className="message user-message">
        <div className="bubble user-bubble">{message.content}</div>
      </div>
    );
  }

  const products = parseProducts(message.content);
  const text = getTextWithoutProducts(message.content);

  return (
    <div className="message ai-message">
      {text && <div className="bubble ai-bubble">{text}</div>}
      {products.length > 0 && (
        <div className="products-list">
          {products.map((product, i) => (
            <ProductCard key={i} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chat({ messages, isLoading, onAddToCart }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-area">
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} onAddToCart={onAddToCart} />
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
