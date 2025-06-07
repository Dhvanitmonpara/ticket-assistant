import jwt from "jsonwebtoken"
import env from "../config/env.js"

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ error: "Access denied" })

  try {
    const decoded = await jwt.verify(token, env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid token" })
  }
}