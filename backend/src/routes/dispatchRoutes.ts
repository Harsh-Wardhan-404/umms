import { Router } from "express";
import { prisma } from "../index";
import { authenticateToken, requireManager, requireAdmin } from "../middleware/auth";

const router = Router();

// Create dispatch
router.post("/", authenticateToken, requireManager, async (req, res) => {
  try {
    const { invoiceId, courierName, awbNumber, dispatchDate } = req.body;

    // Validate required fields
    if (!invoiceId || !courierName || !awbNumber || !dispatchDate) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "invoiceId, courierName, awbNumber, and dispatchDate are required"
      });
    }

    // Validate courier name length
    if (courierName.length < 2 || courierName.length > 50) {
      return res.status(400).json({
        error: "Invalid courier name",
        message: "Courier name must be between 2 and 50 characters"
      });
    }

    // Validate AWB number format (alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(awbNumber)) {
      return res.status(400).json({
        error: "Invalid AWB number",
        message: "AWB number must be alphanumeric"
      });
    }

    // Validate dispatch date is not in future
    const dispatchDateObj = new Date(dispatchDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dispatchDateObj > today) {
      return res.status(400).json({
        error: "Invalid dispatch date",
        message: "Dispatch date cannot be in the future"
      });
    }

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return res.status(404).json({
        error: "Invoice not found",
        message: "The specified invoice does not exist"
      });
    }

    // Check if dispatch already exists for this invoice
    const existingDispatch = await prisma.dispatch.findUnique({
      where: { invoiceId }
    });

    if (existingDispatch) {
      return res.status(400).json({
        error: "Dispatch already exists",
        message: "A dispatch has already been created for this invoice"
      });
    }

    // Check if AWB number is unique
    const existingAwb = await prisma.dispatch.findFirst({
      where: { awbNumber }
    });

    if (existingAwb) {
      return res.status(400).json({
        error: "Duplicate AWB number",
        message: "This AWB number is already in use"
      });
    }

    // Create dispatch
    const dispatch = await prisma.dispatch.create({
      data: {
        invoiceId,
        courierName,
        awbNumber,
        dispatchDate: new Date(dispatchDate),
        status: "Ready",
        creatorId: req.user!.userId
      },
      include: {
        invoice: {
          include: {
            client: true
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: "Dispatch created successfully",
      dispatch
    });
  } catch (error: any) {
    console.error("Error creating dispatch:", error);
    res.status(500).json({
      error: "Failed to create dispatch",
      message: error.message
    });
  }
});

// Get all dispatches with filters and pagination
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      status,
      courierName,
      startDate,
      endDate,
      search,
      page = "1",
      limit = "10"
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (courierName) {
      where.courierName = {
        contains: courierName as string,
        mode: "insensitive"
      };
    }

    if (startDate || endDate) {
      where.dispatchDate = {};
      if (startDate) {
        where.dispatchDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.dispatchDate.lte = new Date(endDate as string);
      }
    }

    // Search by invoice number or AWB number
    if (search) {
      where.OR = [
        {
          awbNumber: {
            contains: search as string,
            mode: "insensitive"
          }
        },
        {
          invoice: {
            invoiceNumber: {
              contains: search as string,
              mode: "insensitive"
            }
          }
        }
      ];
    }

    // Get total count
    const total = await prisma.dispatch.count({ where });

    // Get dispatches
    const dispatches = await prisma.dispatch.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        invoice: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        feedback: {
          select: {
            id: true,
            ratingQuality: true,
            ratingPackaging: true,
            ratingDelivery: true
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Calculate stats
    const stats = {
      total: await prisma.dispatch.count(),
      ready: await prisma.dispatch.count({ where: { status: "Ready" } }),
      inTransit: await prisma.dispatch.count({ where: { status: "InTransit" } }),
      delivered: await prisma.dispatch.count({ where: { status: "Delivered" } }),
      pendingFeedback: await prisma.dispatch.count({
        where: {
          status: "Delivered",
          feedback: null
        }
      })
    };

    res.json({
      dispatches,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      stats
    });
  } catch (error: any) {
    console.error("Error fetching dispatches:", error);
    res.status(500).json({
      error: "Failed to fetch dispatches",
      message: error.message
    });
  }
});

