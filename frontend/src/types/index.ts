export type Role = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';
export type StockMovementType = 'IN' | 'OUT';
export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdById: string;
  createdBy?: { id: string; name: string; role: Role };
  createdAt: string;
  updatedAt: string;
  _count?: { followUps: number; challans: number };
  followUps?: CustomerFollowUp[];
  challans?: SalesChallan[];
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  createdById: string;
  createdBy: { id: string; name: string; role: Role };
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  createdAt: string;
  updatedAt: string;
  stockLogs?: StockLog[];
}

export interface StockLog {
  id: string;
  productId: string;
  product?: { id: string; name: string; sku: string; location?: string };
  quantity: number;
  type: StockMovementType;
  reason: string;
  createdById: string;
  createdBy?: { id: string; name: string; role: Role };
  createdAt: string;
}

export interface ChallanItem {
  id?: string;
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  product?: { id: string; name: string; sku: string; currentStock: number };
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: Customer;
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdById: string;
  createdBy?: { id: string; name: string; role: Role };
  createdAt: string;
  updatedAt: string;
  items: ChallanItem[];
}

export interface DashboardStats {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    leadCustomers: number;
    lowStockCount: number;
    pendingChallans: number;
    confirmedChallansCount: number;
    totalRevenue: number;
  };
  upcomingFollowUps: Customer[];
  recentChallans: SalesChallan[];
  recentStockLogs: StockLog[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
