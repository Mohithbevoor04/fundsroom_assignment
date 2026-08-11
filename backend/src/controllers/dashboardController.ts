import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      leadCustomers,
      products,
      pendingChallans,
      confirmedChallansCount,
      revenueResult,
      upcomingFollowUps,
      recentChallans,
      recentStockLogs
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'Active' } }),
      prisma.customer.count({ where: { status: 'Lead' } }),
      prisma.product.findMany({ select: { currentStock: true, minStockAlert: true } }),
      prisma.salesChallan.count({ where: { status: 'Draft' } }),
      prisma.salesChallan.count({ where: { status: 'Confirmed' } }),
      prisma.salesChallan.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'Confirmed' }
      }),
      prisma.customer.findMany({
        where: {
          followUpDate: { not: null },
          status: { in: ['Lead', 'Active'] }
        },
        take: 5,
        orderBy: { followUpDate: 'asc' },
        select: {
          id: true,
          name: true,
          businessName: true,
          mobile: true,
          followUpDate: true,
          status: true
        }
      }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } }
        }
      }),
      prisma.stockLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          createdBy: { select: { name: true } }
        }
      })
    ]);

    const lowStockCount = products.filter(p => p.currentStock <= p.minStockAlert).length;
    const totalRevenue = revenueResult._sum.totalAmount || 0;

    return res.json({
      summary: {
        totalCustomers,
        activeCustomers,
        leadCustomers,
        lowStockCount,
        pendingChallans,
        confirmedChallansCount,
        totalRevenue
      },
      upcomingFollowUps,
      recentChallans,
      recentStockLogs
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching dashboard metrics' });
  }
};
