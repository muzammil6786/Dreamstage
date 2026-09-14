import jwt from "jsonwebtoken";
import User from "./models/User.js";

export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success:false, message:"Authentication required" });
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me");
    const user = await User.findById(payload.userId).populate("artist");
    if (!user || !user.isActive) return res.status(401).json({ success:false, message:"Invalid session" });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success:false, message:"Invalid or expired token" });
  }
}

export function roles(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) return res.status(403).json({ success:false, message:"You do not have permission for this action" });
    next();
  };
}
