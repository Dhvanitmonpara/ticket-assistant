import { NonRetriableError } from "inngest";
import userModel from "../../models/user.model.js";
import inngest from "../client.js";
import sendMail from "../../utils/mailer.js";

export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 2 },
  { event: "user/signup" },
  async ({ event, step }) => {
    try {
      const { email } = event.data
      const user = await step.run("get-user-email", async () => {
        const userObject = await userModel.findOne({ email })
        if (!userObject) throw new NonRetriableError("User no longer exists in our database")
        return userObject
      })
      await step.run("send-welcome-email", async () => {
        const subject = "Welcome to the app"
        const message = "Hi,\n\nThanks for signing up. We're glad to have you."
        await sendMail(user.email, subject, message)
      })

      return { success: true }
    } catch (error) {
      console.error("Error running step", error.message)
      return { success: false, error: error.message }
    }
  }
)