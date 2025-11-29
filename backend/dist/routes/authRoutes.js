"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../generated/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const prisma = new prisma_1.PrismaClient();
// Signup Route
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingUser = yield prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                error: "User with this email already exists"
            });
        }
        // Hash password
        const saltRounds = 10;
        const passwordHash = yield bcryptjs_1.default.hash(password, saltRounds);
        // Create user
        const user = yield prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                role: role || "Worker", // Default role if not specified
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
    }
    catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            error: "Failed to create user",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
}));
// Login Route
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email & password required" });
        }
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(400).json({ error: "Invalid credentials" });
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid)
            return res.status(400).json({ error: "Invalid credentials" });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || "fallback-secret-key", { expiresIn: "1h" });
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
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            error: "Failed to login",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
}));
exports.default = router;
