import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, type, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { name: { contains: q } },
        { businessName: { contains: q } },
        { email: { contains: q } },
        { mobile: { contains: q } }
      ];
    }

    if (status) {
      where.status = status as string;
    }

    if (type) {
      where.customerType = type as string;
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true }
          },
          _count: {
            select: { followUps: true, challans: true }
          }
        }
      })
    ]);

    return res.json({
      data: customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching customers' });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            challanNumber: true,
            totalQuantity: true,
            totalAmount: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.json(customer);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching customer details' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

    if (!name || !mobile || !email || !businessName || !address) {
      return res.status(400).json({ message: 'Name, mobile, email, business name, and address are required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber: gstNumber || null,
        customerType: customerType || 'Retail',
        address,
        status: status || 'Lead',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
        createdById: req.user!.id
      }
    });

    return res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error creating customer' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        mobile: mobile !== undefined ? mobile : existing.mobile,
        email: email !== undefined ? email : existing.email,
        businessName: businessName !== undefined ? businessName : existing.businessName,
        gstNumber: gstNumber !== undefined ? gstNumber : existing.gstNumber,
        customerType: customerType !== undefined ? customerType : existing.customerType,
        address: address !== undefined ? address : existing.address,
        status: status !== undefined ? status : existing.status,
        followUpDate: followUpDate ? new Date(followUpDate) : followUpDate === null ? null : existing.followUpDate,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    return res.json({
      message: 'Customer updated successfully',
      customer: updated
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error updating customer' });
  }
};

export const addFollowUpNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note, nextFollowUpDate } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ message: 'Follow-up note content is required' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const [followUp] = await prisma.$transaction([
      prisma.customerFollowUp.create({
        data: {
          customerId: id,
          note: note.trim(),
          createdById: req.user!.id
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        }
      }),
      prisma.customer.update({
        where: { id },
        data: {
          followUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : customer.followUpDate,
          updatedAt: new Date()
        }
      })
    ]);

    return res.status(201).json({
      message: 'Follow-up note added successfully',
      followUp
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error adding follow-up note' });
  }
};
