import React, { useState, useEffect, useRef } from 'react';
import { getCloset, addToCloset, removeFromCloset } from './api';

function Closet({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    getCloset().then(data => {
      setItems(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        const base64 = dataUrl.split(',')[1];
        const mimeType = file.type || 'image/jpeg';

        try {
          const result = await addToCloset(base64, mimeType);
          setItems(result.items || []);
        } catch (err) {
          setError(err.message.includes('token') ? 'Not enough tokens to analyze. Try again tomorrow!' : 'Failed to analyze image.');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Failed to read image');
      setUploading(false);
    }

    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRemove = async (id) => {
    try {
      const result = await removeFromCloset(id);
      setItems(result.items || []);
    } catch {
      alert('Failed to remove item');
    }
  };

  if (loading) return <div className="cart-loading">Loading closet...</div>;

  return (
    <div className="cart-view">
      <div className="cart-header">
        <button className="cart-back" onClick={onBack}>Back</button>
        <h2>My Closet ({items.length})</h2>
      </div>

      <div className="closet-upload-section">
        <p className="closet-hint">
          Add photos of clothes you own. The AI will analyze each item so it can suggest pieces that complement your wardrobe.
        </p>
        <button
          className="closet-upload-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Analyzing...' : 'Add from Camera or Photos'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        {error && <p className="closet-error">{error}</p>}
        <p className="closet-cost-note">Uses ~2 tokens per photo</p>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>Your closet is empty</p>
          <p className="cart-empty-sub">Add photos of clothes you already own</p>
        </div>
      ) : (
        <div className="closet-items">
          {items.map(item => (
            <div key={item.id} className="closet-item">
              <div className="closet-item-desc">{item.description}</div>
              <div className="closet-item-footer">
                <span className="closet-item-date">{new Date(item.addedAt).toLocaleDateString()}</span>
                <button className="closet-item-remove" onClick={() => handleRemove(item.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Closet;
