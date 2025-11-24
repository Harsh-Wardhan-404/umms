import { Router } from "express";
import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: "Email, password, firstName, and lastName are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Invalid email format" 
      });
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: "User with this email already exists" 
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
        role: role || "Staff", // Default role if not specified
        username: email.split('@')[0], // Generate username from email
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        username: true,
        createdAt: true,
        // Don't return passwordHash
      }
    });

    res.status(201).json({
      message: "User created successfully",
      user
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Failed to create user",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email & password required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallback-secret-key",
      { expiresIn: "1h" }
    );

    res.json({ 
      message: "Login successful", 
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        username: user.username
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Failed to login",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;