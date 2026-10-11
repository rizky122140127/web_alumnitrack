import React from 'react';

const Spinner = ({ size = 'md', text = 'Memuat...' }) => {
  const pixelSize = size === 'sm' ? '18px' : size === 'lg' ? '40px' : '28px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
      <div
        style={{
          width: pixelSize,
          height: pixelSize,
          border: '3px solid var(--color-primary-100)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{text}</span>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Spinner;
