import React, { useState, useEffect } from 'react';
import { History, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import { getStockLogsApi } from '../services/api';
import { StockLog, Pagination as PaginationType } from '../types';
import { Pagination } from '../components/Pagination';

export const StockLogs: React.FC = () => {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs(1);
  }, [typeFilter]);

  const fetchLogs = async (page: number) => {
    try {
      setLoading(true);
      const res = await getStockLogsApi({
        type: typeFilter,
        page,
        limit: 15
      });
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to fetch stock movement audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} color="#2563EB" /> Inventory Stock Movement Audit Logs
        </h2>

        <select className="form-select" style={{ width: '180px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Movements (IN & OUT)</option>
          <option value="IN">Stock IN Only</option>
          <option value="OUT">Stock OUT Only</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Movement Type</th>
                  <th>Quantity</th>
                  <th>Reason / Description</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      Loading inventory movement history...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No stock movement audit records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isIN = log.type === 'IN';
                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text-main)' }}>{log.product?.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {log.product?.sku}</div>
                        </td>
                        <td>
                          <span className={`badge ${isIN ? 'badge-confirmed' : 'badge-cancelled'}`}>
                            {isIN ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />} {log.type}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: isIN ? '#059669' : '#DC2626' }}>
                            {isIN ? `+${log.quantity}` : `-${log.quantity}`} units
                          </strong>
                        </td>
                        <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>{log.reason}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <div>{log.createdBy?.name || 'System'}</div>
                          <div style={{ fontSize: '0.725rem', color: '#60A5FA' }}>{log.createdBy?.role}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Pagination pagination={pagination} onPageChange={(p) => fetchLogs(p)} />
    </div>
  );
};
