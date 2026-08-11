# Mini ERP + CRM Operations Portal

A complete, production-grade **Mini ERP & CRM Operations Portal** built for wholesale and distribution companies. This portal handles customer relationship management (CRM), inventory stock movements, role-based authorization, sales delivery challan generation with itemized product snapshots, automated stock deduction, negative inventory prevention, PDF invoice exporting, and executive analytics.

---

## 📌 Live Production Deployment & Submission Links

- **GitHub Repository**: [https://github.com/Mohithbevoor04/fundsroom_assignment](https://github.com/Mohithbevoor04/fundsroom_assignment)
- **Live Production Frontend Portal**: [https://fundsroom-assignment-coral.vercel.app](https://fundsroom-assignment-coral.vercel.app)
- **Live Production Backend REST API**: [https://mini-erp-crm-backend-x84m.onrender.com](https://mini-erp-crm-backend-x84m.onrender.com)
- **Postman API Collection**: Included in repository as [`Mini_ERP_CRM.postman_collection.json`](./Mini_ERP_CRM.postman_collection.json)

---

## 🔑 Test Login Credentials

The production database is pre-seeded with four test user accounts representing all required system roles. Password for all accounts is **`password123`**:

| Role | Email | Access Permissions & Purpose |
| :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | Full system access to CRM, Inventory, Sales Challans, Reports, Stock Adjustments. |
| **Sales** | `sales@erp.com` | Customer CRM management, adding follow-ups, generating Draft & Confirmed Sales Challans. |
| **Warehouse** | `warehouse@erp.com` | Inventory stock management, Restock IN / OUT movement tracking, confirming Challans fulfillment. |
| **Accounts** | `accounts@erp.com` | Financial overview, Sales Challans audit, PDF Delivery Invoice exporting. |

> 💡 **Built-In Test Role Switcher**: A quick test role switcher bar is included at the top of the navbar so evaluators can switch roles with 1 click without needing to re-type login credentials.

---

## 🏗️ Core Modules & Features

### 1. Authentication & Role-Based Access Control (RBAC)
- JWT-based authentication with bcrypt password hashing.
- Four distinct system roles (`Admin`, `Sales`, `Warehouse`, `Accounts`).
- Express middleware route protection and dynamic frontend UI permissions.

### 2. Customer CRM Module
- Fields: Name, Mobile, Email, Business Name, GST Number (optional), Customer Type (`Retail`, `Wholesale`, `Distributor`), Address, Status (`Lead`, `Active`, `Inactive`), Follow-up Date, Notes.
- Search by customer name, business, mobile, or email.
- Filter by status and customer type with pagination.
- View Customer Profile with interactive CRM follow-up notes timeline and new note recorder.

### 3. Product & Inventory Module
- Fields: Product Name, SKU/Code, Category, Unit Price, Current Stock, Min Stock Alert Quantity, Warehouse Location.
- Visual Low Stock Warning badges and filter (`Current Stock <= Min Stock Alert`).
- Manual stock adjustment modal (`IN` for intake, `OUT` for deduction) with mandatory reason audit logging.
- Inventory Stock Movement Audit History log.

### 4. Sales Delivery Challan & Invoicing Module
- Dynamic Sales Challan Builder: Select customer, dynamically add/remove product lines, live unit price & subtotal calculation, total quantity, total amount.
- Auto-generated Challan Number sequence (`CHLN-YYYY-XXXX`).
- Save as `Draft` or `Confirmed`.
- **Automatic Stock Deduction**: Confirming a challan automatically reduces product stock in inventory and logs a `StockLog` entry (`type: OUT`).
- **Negative Stock Prevention**: Prevents confirming a challan if inventory stock is insufficient, returning a clear error notification (`400 Bad Request`).
- **Product Data Snapshots**: Each challan item stores historical snapshot data (`productName`, `productSku`, `unitPrice` at moment of challan generation).
- **PDF Invoice Export**: Real-time downloadable PDF delivery challan invoice generated via PDFKit stream.

---

## 🚀 Local Setup Instructions

### Prerequisites
- **Node.js**: v18 or higher (Tested on Node.js v22)
- **npm**: v9 or higher

### Step 1: Clone Repository
```bash
git clone https://github.com/Mohithbevoor04/fundsroom_assignment.git
cd fundsroom_assignment
```

### Step 2: Setup & Start Backend API Server
```bash
cd backend
npm install
npx prisma db push
npm run db:seed
npm run dev
```
*The backend API server will start on **`http://localhost:5000`**.*

### Step 3: Setup & Start Frontend UI Portal
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The frontend application will start on **`http://localhost:3000`**.*

---

## 🐳 Docker Deployment Setup

You can launch the entire stack with Docker Compose:

```bash
docker-compose up --build
```
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

---

## 📬 Postman Collection & API Documentation

Import [`Mini_ERP_CRM.postman_collection.json`](./Mini_ERP_CRM.postman_collection.json) into Postman to test REST endpoints:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/customers`
- `POST /api/customers`
- `POST /api/customers/:id/follow-ups`
- `GET /api/products`
- `POST /api/products/:id/adjust-stock`
- `GET /api/challans`
- `POST /api/challans`
- `GET /api/challans/:id/pdf`
- `GET /api/dashboard/stats`
