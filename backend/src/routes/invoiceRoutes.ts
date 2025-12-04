import express, { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Generate unique invoice number
function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `INV-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
}

// Calculate GST based on HSN code and amount
function calculateGST(amount: number, hsnCode: string): {
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
} {
  // Default GST rate (can be enhanced with HSN code mapping)
  const gstRate = 18; // 18% GST
  
  if (hsnCode.startsWith("99")) {
    // Interstate supply - IGST
    const igst = (amount * gstRate) / 100;
    return {
      cgst: 0,
      sgst: 0,
      igst,
      totalTax: igst,
    };
  } else {
    // Intrastate supply - CGST + SGST
    const cgst = (amount * (gstRate / 2)) / 100;
    const sgst = (amount * (gstRate / 2)) / 100;
    return {
      cgst,
      sgst,
      igst: 0,
      totalTax: cgst + sgst,
    };
  }
}

// 1. Create new invoice
router.post("/", authenticateToken, requireRole(["Admin", "Sales"]), async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      invoiceDate,
      dueDate,
      items,
      notes,
    } = req.body;

    // Validate required fields
    if (!clientId || !invoiceDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: clientId, invoiceDate, items (array)",
      });
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const processedItems = [];
    const invoiceItems = [];

    for (const item of items) {
      const {
        finishedGoodId,
        quantity,
        pricePerUnit,
        hsnCode,
      } = item;

      if (!finishedGoodId || !quantity || !pricePerUnit || !hsnCode) {
        return res.status(400).json({
          error: "Each item must have: finishedGoodId, quantity, pricePerUnit, hsnCode",
        });
      }

      // Validate finished goods
      const finishedGood = await prisma.finishedGood.findUnique({
        where: { id: finishedGoodId },
      });

      if (!finishedGood) {
        return res.status(404).json({ error: `Finished goods not found: ${finishedGoodId}` });
      }

      if (finishedGood.availableQuantity < quantity) {
        return res.status(400).json({
          error: `Insufficient quantity for ${finishedGood.productName}. Available: ${finishedGood.availableQuantity}, Requested: ${quantity}`,
        });
      }

      const itemTotal = quantity * pricePerUnit;
      subtotal += itemTotal;

      processedItems.push({
        finishedGoodId,
        quantity,
        pricePerUnit,
        hsnCode,
        itemTotal,
      });
    }

    // Calculate GST
    const gstCalculation = calculateGST(subtotal, items[0].hsnCode);
    const totalAmount = subtotal + gstCalculation.totalTax;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        clientId,
        creatorId: req.user!.userId,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        items: processedItems,
        subtotal,
        taxDetails: {
          cgst: gstCalculation.cgst,
          sgst: gstCalculation.sgst,
          igst: gstCalculation.igst,
          totalTax: gstCalculation.totalTax,
          gstRate: gstCalculation.totalTax > 0 ? 18 : 0,
        },
        totalAmount,
        notes,
        paymentStatus: "Pending",
      },
      include: {
        client: true,
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // Create invoice items and update finished goods quantities
    for (const item of processedItems) {
      await Promise.all([
        prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            finishedGoodId: item.finishedGoodId,
            batchCode: (await prisma.finishedGood.findUnique({
              where: { id: item.finishedGoodId },
              include: { batch: true },
            }))?.batch.batchCode || "",
            quantity: item.quantity,
            hsnCode: item.hsnCode,
            pricePerUnit: item.pricePerUnit,
          },
        }),
        prisma.finishedGood.update({
          where: { id: item.finishedGoodId },
          data: {
            availableQuantity: {
              decrement: item.quantity,
            },
          },
        }),
      ]);
    }

    res.status(201).json({
      message: "Invoice created successfully",
      invoice: {
        ...invoice,
        items: processedItems,
      },
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// 2. Get all invoices with filtering
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { 
      clientId, 
      paymentStatus, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10 
    } = req.query;

    const where: any = {};
    
    if (clientId) where.clientId = clientId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate as string);
      if (endDate) where.invoiceDate.lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: { name: true, email: true, gstNumber: true },
          },
          creator: {
            select: { firstName: true, lastName: true },
          },
          invoiceItems: {
            include: {
              finishedGood: {
                select: { productName: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// 3. Get invoice by ID
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
        invoiceItems: {
          include: {
            finishedGood: {
              include: {
                batch: {
                  include: {
                    formulationVersion: {
                      include: { formulation: true },
                    },
                  },
                },
              },
            },
          },
        },
        dispatch: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// 4. Update invoice payment status
router.patch("/:id/payment-status", authenticateToken, requireRole(["Admin", "Sales"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus, notes } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ error: "Payment status is required" });
    }

    const validStatuses = ["Pending", "Partial", "Paid"];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: "Invalid payment status" });
    }

    const updateData: any = { paymentStatus };
    if (notes) updateData.notes = notes;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        creator: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    res.json({
      message: "Payment status updated successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

// 5. Generate invoice PDF (placeholder for now)
router.get("/:id/pdf", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        creator: {
          select: { firstName: true, lastName: true },
        },
        invoiceItems: {
          include: {
            finishedGood: {
              include: {
                batch: {
                  include: {
                    formulationVersion: {
                      include: { formulation: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // TODO: Implement actual PDF generation
    // For now, return the invoice data that would be used for PDF generation
    res.json({
      message: "PDF generation endpoint (implementation pending)",
      invoice,
      pdfData: {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client.name,
        clientAddress: invoice.client.address,
        clientGST: invoice.client.gstNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        items: invoice.invoiceItems,
        subtotal: invoice.subtotal,
        taxDetails: invoice.taxDetails,
        totalAmount: invoice.totalAmount,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// 6. Get invoice statistics
router.get("/stats/overview", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate as string);
      if (endDate) where.invoiceDate.lte = new Date(endDate as string);
    }

    const [
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      totalRevenue,
      averageInvoiceValue,
      paymentStatusDistribution,
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.count({ where: { ...where, paymentStatus: "Pending" } }),
      prisma.invoice.count({ where: { ...where, paymentStatus: "Paid" } }),
      prisma.invoice.aggregate({
        where: { ...where, paymentStatus: "Paid" },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where,
        _avg: { totalAmount: true },
      }),
      prisma.invoice.groupBy({
        by: ["paymentStatus"],
        where,
        _count: { paymentStatus: true },
      }),
    ]);

    const stats = {
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      averageInvoiceValue: averageInvoiceValue._avg.totalAmount || 0,
      paymentStatusDistribution,
    };

    res.json({ stats });
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    res.status(500).json({ error: "Failed to fetch invoice statistics" });
  }
});

// 7. Delete invoice
router.delete("/:id", authenticateToken, requireRole(["Admin", "Sales"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        dispatch: true,
        invoiceItems: {
          include: {
            finishedGood: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Check if invoice has dispatch
    if (invoice.dispatch) {
      return res.status(400).json({
        error: "Cannot delete invoice that has dispatch",
        details: "Please delete the associated dispatch first"
      });
    }

    // Restore finished goods quantities before deleting
    for (const item of invoice.invoiceItems) {
      await prisma.finishedGood.update({
        where: { id: item.finishedGoodId },
        data: {
          availableQuantity: {
            increment: item.quantity,
          },
        },
      });
    }

    // Delete the invoice (cascade will delete invoice items)
    await prisma.invoice.delete({
      where: { id },
    });

    res.json({
      message: "Invoice deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;
