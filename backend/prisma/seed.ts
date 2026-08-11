import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.challanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 2. Create Users for all 4 required roles
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin (Rajesh Sharma)',
      email: 'admin@erp.com',
      password: hashedPassword,
      role: 'Admin'
    }
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sales Manager (Priya Verma)',
      email: 'sales@erp.com',
      password: hashedPassword,
      role: 'Sales'
    }
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Warehouse Manager (Ramesh Kumar)',
      email: 'warehouse@erp.com',
      password: hashedPassword,
      role: 'Warehouse'
    }
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Accounts Head (Suresh Patel)',
      email: 'accounts@erp.com',
      password: hashedPassword,
      role: 'Accounts'
    }
  });

  console.log('👥 Created 4 System Users with Roles (Admin, Sales, Warehouse, Accounts)');

  // 3. Create Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Anil Gupta',
      businessName: 'Gupta Traders & Wholesale',
      email: 'anil@guptatraders.com',
      mobile: '+91 98765 43210',
      gstNumber: '29ABCDE1234F1Z5',
      customerType: 'Wholesale',
      address: 'Plot 45, Industrial Suburb, Yeshwanthpur, Bengaluru, KA - 560022',
      status: 'Active',
      followUpDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      notes: 'Key distributor for South Bengaluru region. Prefers bulk hardware shipments.',
      createdById: salesUser.id
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Vikram Mehta',
      businessName: 'Apex Retail Stores Ltd',
      email: 'vikram@apexretail.in',
      mobile: '+91 98123 45678',
      gstNumber: '29AAACA9988K1Z9',
      customerType: 'Distributor',
      address: 'Suite 201, Commercial Complex, MG Road, Bengaluru, KA - 560001',
      status: 'Active',
      followUpDate: new Date(Date.now() + 86400000 * 5),
      notes: 'Monthly credit limit approved up to 5 Lakhs. High volume repeat customer.',
      createdById: salesUser.id
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Sunita Reddy',
      businessName: 'Reddy Construction Supplies',
      email: 'sunita@reddyconstructions.com',
      mobile: '+91 99001 12233',
      gstNumber: '29AAACR7766M1Z2',
      customerType: 'Wholesale',
      address: 'Site 88, Outer Ring Road, Marathahalli, Bengaluru, KA - 560037',
      status: 'Lead',
      followUpDate: new Date(Date.now() + 86400000 * 1), // Tomorrow
      notes: 'Expressed interest in bulk electric tools. Quotation sent.',
      createdById: salesUser.id
    }
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Karan Malhotra',
      businessName: 'Malhotra Hardware Mart',
      email: 'karan@malhotrahardware.com',
      mobile: '+91 97788 99001',
      gstNumber: '29AAACM1122P1Z0',
      customerType: 'Retail',
      address: 'Shop 12, Main Market, Jayanagar 4th Block, Bengaluru, KA - 560041',
      status: 'Active',
      notes: 'Standard 15-day payment terms.',
      createdById: salesUser.id
    }
  });

  console.log('🏢 Created 4 Customers');

  // Add initial follow-up notes
  await prisma.customerFollowUp.create({
    data: {
      customerId: customer3.id,
      note: 'Initial phone call completed. Sunita requested sample pricing for 500 units of heavy duty drill machines.',
      createdById: salesUser.id
    }
  });

  await prisma.customerFollowUp.create({
    data: {
      customerId: customer1.id,
      note: 'Payment received for previous invoice. Order confirmation expected by end of week.',
      createdById: accountsUser.id
    }
  });

  // 4. Create Sample Products
  const p1 = await prisma.product.create({
    data: {
      name: 'Industrial Heavy Duty Power Drill 800W',
      sku: 'PWR-DRL-800',
      category: 'Power Tools',
      unitPrice: 3450.00,
      currentStock: 45,
      minStockAlert: 15,
      location: 'Warehouse A - Bay 3'
    }
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Stainless Steel Fastener Bolts (Pack of 100)',
      sku: 'FST-SS-100P',
      category: 'Hardware',
      unitPrice: 480.00,
      currentStock: 120,
      minStockAlert: 25,
      location: 'Warehouse B - Rack 12'
    }
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Digital Multimeter Pro Precision 6000',
      sku: 'ELE-DMM-600',
      category: 'Electronics',
      unitPrice: 1850.00,
      currentStock: 8, // Below min stock alert!
      minStockAlert: 10,
      location: 'Warehouse A - Bay 1'
    }
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'Safety Helmet High Visibility Orange',
      sku: 'SAF-HLM-ORG',
      category: 'Safety Gear',
      unitPrice: 320.00,
      currentStock: 250,
      minStockAlert: 50,
      location: 'Warehouse C - Shelf 4'
    }
  });

  const p5 = await prisma.product.create({
    data: {
      name: 'Cordless Angle Grinder 20V Heavy Duty',
      sku: 'PWR-GRN-020',
      category: 'Power Tools',
      unitPrice: 5200.00,
      currentStock: 4, // Below min stock alert!
      minStockAlert: 8,
      location: 'Warehouse A - Bay 3'
    }
  });

  console.log('📦 Created 5 Products with initial stock');

  // 5. Stock Logs
  await prisma.stockLog.createMany({
    data: [
      {
        productId: p1.id,
        quantity: 50,
        type: 'IN',
        reason: 'Initial Restock from Vendor Supplier',
        createdById: warehouseUser.id
      },
      {
        productId: p2.id,
        quantity: 150,
        type: 'IN',
        reason: 'Bulk Freight Shipment Intake',
        createdById: warehouseUser.id
      },
      {
        productId: p3.id,
        quantity: 20,
        type: 'IN',
        reason: 'Purchase Order #PO-9082 Fulfillment',
        createdById: warehouseUser.id
      },
      {
        productId: p3.id,
        quantity: 12,
        type: 'OUT',
        reason: 'Damage/Defect Return to Manufacturer',
        createdById: warehouseUser.id
      }
    ]
  });

  // 6. Create Initial Sales Challans
  // Challan 1: Confirmed
  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CHLN-2026-0001',
      customerId: customer1.id,
      totalQuantity: 5,
      totalAmount: 17250.00,
      status: 'Confirmed',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            productSku: p1.sku,
            unitPrice: p1.unitPrice,
            quantity: 5,
            subtotal: 17250.00
          }
        ]
      }
    }
  });

  // Log stock reduction for Confirmed Challan 1
  await prisma.stockLog.create({
    data: {
      productId: p1.id,
      quantity: 5,
      type: 'OUT',
      reason: `Sales Challan Confirmation (${challan1.challanNumber})`,
      createdById: salesUser.id
    }
  });

  // Challan 2: Draft
  await prisma.salesChallan.create({
    data: {
      challanNumber: 'CHLN-2026-0002',
      customerId: customer2.id,
      totalQuantity: 30,
      totalAmount: 24000.00,
      status: 'Draft',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: p2.id,
            productName: p2.name,
            productSku: p2.sku,
            unitPrice: p2.unitPrice,
            quantity: 30,
            subtotal: 14400.00
          },
          {
            productId: p4.id,
            productName: p4.name,
            productSku: p4.sku,
            unitPrice: p4.unitPrice,
            quantity: 30,
            subtotal: 9600.00
          }
        ]
      }
    }
  });

  console.log('📄 Created Sample Sales Challans & Stock logs');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
