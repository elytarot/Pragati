// src/middleware/audit.js — Auto-logs every POST/PUT/PATCH/DELETE
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// Map route path to entity type
const getEntityType = (path) => {
  if (path.includes("/children"))     return "child";
  if (path.includes("/iep"))          return "iep";
  if (path.includes("/assessments"))  return "assessment";
  if (path.includes("/interventions"))return "intervention";
  if (path.includes("/devices"))      return "device";
  if (path.includes("/reports"))      return "report";
  if (path.includes("/admin/users"))  return "user";
  if (path.includes("/admin"))        return "admin";
  if (path.includes("/locations"))    return "location";
  return "unknown";
};

const getAction = (method) => {
  switch (method) {
    case "POST":   return "CREATE";
    case "PUT":
    case "PATCH":  return "UPDATE";
    case "DELETE": return "DELETE";
    default:       return "UPDATE";
  }
};

const auditLog = async (req, res, next) => {
  // Only log write operations
  if (!WRITE_METHODS.includes(req.method)) return next();
  if (!req.user) return next();

  const originalSend = res.json.bind(res);
  let responseBody = null;

  res.json = (body) => {
    responseBody = body;
    return originalSend(body);
  };

  res.on("finish", async () => {
    // Only log successful responses
    if (res.statusCode < 200 || res.statusCode >= 400) return;

    try {
      const entityId = responseBody?.id
        || req.params?.id
        || req.params?.goalId
        || null;

      await prisma.auditLog.create({
        data: {
          userId:     req.user.userId,
          action:     getAction(req.method),
          entityType: getEntityType(req.path),
          entityId:   entityId || null,
          newValue:   req.body && Object.keys(req.body).length > 0
                        ? sanitiseForLog(req.body) : null,
          ipAddress:  req.ip || req.connection?.remoteAddress,
          userAgent:  req.headers["user-agent"]?.substring(0, 200),
        },
      });
    } catch (err) {
      // Audit failures must never crash the main request
      console.error("[AUDIT] Failed to log:", err.message);
    }
  });

  next();
};

// Remove sensitive fields before logging
const sanitiseForLog = (body) => {
  const sanitised = { ...body };
  delete sanitised.password;
  delete sanitised.passwordHash;
  delete sanitised.aadharNo;
  // Truncate large text fields
  for (const key of Object.keys(sanitised)) {
    if (typeof sanitised[key] === "string" && sanitised[key].length > 500) {
      sanitised[key] = sanitised[key].substring(0, 500) + "...[truncated]";
    }
  }
  return sanitised;
};

module.exports = { auditLog };
