import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import env from "./config/env.js"
import userRouter from "./routes/user.routes.js"
import ticketRouter from "./routes/ticket.routes.js"
import { serve } from "inngest/express"
import inngest from "./inngest/client.js"
import { onTicketCreated } from "./inngest/functions/on-ticket-create.js"
import { onUserSignup } from "./inngest/functions/on-signup.js"

const CORS_OPTIONS = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
}

const app = express()

app.use(cors(CORS_OPTIONS))
app.use(express.json())

app.use("/api/auth", userRouter)
app.use("/api/tickets", ticketRouter)

app.use("/api/inngest", serve({
  client: inngest,
  functions: [
    onTicketCreated,
    onUserSignup
  ]
}))

mongoose.connect(env.MONGO_URL).then(() => {
  console.log("Connected to MongoDB")
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`)
  })
}).catch((err) => {
  console.error(err)
})