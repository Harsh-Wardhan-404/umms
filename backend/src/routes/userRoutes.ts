import { Router } from "express";
import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get("/", authenticateToken, requireRole(["Admin"]), async (req, res) => {
  try {
    const { search, role, page = "1", limit = "50" } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { username: { contains: search as string, mode: "insensitive" } },
      ];
    }
    
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      error: "Failed to fetch users",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get single user by ID (Admin only)
router.get("/:id", authenticateToken, requireRole(["Admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: "Failed to fetch user",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Create new user (Admin only) - This is different from signup
router.post("/", authenticateToken, requireRole(["Admin"]), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, username } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: "Email, password, firstName, and lastName are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email already exists",
      });
    }

    // Generate username if not provided
    const finalUsername = username || email.split("@")[0];

    // Check if username is taken
    const existingUsername = await prisma.user.findUnique({
      where: { username: finalUsername },
    });

    if (existingUsername) {
      return res.status(400).json({
        error: "Username already taken",
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || "Staff",
        username: finalUsername,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        username: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      error: "Failed to create user",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update user (Admin only)
router.put("/:id", authenticateToken, requireRole(["Admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, username, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prepare update data
    const updateData: any = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;

    // Check email uniqueness if changing
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
      updateData.email = email;
    }

    // Check username uniqueness if changing
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username },
      });
      if (usernameExists) {
        return res.status(400).json({ error: "Username already in use" });
      }
      updateData.username = username;
    }

    // Hash new password if provided
    if (password && password.length >= 6) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        username: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      error: "Failed to update user",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Delete user (Admin only)
router.delete("/:id", authenticateToken, requireRole(["Admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deleting yourself
    if (req.user?.userId === id) {
      return res.status(400).json({
        error: "Cannot delete your own account",
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      error: "Failed to delete user",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

