import React from 'react';

interface BadgeProps {
  status: string;
  type?: 'status' | 'role' | 'customerType';
}

export const Badge: React.FC<BadgeProps> = ({ status, type = 'status' }) => {
  const getBadgeClass = () => {
    const s = status.toLowerCase();
    if (type === 'role') return `badge-role-${s}`;
    
    switch (s) {
      case 'active':
      case 'confirmed':
      case 'in':
        return 'badge-confirmed';
      case 'lead':
      case 'draft':
        return 'badge-draft';
      case 'inactive':
      case 'cancelled':
      case 'out':
        return 'badge-cancelled';
      default:
        return 'badge-draft';
    }
  };

  return <span className={`badge ${getBadgeClass()}`}>{status}</span>;
};
