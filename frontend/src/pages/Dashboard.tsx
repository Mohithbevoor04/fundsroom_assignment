import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  FileText, 
  IndianRupee, 
  ArrowUpRight, 
  Calendar, 
  Plus, 
  Package, 
  History 
} from 'lucide-react';
import { getDashboardStatsApi } from '../services/api';
import { DashboardStats } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  navigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ navigate }) => {
  const { hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStatsApi();
      setStats(data);
    } catch (err: any) {
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard analytics...</div>;
  }

  if (error || !stats) {
    return <div className="alert alert-error">{error || 'Dashboard data unavailable'}</div>;
  }

  return (
    <div>
      {/* Executive KPI Overview Cards */}
      <div className="grid-4">
        <div className="stat-card">
          <div>
            <div className="stat-title">Active Customers</div>
            <div className="stat-value">{stats.summary.activeCustomers}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {stats.summary.leadCustomers} Leads pending conversion
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: stats.summary.lowStockCount > 0 ? '#FCA5A5' : 'var(--border-color)' }}>
          <div>
            <div className="stat-title">Low Stock Warnings</div>
            <div className="stat-value" style={{ color: stats.summary.lowStockCount > 0 ? '#DC2626' : 'var(--text-main)' }}>
              {stats.summary.lowStockCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Items below min threshold
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">Draft Sales Challans</div>
            <div className="stat-value">{stats.summary.pendingChallans}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {stats.summary.confirmedChallansCount} Confirmed & Fulfilled
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <FileText size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">Confirmed Sales Revenue</div>
            <div className="stat-value">₹{stats.summary.totalRevenue.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Total fulfilled challan value
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
            <IndianRupee size={24} />
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {hasRole('Admin', 'Sales') && (
          <button className="btn btn-primary" onClick={() => navigate('/challans/create')}>
            <Plus size={18} /> Create New Sales Challan
          </button>
        )}
        {hasRole('Admin', 'Sales') && (
          <button className="btn btn-secondary" onClick={() => navigate('/customers')}>
            <Users size={18} /> Manage Customers
          </button>
        )}
        {hasRole('Admin', 'Warehouse') && (
          <button className="btn btn-secondary" onClick={() => navigate('/products')}>
            <Package size={18} /> Manage Products & Restock
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => navigate('/stock-logs')}>
          <History size={18} /> View Stock Movement Audit
        </button>
      </div>

      {/* Main Grid: Upcoming CRM Follow-ups & Recent Sales Challans */}
      <div className="grid-2">
        {/* Left Column: Recent Sales Challans */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#2563EB" /> Recent Sales Challans
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/challans')}>
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Total Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentChallans.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No sales challans generated yet.
                      </td>
                    </tr>
                  ) : (
                    stats.recentChallans.map((ch) => (
                      <tr key={ch.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/challans/${ch.id}`)}>
                        <td><strong style={{ color: '#2563EB' }}>{ch.challanNumber}</strong></td>
                        <td>{ch.customer?.businessName || ch.customer?.name}</td>
                        <td>{ch.totalQuantity} items</td>
                        <td>₹{ch.totalAmount.toLocaleString('en-IN')}</td>
                        <td><Badge status={ch.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: CRM Follow-ups Due */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#D97706" /> Upcoming CRM Follow-ups
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/customers')}>
              View CRM <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="card-body">
            {stats.upcomingFollowUps.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                No pending customer follow-ups.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats.upcomingFollowUps.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => navigate(`/customers/${cust.id}`)}
                    style={{
                      padding: '0.85rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: 'var(--bg-surface)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{cust.businessName}</strong>
                      <Badge status={cust.status} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Contact: {cust.name} ({cust.mobile})
                    </div>
                    {cust.followUpDate && (
                      <div style={{ fontSize: '0.775rem', color: '#D97706', fontWeight: 600, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={12} /> Due: {new Date(cust.followUpDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
