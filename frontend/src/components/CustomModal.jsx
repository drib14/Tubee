import React from 'react';

const CustomModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  isAlert = false 
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      animation: 'slideDown 0.15s ease-out'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-sidebar)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h3 style={{ 
          fontFamily: 'Outfit', 
          fontSize: '1.2rem', 
          color: 'var(--text-primary)',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '8px'
        }}>
          {title}
        </h3>
        
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px',
          marginTop: '8px'
        }}>
          {!isAlert && (
            <button 
              onClick={onCancel}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {cancelText}
            </button>
          )}
          
          <button 
            onClick={onConfirm}
            className="btn btn-primary"
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.85rem',
              backgroundColor: isAlert ? 'var(--coffee-700)' : 'var(--accent)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
