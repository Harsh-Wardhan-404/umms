import express, { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

const ADMIN_ROLES = ["Admin", "Inventory Manager"];

// List all company profiles (default first)
router.get("/", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const companies = await prisma.companyProfile.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    res.json({ companies });
  } catch (error) {
    console.error("Error fetching company profiles:", error);
    res.status(500).json({ error: "Failed to fetch company profiles" });
  }
});

// Create a company profile
router.post("/", authenticateToken, requireRole(ADMIN_ROLES), async (req: Request, res: Response) => {
  try {
    const {
      name,
      address,
      gstin,
      phone,
      bankName,
      bankBranch,
      bankAccountNo,
      bankIfscCode,
      bankUpiId,
      isDefault = false,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Company name is required" });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.companyProfile.updateMany({ data: { isDefault: false } });
      }

      return tx.companyProfile.create({
        data: {
          name,
          address,
          gstin,
          phone,
          bankName,
          bankBranch,
          bankAccountNo,
          bankIfscCode,
          bankUpiId,
          isDefault,
        },
      });
    });

    res.status(201).json({ message: "Company profile created", company: result });
  } catch (error: any) {
    console.error("Error creating company profile:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Company name must be unique" });
    }
    res.status(500).json({ error: "Failed to create company profile" });
  }
});

// Update a company profile
router.put("/:id", authenticateToken, requireRole(ADMIN_ROLES), async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    address,
    gstin,
    phone,
    bankName,
    bankBranch,
    bankAccountNo,
    bankIfscCode,
    bankUpiId,
    isDefault = false,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Company name is required" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.companyProfile.updateMany({ data: { isDefault: false } });
      }

      return tx.companyProfile.update({
        where: { id },
        data: {
          name,
          address,
          gstin,
          phone,
          bankName,
          bankBranch,
          bankAccountNo,
          bankIfscCode,
          bankUpiId,
          isDefault,
        },
      });
    });

    res.json({ message: "Company profile updated", company: result });
  } catch (error: any) {
    console.error("Error updating company profile:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Company profile not found" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Company name must be unique" });
    }
    res.status(500).json({ error: "Failed to update company profile" });
  }
});

// Set default company profile
router.patch("/:id/default", authenticateToken, requireRole(ADMIN_ROLES), async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.companyProfile.updateMany({ data: { isDefault: false } });
      return tx.companyProfile.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    res.json({ message: "Default company updated", company: result });
  } catch (error: any) {
    console.error("Error setting default company profile:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Company profile not found" });
    }
    res.status(500).json({ error: "Failed to set default company profile" });
  }
});

// Delete a company profile
router.delete("/:id", authenticateToken, requireRole(ADMIN_ROLES), async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.companyProfile.delete({ where: { id } });
    res.json({ message: "Company profile deleted" });
  } catch (error: any) {
    console.error("Error deleting company profile:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Company profile not found" });
    }
    res.status(500).json({ error: "Failed to delete company profile" });
  }
});

export default router;

