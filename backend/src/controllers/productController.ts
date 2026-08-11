import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, lowStock, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { category: { contains: q } },
        { location: { contains: q } }
      ];
    }

    if (category) {
      where.category = category as string;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' }
      })
    ]);

    let filteredProducts = products;
    if (lowStock === 'true') {
      filteredProducts = products.filter(p => p.currentStock <= p.minStockAlert);
    }

    return res.json({
      data: filteredProducts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching products' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching product' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;

    if (!name || !sku || !category || unitPrice === undefined || !location) {
      return res.status(400).json({ message: 'Name, SKU, category, unit price, and location are required' });
    }

    const existingSku = await prisma.product.findUnique({ where: { sku: sku.trim().toUpperCase() } });
    if (existingSku) {
      return res.status(400).json({ message: `Product with SKU '${sku}' already exists` });
    }

    const initialStock = parseInt(currentStock, 10) || 0;

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          category: category.trim(),
          unitPrice: parseFloat(unitPrice),
          currentStock: initialStock,
          minStockAlert: parseInt(minStockAlert, 10) || 10,
          location: location.trim()
        }
      });

      if (initialStock > 0) {
        await tx.stockLog.create({
          data: {
            productId: p.id,
            quantity: initialStock,
            type: 'IN',
            reason: 'Initial stock intake upon product creation',
            createdById: req.user!.id
          }
        });
      }

      return p;
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error creating product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, category, unitPrice, minStockAlert, location } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (sku && sku.trim().toUpperCase() !== existing.sku) {
      const duplicate = await prisma.product.findUnique({ where: { sku: sku.trim().toUpperCase() } });
      if (duplicate) {
        return res.status(400).json({ message: `Product SKU '${sku}' is already in use by another product` });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        sku: sku !== undefined ? sku.trim().toUpperCase() : existing.sku,
        category: category !== undefined ? category.trim() : existing.category,
        unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : existing.unitPrice,
        minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert, 10) : existing.minStockAlert,
        location: location !== undefined ? location.trim() : existing.location
      }
    });

    return res.json({
      message: 'Product updated successfully',
      product: updated
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error updating product' });
  }
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, type, reason } = req.body;

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive integer' });
    }

    if (!type || !['IN', 'OUT'].includes(type)) {
      return res.status(400).json({ message: "Movement type must be 'IN' or 'OUT'" });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason for stock movement is required' });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (type === 'OUT' && product.currentStock < qtyNum) {
      return res.status(400).json({
        message: `Insufficient stock for '${product.name}'. Current stock: ${product.currentStock}, Requested deduction: ${qtyNum}`
      });
    }

    const newStock = type === 'IN' ? product.currentStock + qtyNum : product.currentStock - qtyNum;

    const [updatedProduct, log] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { currentStock: newStock }
      }),
      prisma.stockLog.create({
        data: {
          productId: id,
          quantity: qtyNum,
          type: type as 'IN' | 'OUT',
          reason: reason.trim(),
          createdById: req.user!.id
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        }
      })
    ]);

    return res.json({
      message: `Stock successfully adjusted (${type} ${qtyNum} units)`,
      product: updatedProduct,
      log
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error adjusting stock' });
  }
};

export const getStockLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, type, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (productId) where.productId = productId as string;
    if (type) where.type = type as 'IN' | 'OUT';

    const [total, logs] = await Promise.all([
      prisma.stockLog.count({ where }),
      prisma.stockLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, location: true }
          },
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        }
      })
    ]);

    return res.json({
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching stock movement logs' });
  }
};
