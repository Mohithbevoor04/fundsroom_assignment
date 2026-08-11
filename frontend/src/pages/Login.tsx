import React, { useState } from 'react';
import { Boxes, Key, Mail, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login(roleEmail, 'password123');
    } catch (err: any) {
      setError('Quick login failed. Please ensure database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  const demoRoles: { role: Role; email: string; desc: string; bg: string }[] = [
    { role: 'Admin', email: 'admin@erp.com', desc: 'Full System Access & Permissions', bg: '#F3E8FF' },
    { role: 'Sales', email: 'sales@erp.com', desc: 'Customer CRM & Sales Challans', bg: '#E0F2FE' },
    { role: 'Warehouse', email: 'warehouse@erp.com', desc: 'Stock Intake & Inventory Logs', bg: '#FEF3C7' },
    { role: 'Accounts', email: 'accounts@erp.com', desc: 'Challan Invoicing & Finance PDF', bg: '#ECFDF5' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0F172A',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '920px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Left Section - Branding & Demo Role Selector */}
        <div style={{
          backgroundColor: '#1E293B',
          padding: '2.5rem',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', padding: '0.6rem', borderRadius: '10px' }}>
                <Boxes size={28} color="#FFFFFF" />
              </div>
              <div>
                <h1 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  Mini ERP + CRM
                </h1>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Wholesale Operations Portal</p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#CBD5E1', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Select a test role below to log in instantly without manually typing credentials:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {demoRoles.map((item) => (
                <div
                  key={item.role}
                  onClick={() => handleQuickLogin(item.email)}
                  style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38BDF8')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC' }}>
                      {item.role} Demo Account
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.desc}</div>
                  </div>
                  <ArrowRight size={16} color="#38BDF8" />
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2rem' }}>
            Built with Express, Prisma, SQLite & React.
          </div>
        </div>

        {/* Right Section - Manual Login Form */}
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0F172A' }}>
            Sign In to Account
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.5rem' }}>
            Enter your employee credentials to continue
          </p>

          {error && (
            <div className="alert alert-error">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="admin@erp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '0.25rem' }}>
                Default Password: <strong>password123</strong>
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
