import jwt from "jsonwebtoken";
import clientRedis from "../Services/redisService.js";

export const authUser = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    const redisKey = `bl_token_${token}`;
    const isBlacklisted = await clientRedis.get(redisKey);

    if (isBlacklisted) {
      res.clearCookie("token"); 
      return res.status(401).json({ error: "Token is blacklisted" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Auth Error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
