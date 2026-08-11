import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit3, AlertTriangle, ArrowUpRight, ArrowDownLeft, Package } from 'lucide-react';
import { getProductsApi, createProductApi, updateProductApi, adjustStockApi } from '../services/api';
import { Product, Pagination as PaginationType } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

interface ProductsProps {
  navigate: (path: string) => void;
}

export const Products: React.FC<ProductsProps> = ({ navigate }) => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Product Create/Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: '',
    currentStock: '',
    minStockAlert: '10',
    location: ''
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Adjust Stock Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({
    quantity: '1',
    type: 'IN' as 'IN' | 'OUT',
    reason: ''
  });
  const [adjustingStock, setAdjustingStock] = useState(false);

  useEffect(() => {
    fetchProducts(1);
  }, [search, categoryFilter, lowStockOnly]);

  const fetchProducts = async (page: number) => {
    try {
      setLoading(true);
      const res = await getProductsApi({
        search,
        category: categoryFilter,
        lowStock: lowStockOnly ? 'true' : undefined,
        page,
        limit: 10
      });
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Error fetching products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: '',
      category: 'Power Tools',
      unitPrice: '',
      currentStock: '0',
      minStockAlert: '10',
      location: 'Warehouse A - Bay 1'
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice.toString(),
      currentStock: p.currentStock.toString(),
      minStockAlert: p.minStockAlert.toString(),
      location: p.location
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      if (editingProduct) {
        await updateProductApi(editingProduct.id, {
          name: productForm.name,
          sku: productForm.sku,
          category: productForm.category,
          unitPrice: parseFloat(productForm.unitPrice),
          minStockAlert: parseInt(productForm.minStockAlert, 10),
          location: productForm.location
        });
      } else {
        await createProductApi({
          name: productForm.name,
          sku: productForm.sku,
          category: productForm.category,
          unitPrice: parseFloat(productForm.unitPrice),
          currentStock: parseInt(productForm.currentStock, 10) || 0,
          minStockAlert: parseInt(productForm.minStockAlert, 10) || 10,
          location: productForm.location
        });
      }
      setIsProductModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleOpenStockModal = (p: Product) => {
    setSelectedProductForStock(p);
    setStockForm({
      quantity: '10',
      type: 'IN',
      reason: 'Manual Stock Intake / Vendor Restock'
    });
    setIsStockModalOpen(true);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForStock) return;
    setAdjustingStock(true);
    try {
      await adjustStockApi(
        selectedProductForStock.id,
        parseInt(stockForm.quantity, 10),
        stockForm.type,
        stockForm.reason
      );
      setIsStockModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adjusting stock');
    } finally {
      setAdjustingStock(false);
    }
  };

  return (
    <div>
      {/* Header Actions & Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search product name, SKU, category, warehouse location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className={`btn ${lowStockOnly ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setLowStockOnly(!lowStockOnly)}
          >
            <AlertTriangle size={16} /> Low Stock Filter
          </button>
        </div>

        {hasRole('Admin', 'Warehouse') && (
          <button className="btn btn-primary" onClick={handleOpenCreateProduct}>
            <Plus size={18} /> Add New Product
          </button>
        )}
      </div>

      {/* Product Data Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Current Stock</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                      Loading inventory catalog...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.currentStock <= p.minStockAlert;
                    return (
                      <tr key={p.id} style={{ backgroundColor: isLow ? '#FEF2F2' : undefined }}>
                        <td><code style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.sku}</code></td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</div>
                          {isLow && (
                            <span style={{ fontSize: '0.725rem', color: '#DC2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <AlertTriangle size={12} /> Below Min Alert ({p.minStockAlert})
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: '#F1F5F9', borderRadius: '4px' }}>
                            {p.category}
                          </span>
                        </td>
                        <td><strong>₹{p.unitPrice.toFixed(2)}</strong></td>
                        <td>
                          <strong style={{ fontSize: '1rem', color: isLow ? '#DC2626' : '#059669' }}>
                            {p.currentStock} units
                          </strong>
                        </td>
                        <td>{p.location}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            {hasRole('Admin', 'Warehouse') && (
                              <button
                                className="btn btn-secondary btn-sm"
                                title="Adjust Stock (IN / OUT)"
                                onClick={() => handleOpenStockModal(p)}
                              >
                                Adjust Stock
                              </button>
                            )}
                            {hasRole('Admin', 'Warehouse') && (
                              <button
                                className="btn btn-secondary btn-sm"
                                title="Edit Product Details"
                                onClick={() => handleOpenEditProduct(p)}
                              >
                                <Edit3 size={15} />
                              </button>
                            )}
                          </div>
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

      <Pagination pagination={pagination} onPageChange={(p) => fetchProducts(p)} />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product Details' : 'Add New Inventory Product'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveProduct} disabled={savingProduct}>
              {savingProduct ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">SKU / Code *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="PWR-DRL-800"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Power Tools, Hardware..."
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                value={productForm.unitPrice}
                onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock Alert Quantity *</label>
              <input
                type="number"
                className="form-input"
                required
                value={productForm.minStockAlert}
                onChange={(e) => setProductForm({ ...productForm, minStockAlert: e.target.value })}
              />
            </div>
          </div>

          {!editingProduct && (
            <div className="form-group">
              <label className="form-label">Initial Stock Intake Quantity</label>
              <input
                type="number"
                className="form-input"
                value={productForm.currentStock}
                onChange={(e) => setProductForm({ ...productForm, currentStock: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Warehouse Location / Shelf *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="Warehouse A - Bay 3"
              value={productForm.location}
              onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Manual Stock Adjustment Modal (IN / OUT) */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Adjust Inventory Stock: ${selectedProductForStock?.name}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsStockModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAdjustStock} disabled={adjustingStock}>
              {adjustingStock ? 'Updating Stock...' : 'Save Stock Adjustment'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAdjustStock}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Current Available Stock: <strong style={{ color: '#059669', fontSize: '1rem' }}>{selectedProductForStock?.currentStock} units</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Movement Type</label>
              <select
                className="form-select"
                value={stockForm.type}
                onChange={(e) => setStockForm({ ...stockForm, type: e.target.value as 'IN' | 'OUT' })}
              >
                <option value="IN">IN (Stock Addition / Restock)</option>
                <option value="OUT">OUT (Stock Reduction / Adjustment)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity Changed *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                required
                value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mandatory Reason / Notes *</label>
            <textarea
              className="form-textarea"
              rows={3}
              required
              placeholder="Provide reason (e.g. Received shipment PO-9082, Damaged inventory scrap, Stock Audit correction...)"
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
