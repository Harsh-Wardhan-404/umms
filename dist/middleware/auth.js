"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWorker = exports.requireManager = exports.requireAdmin = exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
exports.createAuthHandler = createAuthHandler;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Type guard to check if user exists
function hasUser(req) {
    return req.user !== undefined;
}
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            error: "Access token required",
            message: "Please provide a valid authentication token"
        });
    }
    try {
        const secret = process.env.JWT_SECRET || "fallback-secret-key";
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(403).json({
                error: "Invalid token",
                message: "The provided token is invalid or expired"
            });
        }
        return res.status(500).json({
            error: "Token verification failed",
            message: "Failed to verify authentication token"
        });
    }
};
exports.authenticateToken = authenticateToken;
// Optional middleware for routes that can work with or without authentication
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
        try {
            const secret = process.env.JWT_SECRET || "fallback-secret-key";
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            req.user = decoded;
        }
        catch (error) {
            // Token is invalid, but we continue without user info
            // This allows the route to work for both authenticated and unauthenticated users
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
// Role-based access control middleware
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: "Authentication required",
                message: "This endpoint requires authentication"
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Insufficient permissions",
                message: `This endpoint requires one of these roles: ${allowedRoles.join(", ")}`
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Specific role middleware functions
exports.requireAdmin = (0, exports.requireRole)(["Admin"]);
exports.requireManager = (0, exports.requireRole)(["Admin", "Manager"]);
exports.requireWorker = (0, exports.requireRole)(["Admin", "Manager", "Worker"]);
// Helper function to create authenticated route handlers
function createAuthHandler(handler) {
    return (req, res) => {
        if (!hasUser(req)) {
            return res.status(401).json({
                error: "Authentication required",
                message: "User authentication required for this endpoint"
            });
        }
        return handler(req, res);
    };
}
