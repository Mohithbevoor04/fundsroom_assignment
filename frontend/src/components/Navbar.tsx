import React from 'react';
import { ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { user, switchRoleQuick } = useAuth();

  const roleEmails: Record<Role, string> = {
    Admin: 'admin@erp.com',
    Sales: 'sales@erp.com',
    Warehouse: 'warehouse@erp.com',
    Accounts: 'accounts@erp.com'
  };

  const handleQuickSwitch = (role: Role) => {
    if (user?.role === role) return;
    switchRoleQuick(roleEmails[role]);
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="navbar-right">
        {/* Quick Role Switcher pill for immediate assignment evaluation testing */}
        <div className="role-switcher">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <RefreshCw size={12} /> Test Role:
          </span>
          {(['Admin', 'Sales', 'Warehouse', 'Accounts'] as Role[]).map((r) => (
            <button
              key={r}
              className={`role-pill ${user?.role === r ? 'active' : ''}`}
              onClick={() => handleQuickSwitch(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}>
            <ShieldCheck size={20} />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
