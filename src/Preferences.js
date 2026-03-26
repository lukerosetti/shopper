import React, { useState, useEffect } from 'react';
import { getPreferences, savePreferences, resetPreferences, clearFeedback } from './api';

const DEFAULT_PREFS = {
  sizes: { tops: '', bottoms: '', shoes: '' },
  styles: '',
  budgetRange: '',
  favoriteStores: '',
  avoidBrands: '',
  colors: '',
  notes: '',
};

function PrefsField({ label, placeholder, value, onChange, icon }) {
  return (
    <div className="prefs-field">
      <div className="prefs-field-label">
        {icon && <span className="prefs-field-icon">{icon}</span>}
        {label}
      </div>
      <input
        className="prefs-field-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function Preferences({ onBack }) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmResetPrefs, setConfirmResetPrefs] = useState(false);
  const [confirmResetFeedback, setConfirmResetFeedback] = useState(false);

  useEffect(() => {
    getPreferences().then(data => {
      if (data && Object.keys(data).length > 0) {
        setPrefs({ ...DEFAULT_PREFS, ...data });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePreferences(prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save');
    }
    setSaving(false);
  };

  const updateSize = (key, value) => {
    setPrefs(p => ({ ...p, sizes: { ...p.sizes, [key]: value } }));
  };

  if (loading) return <div className="prefs-loading">Loading preferences...</div>;

  return (
    <div className="prefs-view">
      <div className="prefs-header">
        <button className="prefs-back" onClick={onBack}>‹ Back</button>
        <h2>My Style Profile</h2>
      </div>

      <div className="prefs-form">
        <div className="prefs-card">
          <div className="prefs-card-title">— My Sizes</div>
          <div className="prefs-size-grid">
            <div className="prefs-size-item">
              <span className="prefs-size-label">Tops</span>
              <input className="prefs-size-input" placeholder="e.g. M" value={prefs.sizes.tops} onChange={e => updateSize('tops', e.target.value)} />
            </div>
            <div className="prefs-size-item">
              <span className="prefs-size-label">Bottoms</span>
              <input className="prefs-size-input" placeholder="e.g. 6" value={prefs.sizes.bottoms} onChange={e => updateSize('bottoms', e.target.value)} />
            </div>
            <div className="prefs-size-item">
              <span className="prefs-size-label">Shoes</span>
              <input className="prefs-size-input" placeholder="e.g. 8" value={prefs.sizes.shoes} onChange={e => updateSize('shoes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="prefs-card">
          <div className="prefs-card-title">— Style & Taste</div>
          <PrefsField icon="◇" label="My Style" placeholder="e.g. casual, boho, minimalist" value={prefs.styles} onChange={e => setPrefs(p => ({ ...p, styles: e.target.value }))} />
          <PrefsField icon="○" label="Favorite Colors" placeholder="e.g. sage green, black, cream" value={prefs.colors} onChange={e => setPrefs(p => ({ ...p, colors: e.target.value }))} />
          <PrefsField icon="·" label="Budget Range" placeholder="e.g. $25-75" value={prefs.budgetRange} onChange={e => setPrefs(p => ({ ...p, budgetRange: e.target.value }))} />
        </div>

        <div className="prefs-card">
          <div className="prefs-card-title">— Shopping Preferences</div>
          <PrefsField icon="□" label="Favorite Stores" placeholder="e.g. Zara, H&M, Nordstrom" value={prefs.favoriteStores} onChange={e => setPrefs(p => ({ ...p, favoriteStores: e.target.value }))} />
          <PrefsField icon="×" label="Brands to Avoid" placeholder="e.g. Shein, Forever 21" value={prefs.avoidBrands} onChange={e => setPrefs(p => ({ ...p, avoidBrands: e.target.value }))} />
        </div>

        <div className="prefs-card">
          <div className="prefs-card-title">— Anything Else</div>
          <textarea
            className="prefs-notes-input"
            placeholder="e.g. Prefers cotton, no polyester, likes oversized fits, petite frame"
            value={prefs.notes}
            onChange={e => setPrefs(p => ({ ...p, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <button className="prefs-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
        </button>

        <div className="prefs-reset-section">
          <button
            className={`prefs-reset-btn ${confirmResetPrefs ? 'confirm' : ''}`}
            onClick={async () => {
              if (!confirmResetPrefs) {
                setConfirmResetPrefs(true);
                setTimeout(() => setConfirmResetPrefs(false), 3000);
                return;
              }
              await resetPreferences();
              setPrefs(DEFAULT_PREFS);
              setConfirmResetPrefs(false);
            }}
          >
            {confirmResetPrefs ? 'Tap again to confirm' : 'Reset Preferences'}
          </button>

          <button
            className={`prefs-reset-btn ${confirmResetFeedback ? 'confirm' : ''}`}
            onClick={async () => {
              if (!confirmResetFeedback) {
                setConfirmResetFeedback(true);
                setTimeout(() => setConfirmResetFeedback(false), 3000);
                return;
              }
              await clearFeedback();
              setConfirmResetFeedback(false);
            }}
          >
            {confirmResetFeedback ? 'Tap again to confirm' : 'Clear Style History'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Preferences;
