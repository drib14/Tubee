import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Sparkles, AlertCircle } from 'lucide-react';
import { channelAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const CreateChannel = () => {
  const navigate = useNavigate();
  const { updateChannelInfo } = useAuth();
  
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !handle) {
      setError('Name and handle are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const response = await channelAPI.create({
        name,
        handle: cleanHandle,
        description
      });
      
      // Update local storage and context state
      updateChannelInfo(response.data);
      alert('Channel created successfully!');
      navigate(`/channel/${response.data._id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create channel. Handle might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '500px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            background: 'rgba(125, 87, 66, 0.15)',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Tv size={28} style={{ color: 'var(--coffee-200)' }} />
          </div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '1.6rem' }}>Create Your Creator Channel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
            Setting up a channel lets you upload custom videos, geolocate content, and accept coffee contributions via Paymongo.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(230, 81, 0, 0.1)',
            border: '1px solid var(--accent)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Channel Name</label>
            <input
              type="text"
              placeholder="e.g. Latte Lofi Sessions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'white',
                outline: 'none',
                fontSize: '0.95rem'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Channel Handle</label>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', paddingLeft: '14px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', userSelect: 'none' }}>@</span>
              <input
                type="text"
                placeholder="lattelofi"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  flex: 1,
                  padding: '10px 10px 10px 2px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
                required
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Letters, numbers, underscores, and dashes only.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Description (Bio)</label>
            <textarea
              placeholder="Tell viewers what your channel is about..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'white',
                outline: 'none',
                fontSize: '0.95rem',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px 0', borderRadius: '8px', marginTop: '8px' }}
          >
            {loading ? 'Creating Channel...' : 'Create Channel'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateChannel;
