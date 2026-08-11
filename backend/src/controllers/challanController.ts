import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { generateChallanPDF } from '../utils/pdfGenerator';

// Helper function to generate unique sequential challan number e.g. CHLN-2026-0001
const generateChallanNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.salesChallan.count();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `CHLN-${year}-${nextNum}`;
};

export const getChallans = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, customerId, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { challanNumber: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { businessName: { contains: q } } }
      ];
    }

    if (status) {
      where.status = status as string;
    }

    if (customerId) {
      where.customerId = customerId as string;
    }

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where }),
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, mobile: true, email: true }
          },
          createdBy: {
            select: { id: true, name: true, role: true }
          },
          items: true
        }
      })
    ]);

    return res.json({
      data: challans,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching sales challans' });
  }
};

export const getChallanById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, currentStock: true }
            }
          }
        }
      }
    });

    if (!challan) {
      return res.status(404).json({ message: 'Sales challan not found' });
    }

    return res.json(challan);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching sales challan' });
  }
};

export const createChallan = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, items, status = 'Draft' } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: 'Customer selection is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one product item is required for the challan' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ message: 'Selected customer does not exist' });
    }

    // Fetch product details for snapshot and stock checks
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate items and check stock if confirming directly
    let totalQuantity = 0;
    let totalAmount = 0;
    const preparedItems: any[] = [];
    const isConfirming = status === 'Confirmed';

    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) {
        return res.status(400).json({ message: `Product with ID '${item.productId}' not found` });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: `Invalid quantity for product '${p.name}'` });
      }

      // Check stock sufficiency if confirming
      if (isConfirming && p.currentStock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for '${p.name}' (SKU: ${p.sku}). Available stock: ${p.currentStock}, Requested: ${qty}`
        });
      }

      const unitPrice = item.unitPrice !== undefined ? parseFloat(item.unitPrice) : p.unitPrice;
      const subtotal = unitPrice * qty;

      totalQuantity += qty;
      totalAmount += subtotal;

      preparedItems.push({
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        unitPrice,
        quantity: qty,
        subtotal
      });
    }

    const challanNumber = await generateChallanNumber();

    // Execute atomic transaction for creation and stock deduction
    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          totalAmount,
          status: isConfirming ? 'Confirmed' : 'Draft',
          createdById: req.user!.id,
          items: {
            create: preparedItems
          }
        },
        include: {
          customer: true,
          items: true,
          createdBy: { select: { id: true, name: true, role: true } }
        }
      });

      // If status is Confirmed, deduct stock and create stock logs
      if (isConfirming) {
        for (const item of preparedItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: { decrement: item.quantity }
            }
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: 'OUT',
              reason: `Sales Challan Confirmation (${challanNumber})`,
              createdById: req.user!.id
            }
          });
        }
      }

      return challan;
    });

    return res.status(201).json({
      message: `Sales Challan created successfully as ${result.status}`,
      challan: result
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error creating sales challan' });
  }
};

export const updateChallanStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Draft', 'Confirmed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Allowed: 'Draft', 'Confirmed', 'Cancelled'" });
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!challan) {
      return res.status(404).json({ message: 'Sales challan not found' });
    }

    if (challan.status === status) {
      return res.status(400).json({ message: `Challan is already in '${status}' status` });
    }

    if (challan.status === 'Confirmed' && status === 'Draft') {
      return res.status(400).json({ message: 'Confirmed challans cannot be reverted to Draft' });
    }

    // Transition: Draft -> Confirmed (Requires stock check and stock reduction)
    if (challan.status === 'Draft' && status === 'Confirmed') {
      const productIds = challan.items.map(i => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      // Verify stock for all items
      for (const item of challan.items) {
        const p = productMap.get(item.productId);
        if (!p) {
          return res.status(400).json({ message: `Product '${item.productName}' no longer exists` });
        }
        if (p.currentStock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock to confirm challan for '${p.name}'. Available: ${p.currentStock}, Required: ${item.quantity}`
          });
        }
      }

      // Execute transaction
      const updated = await prisma.$transaction(async (tx) => {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } }
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: 'OUT',
              reason: `Sales Challan Confirmation (${challan.challanNumber})`,
              createdById: req.user!.id
            }
          });
        }

        return tx.salesChallan.update({
          where: { id },
          data: { status: 'Confirmed' },
          include: { customer: true, items: true }
        });
      });

      return res.json({
        message: 'Sales Challan confirmed and inventory updated successfully',
        challan: updated
      });
    }

    // Transition: Confirmed -> Cancelled (Restore stock)
    if (challan.status === 'Confirmed' && status === 'Cancelled') {
      const updated = await prisma.$transaction(async (tx) => {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } }
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: 'IN',
              reason: `Sales Challan Cancellation Reversal (${challan.challanNumber})`,
              createdById: req.user!.id
            }
          });
        }

        return tx.salesChallan.update({
          where: { id },
          data: { status: 'Cancelled' },
          include: { customer: true, items: true }
        });
      });

      return res.json({
        message: 'Sales Challan cancelled and stock restored to inventory',
        challan: updated
      });
    }

    // Transition: Draft -> Cancelled
    const updated = await prisma.salesChallan.update({
      where: { id },
      data: { status: 'Cancelled' },
      include: { customer: true, items: true }
    });

    return res.json({
      message: 'Sales Challan draft cancelled',
      challan: updated
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error updating sales challan status' });
  }
};

export const downloadChallanPDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { name: true, role: true } },
        items: true
      }
    });

    if (!challan) {
      return res.status(404).json({ message: 'Sales challan not found' });
    }

    generateChallanPDF(challan, res);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error generating PDF' });
  }
};
