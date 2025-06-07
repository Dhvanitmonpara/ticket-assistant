import bcrypt from "bcrypt"
import userModel from "../models/user.model.js"
import jwt from "jsonwebtoken"
import inngest from '../inngest/client.js'
import env from "../config/env.js"

export const signup = async (req, res) => {
  const { email, password, skills = [] } = req.body

  try {
    const hashedPassword = bcrypt.hashSync(password, 10)

    const user = await userModel.create({
      email,
      password: hashedPassword,
      skills
    })

    // Fire inngest event
    await inngest.send({
      name: "user/signup",
      data: {
        email
      }
    })

    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role
      },
      env.JWT_SECRET
    )

    res.json({ user, token })

  } catch (error) {
    return res.status(500).json({ error: "Sign up failed", message: error.message })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body

  try {

    const user = await userModel.findOne({ email })
    if (!user) return res.status(401).json({ error: "User not found" })

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role
      },
      env.JWT_SECRET
    )

    res.json({ user, token })

  } catch (error) {
    return res.status(500).json({ error: "Login failed", message: error.message })
  }
}

export const logout = async (req, res) => {
  try {

    const token = req.headers.authorization.split(" ")[1]
    if (!token) return res.status(401).json({ error: "Unauthorized" })

    jwt.verify(token, env.JWT_SECRET, (err) => {
      if (err) return res.status(401).json({ error: "Unauthorized" })
    })
    res.json({ message: "Logout successfully" })
  } catch (error) {
    return res.status(500).json({ error: "Logout failed", message: error.message })
  }
}

export const updateUser = async (req, res) => {
  const { skills = [], role, email } = req.body

  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" })
    }
    const user = await userModel.findOne({ email })
    if (!user) return res.status(404).json({ error: "User not found" })

    await user.updateOne({ email }, {
      skills: skills.length ? skills : user.skills,
      role
    })

    return res.json({ message: "User updated successfully" })
  } catch (error) {
    res.status(500).json({ error: "Update failed", message: error.message })
  }
}

export const getUsers = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const users = userModel.find().select("-password")

    return res.json(users)

  } catch (error) {
    res.status(500).json({ error: "Error finding users", message: error.message })
  }
}