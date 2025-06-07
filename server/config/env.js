import dotenv from "dotenv"

dotenv.config({
  path: "./.env"
})

const env = {
  PORT: process.env.PORT || 3000,
  MONGO_URL: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  NODEMAILER_USER: process.env.NODEMAILER_USER,
  NODEMAILER_PASS: process.env.NODEMAILER_PASS,
  NODEMAILER_HOST: process.env.NODEMAILER_HOST,
  NODEMAILER_PORT: process.env.NODEMAILER_PORT,
  APP_URL: process.env.APP_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
}

export default env