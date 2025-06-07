import nodemailer from "nodemailer"
import env from "../config/env.js"

const transporter = nodemailer.createTransport({
  host: env.NODEMAILER_HOST,
  port: env.NODEMAILER_PORT,
  secure: false,
  auth: {
    user: env.NODEMAILER_USER,
    pass: env.NODEMAILER_PASS
  }
})

const sendMail = async (to, subject, text) => {
  try {

    const info = await transporter.sendMail({
      from: "Inngest IMS",
      to,
      subject,
      text
    })

    return info

  } catch (error) {
    console.error("Mail error", error.message)
    throw error
  }
}

export default sendMail