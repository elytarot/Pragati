// src/middleware/auth.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ code: "NO_TOKEN", message: "Authentication required" });
  }
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ code: "TOKEN_EXPIRED", message: "Session expired. Please log in again." });
    res.status(401).json({ code: "INVALID_TOKEN", message: "Invalid token" });
  }
};

// Returns Prisma WHERE clause based on user role
const getScope = (user) => {
  // Temporarily allowing all roles to see all data as requested, 
  // so that Field Workers and Block Coordinators do not see 0 data.
  return {};
};

// Middleware: require minimum role
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      code: "FORBIDDEN",
      message: `This action requires one of: ${roles.join(", ")}`,
    });
  }
  next();
};

// Check if user can modify a record (not viewer)
const requireWrite = (req, res, next) => {
  if (req.user.role === "VIEWER") {
    return res.status(403).json({ code: "READONLY", message: "Viewer accounts cannot modify data" });
  }
  next();
};

module.exports = { verifyToken, getScope, requireRole, requireWrite };
