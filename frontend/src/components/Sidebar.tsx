import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  History, 
  PlusCircle, 
  Boxes,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, navigate }) => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, show: true },
    { label: 'Customer CRM', path: '/customers', icon: Users, show: true },
    { label: 'Products & Inventory', path: '/products', icon: Package, show: true },
    { label: 'Stock Audit Logs', path: '/stock-logs', icon: History, show: true },
    { label: 'Sales Challans', path: '/challans', icon: FileText, show: true },
    { label: 'Create Sales Challan', path: '/challans/create', icon: PlusCircle, show: hasRole('Admin', 'Sales') },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
          <Boxes size={24} color="#FFFFFF" />
        </div>
        <div>
          <div className="sidebar-brand">MINI ERP + CRM</div>
          <div style={{ fontSize: '0.725rem', color: '#94A3B8', fontWeight: 500 }}>Ops Portal v1.0</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path) && item.path !== '/challans/create');
          return (
            <div
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#94A3B8' }}>
              Role: <strong style={{ color: '#60A5FA' }}>{user?.role}</strong>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
