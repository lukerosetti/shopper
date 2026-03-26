import React, { useState, useEffect } from 'react';
import { getOrders, updateOrder } from './api';
import { getReturnPolicy } from './returnPolicies';

function Orders({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');

  useEffect(() => {
    getOrders().then(items => {
      setOrders(items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAddTracking = async (id) => {
    try {
      const isUrl = trackingInput.startsWith('http');
      const result = await updateOrder(id, {
        trackingUrl: isUrl ? trackingInput : '',
        trackingNumber: isUrl ? '' : trackingInput,
        status: 'shipped',
      });
      setOrders(result.orders || []);
      setEditingId(null);
      setTrackingInput('');
    } catch (err) {
      alert('Failed to update tracking');
    }
  };

  const getDaysSincePurchase = (date) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const getReturnDeadline = (item) => {
    const policy = getReturnPolicy(item.store);
    if (!policy || policy.days === -1) return null;
    const purchaseDate = new Date(item.purchasedAt);
    const deadline = new Date(purchaseDate.getTime() + policy.days * 86400000);
    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
    if (daysLeft <= 0) return { text: 'Return window closed', urgent: true };
    if (daysLeft <= 7) return { text: `${daysLeft} days left to return`, urgent: true };
    return { text: `${daysLeft} days left to return`, urgent: false };
  };

  if (loading) return <div className="cart-loading">Loading orders...</div>;

  return (
    <div className="cart-view">
      <div className="cart-header">
        <button className="cart-back" onClick={onBack}>Back</button>
        <h2>My Orders ({orders.length})</h2>
      </div>

      {orders.length === 0 ? (
        <div className="cart-empty">
          <p>No purchases yet</p>
          <p className="cart-empty-sub">Mark items as purchased from your cart</p>
        </div>
      ) : (
        <div className="cart-items">
          {orders.map(order => {
            const returnInfo = getReturnDeadline(order);
            return (
              <div key={order.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{order.name}</div>
                  <div className="cart-item-price">{order.price}</div>
                  <div className="cart-item-store">{order.store}</div>
                  <div className="order-date">Purchased {getDaysSincePurchase(order.purchasedAt)}</div>

                  {returnInfo && (
                    <div className={`order-return-window ${returnInfo.urgent ? 'urgent' : ''}`}>
                      ↩ {returnInfo.text}
                    </div>
                  )}

                  {order.trackingUrl ? (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="order-tracking-link">
                      Track Package →
                    </a>
                  ) : order.trackingNumber ? (
                    <div className="order-tracking-number">Tracking: {order.trackingNumber}</div>
                  ) : null}

                  {editingId === order.id ? (
                    <div className="order-tracking-form">
                      <input
                        className="order-tracking-input"
                        placeholder="Tracking URL or number"
                        value={trackingInput}
                        onChange={e => setTrackingInput(e.target.value)}
                        autoFocus
                      />
                      <div className="order-tracking-btns">
                        <button className="order-save-btn" onClick={() => handleAddTracking(order.id)} disabled={!trackingInput.trim()}>Save</button>
                        <button className="order-cancel-btn" onClick={() => { setEditingId(null); setTrackingInput(''); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="order-add-tracking" onClick={() => { setEditingId(order.id); setTrackingInput(order.trackingUrl || order.trackingNumber || ''); }}>
                      {order.trackingUrl || order.trackingNumber ? 'Edit Tracking' : 'Add Tracking'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Orders;
