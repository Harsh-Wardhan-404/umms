import express, { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 1. Create new client
router.post("/", authenticateToken, requireRole(["Admin", "Sales"]), async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      gstNumber,
      panNumber,
      contactPerson,
      creditLimit,
      paymentTerms,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: "Client name is required",
      });
    }

    // Check if client with same name or email already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [
          { name },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingClient) {
      return res.status(400).json({
        error: "Client with this name or email already exists",
      });
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        gstNumber,
        panNumber,
        contactPerson,
        creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
        paymentTerms,
        isActive: true,
      },
    });

    res.status(201).json({
      message: "Client created successfully",
      client,
    });
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// 2. Get all clients with filtering
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      isActive, 
      page = 1, 
      limit = 10 
    } = req.query;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { contactPerson: { contains: search as string, mode: "insensitive" } },
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: Number(limit),
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// 3. Get client by ID
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        feedback: {
          orderBy: { feedbackDate: "desc" },
          take: 5,
        },
        _count: {
          select: {
            invoices: true,
            feedback: true,
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ client });
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

// 4. Update client
router.patch("/:id", authenticateToken, requireRole(["Admin", "Sales"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      gstNumber,
      panNumber,
      contactPerson,
      creditLimit,
      paymentTerms,
      isActive,
    } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (panNumber !== undefined) updateData.panNumber = panNumber;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (creditLimit !== undefined) updateData.creditLimit = parseFloat(creditLimit);
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (isActive !== undefined) updateData.isActive = isActive;

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: "Client updated successfully",
      client,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// 5. Delete client (soft delete by setting isActive to false)
router.delete("/:id", authenticateToken, requireRole(["Admin"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if client has any invoices
    const clientWithInvoices = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!clientWithInvoices) {
      return res.status(404).json({ error: "Client not found" });
    }

    if (clientWithInvoices._count.invoices > 0) {
      return res.status(400).json({
        error: "Cannot delete client with existing invoices. Use deactivate instead.",
      });
    }

    // Soft delete by setting isActive to false
    const client = await prisma.client.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      message: "Client deactivated successfully",
      client,
    });
  } catch (error) {
    console.error("Error deactivating client:", error);
    res.status(500).json({ error: "Failed to deactivate client" });
  }
});

// 6. Get client statistics
router.get("/stats/overview", authenticateToken, async (req: Request, res: Response) => {
  try {
    const [totalClients, activeClients, clientsWithInvoices, topClients] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { isActive: true } }),
      prisma.client.count({
        where: {
          invoices: { some: {} },
        },
      }),
      prisma.client.findMany({
        include: {
          _count: {
            select: { invoices: true },
          },
        },
        orderBy: {
          invoices: {
            _count: "desc",
          },
        },
        take: 5,
      }),
    ]);

    const stats = {
      totalClients,
      activeClients,
      inactiveClients: totalClients - activeClients,
      clientsWithInvoices,
      topClients,
    };

    res.json({ stats });
  } catch (error) {
    console.error("Error fetching client stats:", error);
    res.status(500).json({ error: "Failed to fetch client statistics" });
  }
});

export default router;
