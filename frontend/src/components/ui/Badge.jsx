import React from 'react';

const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
      case 'mahasiswa':
        return 'badge-primary';
      case 'success':
      case 'approved':
      case 'sent':
      case 'bekerja':
        return 'badge-success';
      case 'warning':
      case 'pending':
      case 'queued':
      case 'wirausaha':
      case 'magang':
        return 'badge-warning';
      case 'danger':
      case 'rejected':
      case 'failed':
      case 'belum_kerja':
        return 'badge-danger';
      case 'info':
      case 'beasiswa':
      case 'full_time':
        return 'badge-info';
      case 'secondary':
      case 'gap_year':
      case 'part_time':
      default:
        return 'badge-secondary';
    }
  };

  const sizeStyle = size === 'sm' ? { fontSize: '0.7rem', padding: '0.15rem 0.5rem' } : {};

  return (
    <span className={`badge ${getVariantClass()}`} style={sizeStyle}>
      {children}
    </span>
  );
};

export default Badge;