// Get single dispatch by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const dispatch = await prisma.dispatch.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            client: true,
            invoiceItems: {
              include: {
                finishedGood: {
                  select: {
                    productName: true,
                    batchId: true
                  }
                }
              }
            }
          }
        },
        feedback: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!dispatch) {
      return res.status(404).json({
        error: "Dispatch not found",
        message: "The specified dispatch does not exist"
      });
    }

    res.json({ dispatch });
  } catch (error: any) {
    console.error("Error fetching dispatch:", error);
    res.status(500).json({
      error: "Failed to fetch dispatch",
      message: error.message
    });
  }
});

// Update dispatch status
router.patch("/:id/status", authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["Ready", "InTransit", "Delivered"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        message: "Status must be one of: Ready, InTransit, Delivered"
      });
    }

    // Get current dispatch
    const currentDispatch = await prisma.dispatch.findUnique({
      where: { id }
    });

    if (!currentDispatch) {
      return res.status(404).json({
        error: "Dispatch not found",
        message: "The specified dispatch does not exist"
      });
    }

    // Validate status transition (only forward progression)
    const statusOrder = ["Ready", "InTransit", "Delivered"];
    const currentIndex = statusOrder.indexOf(currentDispatch.status);
    const newIndex = statusOrder.indexOf(status);

    if (newIndex < currentIndex) {
      return res.status(400).json({
        error: "Invalid status transition",
        message: "Status can only progress forward (Ready → InTransit → Delivered)"
      });
    }

    // Update dispatch status
    const dispatch = await prisma.dispatch.update({
      where: { id },
      data: { status },
      include: {
        invoice: {
          include: {
            client: true
          }
        },
        feedback: true
      }
    });

    res.json({
      message: "Dispatch status updated successfully",
      dispatch,
      promptFeedback: status === "Delivered" && !dispatch.feedback
    });
  } catch (error: any) {
    console.error("Error updating dispatch status:", error);
    res.status(500).json({
      error: "Failed to update dispatch status",
      message: error.message
    });
  }
});

// Update dispatch details (courier, AWB, date)
router.patch("/:id", authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { courierName, awbNumber, dispatchDate } = req.body;

    const updateData: any = {};

    if (courierName) {
      if (courierName.length < 2 || courierName.length > 50) {
        return res.status(400).json({
          error: "Invalid courier name",
          message: "Courier name must be between 2 and 50 characters"
        });
      }
      updateData.courierName = courierName;
    }

    if (awbNumber) {
      if (!/^[a-zA-Z0-9]+$/.test(awbNumber)) {
        return res.status(400).json({
          error: "Invalid AWB number",
          message: "AWB number must be alphanumeric"
        });
      }

      // Check AWB uniqueness (exclude current dispatch)
      const existingAwb = await prisma.dispatch.findFirst({
        where: {
          awbNumber,
          NOT: { id }
        }
      });

      if (existingAwb) {
        return res.status(400).json({
          error: "Duplicate AWB number",
          message: "This AWB number is already in use"
        });
      }

      updateData.awbNumber = awbNumber;
    }

    if (dispatchDate) {
      const dispatchDateObj = new Date(dispatchDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (dispatchDateObj > today) {
        return res.status(400).json({
          error: "Invalid dispatch date",
          message: "Dispatch date cannot be in the future"
        });
      }
      updateData.dispatchDate = new Date(dispatchDate);
    }

    const dispatch = await prisma.dispatch.update({
      where: { id },
      data: updateData,
      include: {
        invoice: {
          include: {
            client: true
          }
        }
      }
    });

    res.json({
      message: "Dispatch updated successfully",
      dispatch
    });
  } catch (error: any) {
    console.error("Error updating dispatch:", error);
    res.status(500).json({
      error: "Failed to update dispatch",
      message: error.message
    });
  }
});

// Delete dispatch
router.delete("/:id", authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;

    const dispatch = await prisma.dispatch.findUnique({
      where: { id }
    });

    if (!dispatch) {
      return res.status(404).json({
        error: "Dispatch not found",
        message: "The specified dispatch does not exist"
      });
    }

    // Delete dispatch (feedback will be cascade deleted)
    await prisma.dispatch.delete({
      where: { id }
    });

    res.json({
      message: "Dispatch deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting dispatch:", error);
    res.status(500).json({
      error: "Failed to delete dispatch",
      message: error.message
    });
  }
});

export default router;

