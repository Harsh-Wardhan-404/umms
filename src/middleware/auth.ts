import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

// Type for authenticated requests
export interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

// Type guard to check if user exists
function hasUser(req: Request): req is AuthRequest {
  return req.user !== undefined;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
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

// Optional middleware for routes that can work with or without authentication
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback-secret-key";
      const decoded = jwt.verify(token, secret) as {
        userId: string;
        email: string;
        role: string;
      };
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we continue without user info
      // This allows the route to work for both authenticated and unauthenticated users
    }
  }
  
  next();
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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

// Specific role middleware functions
export const requireAdmin = requireRole(["Admin"]);
export const requireManager = requireRole(["Admin", "Manager"]);
export const requireWorker = requireRole(["Admin", "Manager", "Worker"]);

// Helper function to create authenticated route handlers
export function createAuthHandler<T extends Request = Request>(
  handler: (req: T, res: Response) => Promise<any>
) {
  return (req: Request, res: Response) => {
    if (!hasUser(req)) {
      return res.status(401).json({
        error: "Authentication required",
        message: "User authentication required for this endpoint"
      });
    }
    return handler(req as T, res);
  };
}
