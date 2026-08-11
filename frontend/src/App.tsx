import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Products } from './pages/Products';
import { StockLogs } from './pages/StockLogs';
import { Challans } from './pages/Challans';
import { CreateChallan } from './pages/CreateChallan';
import { ChallanDetail } from './pages/ChallanDetail';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', color: '#FFFFFF' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Outfit', marginBottom: '0.5rem' }}>Mini ERP + CRM Operations Portal</h2>
          <p style={{ color: '#94A3B8' }}>Initializing session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Render Page Content based on currentPath
  const renderPage = () => {
    if (currentPath === '/') {
      return <Dashboard navigate={navigate} />;
    }
    if (currentPath === '/customers') {
      return <Customers navigate={navigate} />;
    }
    if (currentPath.startsWith('/customers/')) {
      const id = currentPath.split('/customers/')[1];
      return <CustomerDetail id={id} navigate={navigate} />;
    }
    if (currentPath === '/products') {
      return <Products navigate={navigate} />;
    }
    if (currentPath === '/stock-logs') {
      return <StockLogs />;
    }
    if (currentPath === '/challans') {
      return <Challans navigate={navigate} />;
    }
    if (currentPath === '/challans/create') {
      return <CreateChallan navigate={navigate} />;
    }
    if (currentPath.startsWith('/challans/')) {
      const id = currentPath.split('/challans/')[1];
      return <ChallanDetail id={id} navigate={navigate} />;
    }
    return <Dashboard navigate={navigate} />;
  };

  const getPageTitle = () => {
    if (currentPath === '/') return 'Operations Overview Dashboard';
    if (currentPath.startsWith('/customers')) return 'Customer Relationship Management (CRM)';
    if (currentPath === '/products') return 'Products & Inventory Stock';
    if (currentPath === '/stock-logs') return 'Inventory Stock Movement Audit History';
    if (currentPath.startsWith('/challans/create')) return 'Generate Sales Challan';
    if (currentPath.startsWith('/challans')) return 'Sales Delivery Challans & Invoicing';
    return 'Mini ERP Portal';
  };

  return (
    <div className="app-container">
      <Sidebar currentPath={currentPath} navigate={navigate} />
      <div className="main-content">
        <Navbar title={getPageTitle()} />
        <main className="page-body">{renderPage()}</main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
