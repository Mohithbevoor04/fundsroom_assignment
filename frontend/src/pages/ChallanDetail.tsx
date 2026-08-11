import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, CheckCircle, XCircle, Printer, Building, Calendar, User as UserIcon } from 'lucide-react';
import { getChallanByIdApi, updateChallanStatusApi, downloadChallanPDFApi } from '../services/api';
import { SalesChallan } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

interface ChallanDetailProps {
  id: string;
  navigate: (path: string) => void;
}

export const ChallanDetail: React.FC<ChallanDetailProps> = ({ id, navigate }) => {
  const { hasRole } = useAuth();
  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const fetchChallan = async () => {
    try {
      setLoading(true);
      const data = await getChallanByIdApi(id);
      setChallan(data);
    } catch (err: any) {
      setError('Failed to fetch sales challan details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!challan) return;
    try {
      await downloadChallanPDFApi(challan.id, challan.challanNumber);
    } catch (err) {
      alert('Error downloading PDF invoice.');
    }
  };

  const handleStatusChange = async (newStatus: 'Confirmed' | 'Cancelled') => {
    if (!challan) return;
    if (newStatus === 'Confirmed' && !window.confirm('Confirming this sales challan will automatically deduct inventory stock for all line items. Proceed?')) {
      return;
    }

    setUpdatingStatus(true);
    try {
      await updateChallanStatusApi(challan.id, newStatus);
      fetchChallan();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading sales challan...</div>;
  if (error || !challan) return <div className="alert alert-error">{error || 'Challan not found'}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/challans')}>
          <ArrowLeft size={16} /> Back to Sales Challans
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF}>
            <Download size={16} /> Export PDF Invoice
          </button>
        </div>
      </div>

      {/* Main Document Card */}
      <div className="card">
        <div className="card-header" style={{ padding: '1.5rem', backgroundColor: '#0F172A', color: '#FFFFFF' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sales Delivery Challan & Invoice
            </div>
            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 700, color: '#38BDF8', margin: '0.2rem 0' }}>
              #{challan.challanNumber}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Badge status={challan.status} />
          </div>
        </div>

        <div className="card-body">
          {/* Metadata Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Customer Information */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Customer / Bill To:
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                {challan.customer?.businessName}
              </h3>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Contact: {challan.customer?.name} ({challan.customer?.mobile})
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Email: {challan.customer?.email}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                GSTIN: {challan.customer?.gstNumber || 'N/A'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Address: {challan.customer?.address}
              </div>
            </div>

            {/* Document Details */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Challan Information:
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                Issue Date: <strong>{new Date(challan.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                Generated By: <strong>{challan.createdBy?.name} ({challan.createdBy?.role})</strong>
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                Total Items Quantity: <strong>{challan.totalQuantity} units</strong>
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                Status: <Badge status={challan.status} />
              </div>
            </div>
          </div>

          {/* Itemized Snapshot Table */}
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Snapshot Itemized Products
          </h3>

          <div className="table-responsive" style={{ marginBottom: '2rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Description (Snapshot)</th>
                  <th>Unit Price (Snapshot)</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {challan.items.map((item) => (
                  <tr key={item.id}>
                    <td><code>{item.productSku}</code></td>
                    <td><strong>{item.productName}</strong></td>
                    <td>₹{item.unitPrice.toFixed(2)}</td>
                    <td>{item.quantity} units</td>
                    <td style={{ textAlign: 'right' }}><strong>₹{item.subtotal.toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total & Action Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F1F5F9',
            padding: '1.5rem',
            borderRadius: '12px'
          }}>
            <div>
              {challan.status === 'Draft' && hasRole('Admin', 'Sales', 'Warehouse') && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn btn-success"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange('Confirmed')}
                  >
                    <CheckCircle size={18} /> Confirm Challan & Deduct Inventory Stock
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange('Cancelled')}
                  >
                    <XCircle size={18} /> Cancel Draft
                  </button>
                </div>
              )}

              {challan.status === 'Confirmed' && hasRole('Admin', 'Warehouse') && (
                <button
                  className="btn btn-danger btn-sm"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('Cancelled')}
                >
                  <XCircle size={14} /> Cancel & Revert Stock
                </button>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Grand Total Amount</div>
              <div style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>
                ₹{challan.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
