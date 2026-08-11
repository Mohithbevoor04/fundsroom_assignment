import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  PlusCircle, 
  Calendar, 
  Clock, 
  User as UserIcon 
} from 'lucide-react';
import { getCustomerByIdApi, addFollowUpApi } from '../services/api';
import { Customer } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

interface CustomerDetailProps {
  id: string;
  navigate: (path: string) => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ id, navigate }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Follow-up note state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const data = await getCustomerByIdApi(id);
      setCustomer(data);
    } catch (err: any) {
      setError('Failed to fetch customer profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSubmittingNote(true);
    try {
      await addFollowUpApi(id, noteContent, nextDate);
      setIsFollowUpModalOpen(false);
      setNoteContent('');
      setNextDate('');
      fetchCustomerDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting follow-up note');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading customer profile...</div>;
  if (error || !customer) return <div className="alert alert-error">{error || 'Customer not found'}</div>;

  return (
    <div>
      {/* Back Button */}
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1.25rem' }} onClick={() => navigate('/customers')}>
        <ArrowLeft size={16} /> Back to Customer List
      </button>

      {/* Main Profile Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700 }}>{customer.businessName}</h2>
                <Badge status={customer.status} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.2rem 0.6rem', backgroundColor: '#F1F5F9', borderRadius: '4px' }}>
                  {customer.customerType}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Contact Person: <strong>{customer.name}</strong>
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => setIsFollowUpModalOpen(true)}>
              <PlusCircle size={18} /> Record CRM Follow-up Note
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.25rem 0' }} />

          {/* Contact Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
                Phone / Mobile
              </div>
              <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={15} color="#2563EB" /> {customer.mobile}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
                Email Address
              </div>
              <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={15} color="#2563EB" /> {customer.email}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
                GSTIN / Tax ID
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{customer.gstNumber || 'N/A'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
                Next Follow-up Date
              </div>
              <div style={{ fontSize: '0.9rem', color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={15} /> {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString('en-IN') : 'Not Scheduled'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Address
            </div>
            <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={15} color="#64748B" /> {customer.address}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Follow-up Timeline & Challan History */}
      <div className="grid-2">
        {/* Left Column: CRM Follow-up Timeline */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#2563EB" /> CRM Follow-up Timeline
            </h3>
          </div>
          <div className="card-body">
            {!customer.followUps || customer.followUps.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                No follow-up interactions recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {customer.followUps.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      borderLeft: '3px solid #2563EB',
                      paddingLeft: '1rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {f.createdBy?.name} ({f.createdBy?.role})
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(f.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>{f.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Historical Sales Challans */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#059669" /> Sales Challans History
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!customer.challans || customer.challans.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                        No sales challans for this customer.
                      </td>
                    </tr>
                  ) : (
                    customer.challans.map((ch) => (
                      <tr key={ch.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/challans/${ch.id}`)}>
                        <td><strong style={{ color: '#2563EB' }}>{ch.challanNumber}</strong></td>
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
      </div>

      {/* Record Follow-up Note Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Record CRM Follow-up Interaction"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsFollowUpModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddNote} disabled={submittingNote}>
              {submittingNote ? 'Saving Note...' : 'Save Note'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddNote}>
          <div className="form-group">
            <label className="form-label">Follow-up Note Details *</label>
            <textarea
              className="form-textarea"
              rows={4}
              required
              placeholder="Record details of phone call, meeting, quotation discussions, payment updates..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Next Follow-up Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
