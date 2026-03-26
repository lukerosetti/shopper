import React, { useState, useEffect } from 'react';
import { getChatHistory, deleteChatHistory } from './api';

function ChatHistory({ onBack, onLoadChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChatHistory().then(c => { setChats(c || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      const result = await deleteChatHistory(id);
      setChats(result.chats || []);
    } catch { /* silent */ }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) return <div className="cart-loading">Loading history...</div>;

  return (
    <div className="cart-view">
      <div className="cart-header">
        <button className="cart-back" onClick={onBack}>Back</button>
        <h2>Chat History</h2>
      </div>

      {chats.length === 0 ? (
        <div className="cart-empty">
          <p>No saved chats yet</p>
          <p className="cart-empty-sub">Your conversations will appear here</p>
        </div>
      ) : (
        <div className="history-list">
          {chats.map(chat => (
            <div key={chat.id} className="history-item" onClick={() => onLoadChat(chat)}>
              <div className="history-item-title">{chat.title}</div>
              <div className="history-item-meta">
                <span>{formatDate(chat.savedAt)}</span>
                <span>{chat.messageCount} messages</span>
              </div>
              <button className="history-delete" onClick={(e) => { e.stopPropagation(); handleDelete(chat.id); }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatHistory;
