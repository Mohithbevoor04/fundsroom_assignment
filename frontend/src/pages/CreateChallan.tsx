import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ShieldAlert, CheckCircle, Save, AlertTriangle } from 'lucide-react';
import { getCustomersApi, getProductsApi, createChallanApi } from '../services/api';
import { Customer, Product } from '../types';

interface CreateChallanProps {
  navigate: (path: string) => void;
}

interface ChallanLineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export const CreateChallan: React.FC<CreateChallanProps> = ({ navigate }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [lineItems, setLineItems] = useState<ChallanLineItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [custRes, prodRes] = await Promise.all([
        getCustomersApi({ limit: 100 }),
        getProductsApi({ limit: 100 })
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);

      if (custRes.data.length > 0) {
        setSelectedCustomerId(custRes.data[0].id);
      }

      if (prodRes.data.length > 0) {
        // Pre-populate with 1 empty line item
        const p = prodRes.data[0];
        setLineItems([{
          productId: p.id,
          quantity: 1,
          unitPrice: p.unitPrice,
          subtotal: p.unitPrice
        }]);
      }
    } catch (err: any) {
      setErrorMessage('Failed to load customers or products for challan creation.');
    } finally {
      setLoadingData(false);
    }
  };

  const productMap = new Map(products.map(p => [p.id, p]));

  const handleAddRow = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    setLineItems([
      ...lineItems,
      {
        productId: defaultProd.id,
        quantity: 1,
        unitPrice: defaultProd.unitPrice,
        subtotal: defaultProd.unitPrice
      }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = productMap.get(productId);
    if (!prod) return;

    const updated = [...lineItems];
    updated[index].productId = productId;
    updated[index].unitPrice = prod.unitPrice;
    updated[index].subtotal = prod.unitPrice * updated[index].quantity;
    setLineItems(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const qty = Math.max(1, quantity);
    const updated = [...lineItems];
    updated[index].quantity = qty;
    updated[index].subtotal = updated[index].unitPrice * qty;
    setLineItems(updated);
  };

  const handleUnitPriceChange = (index: number, unitPrice: number) => {
    const price = Math.max(0, unitPrice);
    const updated = [...lineItems];
    updated[index].unitPrice = price;
    updated[index].subtotal = price * updated[index].quantity;
    setLineItems(updated);
  };

  const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = lineItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async (status: 'Draft' | 'Confirmed') => {
    setErrorMessage('');

    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer.');
      return;
    }

    if (lineItems.length === 0) {
      setErrorMessage('Please add at least one product row.');
      return;
    }

    // Client-side negative stock warning check if confirming
    if (status === 'Confirmed') {
      for (const item of lineItems) {
        const prod = productMap.get(item.productId);
        if (prod && prod.currentStock < item.quantity) {
          setErrorMessage(`Insufficient stock for '${prod.name}'. Available: ${prod.currentStock}, Requested: ${item.quantity}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await createChallanApi({
        customerId: selectedCustomerId,
        items: lineItems,
        status
      });
      navigate(`/challans/${res.challan.id}`);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error generating sales challan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading challan builder...</div>;

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1.25rem' }} onClick={() => navigate('/challans')}>
        <ArrowLeft size={16} /> Back to Sales Challans
      </button>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Generate New Sales Delivery Challan</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Challan # will be auto-generated</span>
        </div>

        <div className="card-body">
          {errorMessage && (
            <div className="alert alert-error">
              <ShieldAlert size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="form-group" style={{ maxWidth: '500px', marginBottom: '2rem' }}>
            <label className="form-label">Select Bill-To Customer *</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} ({c.name} - {c.customerType})
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Line Items Table */}
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Challan Line Items
          </h3>

          <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Product Selection</th>
                  <th style={{ width: '15%' }}>Available Stock</th>
                  <th style={{ width: '15%' }}>Unit Price (₹)</th>
                  <th style={{ width: '15%' }}>Quantity</th>
                  <th style={{ width: '15%' }}>Subtotal (₹)</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => {
                  const prod = productMap.get(item.productId);
                  const isInsufficient = prod ? prod.currentStock < item.quantity : false;

                  return (
                    <tr key={index}>
                      <td>
                        <select
                          className="form-select"
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.sku}] {p.name} - ₹{p.unitPrice.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {prod ? (
                          <span style={{ fontWeight: 600, color: isInsufficient ? '#DC2626' : '#059669' }}>
                            {prod.currentStock} units
                            {isInsufficient && (
                              <div style={{ fontSize: '0.725rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <AlertTriangle size={11} /> Stock Low
                              </div>
                            )}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          value={item.unitPrice}
                          onChange={(e) => handleUnitPriceChange(index, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                        />
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem' }}>₹{item.subtotal.toFixed(2)}</strong>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={lineItems.length <= 1}
                          onClick={() => handleRemoveRow(index)}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button className="btn btn-secondary btn-sm" style={{ marginBottom: '2rem' }} onClick={handleAddRow}>
            <Plus size={16} /> Add Product Item
          </button>

          {/* Grand Totals Summary Box */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Line Items:</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{lineItems.length} products ({totalQuantity} total units)</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Grand Total Amount:</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB', fontFamily: 'Outfit' }}>
                ₹{totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/challans')}>
              Cancel
            </button>
            <button
              className="btn btn-secondary"
              disabled={submitting}
              onClick={() => handleSubmit('Draft')}
            >
              <Save size={18} /> Save as Draft
            </button>
            <button
              className="btn btn-success"
              disabled={submitting}
              onClick={() => handleSubmit('Confirmed')}
            >
              <CheckCircle size={18} /> Confirm & Deduct Inventory Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
