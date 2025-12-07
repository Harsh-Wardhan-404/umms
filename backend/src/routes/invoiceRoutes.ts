import express, { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Generate unique invoice number in format: SN202501001, PN202501001, or PNA202501001
async function generateInvoiceNumber(companyName: string | null, invoiceDate: Date): Promise<string> {
  // Determine prefix based on company name
  let prefix = "SN"; // Default to Sahyadri Nutraceuticals
  if (companyName) {
    const nameLower = companyName.toLowerCase();
    if (nameLower.includes("ayurved")) {
      prefix = "PNA"; // Piyush Nutripharma(Ayurved)
    } else if (nameLower.includes("piyush")) {
      prefix = "PN"; // Piyush Nutripharma
    }
  }

  // Get year and month from invoice date
  const year = invoiceDate.getFullYear();
  const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");

  // Find the last invoice number for this company/year/month combination
  const pattern = `${prefix}${year}${month}`;
  
  // Get all invoices that match the pattern
  const matchingInvoices = await prisma.invoice.findMany({
    where: {
      invoiceNumber: {
        startsWith: pattern,
      },
    },
    select: {
      invoiceNumber: true,
    },
    orderBy: {
      invoiceNumber: "desc",
    },
  });

  // Extract the highest invoice number
  let nextNumber = 1;
  if (matchingInvoices.length > 0) {
    // Extract the number part from the last invoice (e.g., "SN202501005" -> 5, "PNA202501005" -> 5)
    const lastInvoiceNumber = matchingInvoices[0].invoiceNumber;
    // Pattern is: prefix(2-3) + year(4) + month(2) + number(3)
    // Extract the last 3 characters as the number
    const numberPart = lastInvoiceNumber.substring(prefix.length + 6); // Skip prefix + year(4) + month(2)
    const lastNumber = parseInt(numberPart, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Format: SN202501001, PN202501001, or PNA202501001
  return `${prefix}${year}${month}${String(nextNumber).padStart(3, "0")}`;
}

// Check if transaction is intrastate (same state) based on GST numbers
function isIntrastate(clientGST: string, companyGST: string = '27'): boolean {
  if (!clientGST || clientGST.length < 2) return false;
  const clientStateCode = clientGST.substring(0, 2);
  const companyStateCode = companyGST.substring(0, 2);
  return clientStateCode === companyStateCode;
}

// Calculate GST for a single item based on GST rate and transaction type
function calculateItemGST(amount: number, gstRate: number, isIntrastateTransaction: boolean): {
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
} {
  if (gstRate === 0) {
    return { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
  }

  if (isIntrastateTransaction) {
    // Intrastate: Split GST into CGST and SGST
    const cgst = (amount * gstRate) / 200; // Half of GST rate
    const sgst = (amount * gstRate) / 200; // Half of GST rate
    return {
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: 0,
      totalTax: Math.round((cgst + sgst) * 100) / 100,
    };
  } else {
    // Interstate: Only IGST
    const igst = (amount * gstRate) / 100;
    return {
      cgst: 0,
      sgst: 0,
      igst: Math.round(igst * 100) / 100,
      totalTax: Math.round(igst * 100) / 100,
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
      companyName,
      companyAddress,
      companyGstin,
      companyPhone,
      bankName,
      bankBranch,
      bankAccountNo,
      bankIfscCode,
      bankUpiId,
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

    // Check if transaction is intrastate
    const isIntrastateTransaction = isIntrastate(client.gstNumber || '', '27');

    // Validate items and calculate totals with per-item GST
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    const processedItems = [];
    const invoiceItems = [];

    for (const item of items) {
      const {
        finishedGoodId,
        quantity,
        pricePerUnit,
        hsnCode,
        gstRate = 18, // Default to 18% if not provided
      } = item;

      if (!finishedGoodId || !quantity || !pricePerUnit || !hsnCode) {
        return res.status(400).json({
          error: "Each item must have: finishedGoodId, quantity, pricePerUnit, hsnCode",
        });
      }

      // Validate GST rate (must be one of the Indian GST slabs)
      const validGSTRates = [0, 5, 12, 18, 28];
      if (!validGSTRates.includes(gstRate)) {
        return res.status(400).json({
          error: `Invalid GST rate: ${gstRate}. Must be one of: ${validGSTRates.join(', ')}`,
        });
      }

      // Validate finished goods
      const finishedGood = await prisma.finishedGood.findUnique({
        where: { id: finishedGoodId },
        include: { batch: true },
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

      // Calculate GST for this item
      const itemGST = calculateItemGST(itemTotal, gstRate, isIntrastateTransaction);
      totalCGST += itemGST.cgst;
      totalSGST += itemGST.sgst;
      totalIGST += itemGST.igst;

      processedItems.push({
        finishedGoodId,
        quantity,
        pricePerUnit,
        hsnCode,
        gstRate,
        itemTotal,
        batchCode: finishedGood.batch.batchCode || "",
      });
    }

    // Calculate total tax and amount
    const totalTax = totalCGST + totalSGST + totalIGST;
    const totalAmount = subtotal + totalTax;

    // Determine the primary GST rate for display (use the highest rate if multiple)
    const gstRates = processedItems.map(item => item.gstRate).filter((rate, index, self) => self.indexOf(rate) === index);
    const primaryGSTRate = Math.max(...gstRates);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(companyName || null, new Date(invoiceDate));

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        creatorId: req.user!.userId,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        items: processedItems,
        subtotal,
        taxDetails: {
          cgst: Math.round(totalCGST * 100) / 100,
          sgst: Math.round(totalSGST * 100) / 100,
          igst: Math.round(totalIGST * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          gstRate: primaryGSTRate,
        },
        totalAmount,
        notes,
        companyName: companyName || null,
        companyAddress: companyAddress || null,
        companyGstin: companyGstin || null,
        companyPhone: companyPhone || null,
        bankName: bankName || null,
        bankBranch: bankBranch || null,
        bankAccountNo: bankAccountNo || null,
        bankIfscCode: bankIfscCode || null,
        bankUpiId: bankUpiId || null,
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
            batchCode: item.batchCode,
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
          // Note: No orderBy needed - frontend matches by finishedGoodId, not by index
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

// 4. Update invoice
router.put("/:id", authenticateToken, requireRole(["Admin", "Sales"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      clientId,
      invoiceDate,
      dueDate,
      items,
      notes,
      companyName,
      companyAddress,
      companyGstin,
      companyPhone,
      bankName,
      bankBranch,
      bankAccountNo,
      bankIfscCode,
      bankUpiId,
    } = req.body;

    // Validate required fields
    if (!clientId || !invoiceDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: clientId, invoiceDate, items (array)",
      });
    }

    // Check if invoice exists and get current items
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceItems: true,
        dispatch: true,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Prevent editing if invoice has dispatch
    if (existingInvoice.dispatch) {
      return res.status(400).json({
        error: "Cannot edit invoice that has an associated dispatch",
        details: "Please delete the dispatch first",
      });
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Check if transaction is intrastate
    const isIntrastateTransaction = isIntrastate(client.gstNumber || '', '27');

    // Restore finished goods quantities from old invoice items
    for (const oldItem of existingInvoice.invoiceItems) {
      await prisma.finishedGood.update({
        where: { id: oldItem.finishedGoodId },
        data: {
          availableQuantity: {
            increment: oldItem.quantity,
          },
        },
      });
    }

    // Validate new items and calculate totals with per-item GST
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    const processedItems = [];

    for (const item of items) {
      const {
        finishedGoodId,
        quantity,
        pricePerUnit,
        hsnCode,
        gstRate = 18, // Default to 18% if not provided
      } = item;

      if (!finishedGoodId || !quantity || !pricePerUnit || !hsnCode) {
        return res.status(400).json({
          error: "Each item must have: finishedGoodId, quantity, pricePerUnit, hsnCode",
        });
      }

      // Validate GST rate (must be one of the Indian GST slabs)
      const validGSTRates = [0, 5, 12, 18, 28];
      if (!validGSTRates.includes(gstRate)) {
        return res.status(400).json({
          error: `Invalid GST rate: ${gstRate}. Must be one of: ${validGSTRates.join(', ')}`,
        });
      }

      // Validate finished goods
      const finishedGood = await prisma.finishedGood.findUnique({
        where: { id: finishedGoodId },
        include: { batch: true },
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

      // Calculate GST for this item
      const itemGST = calculateItemGST(itemTotal, gstRate, isIntrastateTransaction);
      totalCGST += itemGST.cgst;
      totalSGST += itemGST.sgst;
      totalIGST += itemGST.igst;

      processedItems.push({
        finishedGoodId,
        quantity,
        pricePerUnit,
        hsnCode,
        gstRate,
        itemTotal,
        batchCode: finishedGood.batch.batchCode || "",
      });
    }

    // Calculate total tax and amount
    const totalTax = totalCGST + totalSGST + totalIGST;
    const totalAmount = subtotal + totalTax;

    // Determine the primary GST rate for display (use the highest rate if multiple)
    const gstRates = processedItems.map(item => item.gstRate).filter((rate, index, self) => self.indexOf(rate) === index);
    const primaryGSTRate = Math.max(...gstRates);

    // Delete old invoice items
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        clientId,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        items: processedItems,
        subtotal,
        taxDetails: {
          cgst: Math.round(totalCGST * 100) / 100,
          sgst: Math.round(totalSGST * 100) / 100,
          igst: Math.round(totalIGST * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          gstRate: primaryGSTRate,
        },
        totalAmount,
        notes: notes || null,
        companyName: companyName || null,
        companyAddress: companyAddress || null,
        companyGstin: companyGstin || null,
        companyPhone: companyPhone || null,
        bankName: bankName || null,
        bankBranch: bankBranch || null,
        bankAccountNo: bankAccountNo || null,
        bankIfscCode: bankIfscCode || null,
        bankUpiId: bankUpiId || null,
      },
      include: {
        client: true,
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
        invoiceItems: {
          include: {
            finishedGood: {
              include: {
                batch: true,
              },
            },
          },
        },
      },
    });

    // Create new invoice items and update finished goods quantities
    for (const item of processedItems) {
      await Promise.all([
        prisma.invoiceItem.create({
          data: {
            invoiceId: id,
            finishedGoodId: item.finishedGoodId,
            batchCode: item.batchCode,
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

    res.json({
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// 5. Update invoice payment status
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

// 6. Generate invoice PDF (placeholder for now)
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

// 7. Get invoice statistics
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

// 8. Delete invoice
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
