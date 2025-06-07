import inngest from "../client.js";
import TicketModel from "../../models/ticket.model.js";
import { NonRetriableError } from "inngest";
import analyzeTicket from "../../utils/ai.js";
import userModel from "../../models/user.model.js";
import sendMail from "../../utils/mailer.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data

      const ticket = await step.run("fetch-ticket", async () => {
        // fetch ticket from database
        const ticketObject = await TicketModel.findById(ticketId)
        if (!ticketObject) throw new NonRetriableError("Ticket not found in our database")
        return ticketObject
      })

      await step.run("update-ticket-status", async () => {
        await TicketModel.findByIdAndUpdate(ticket._id, { status: "TODO" })
      })

      const aiResponse = await analyzeTicket(ticket)

      const relatedSkills = await step.run("ai-processing", async () => {
        let skills = []
        if (aiResponse) {
          await TicketModel.findByIdAndUpdate(ticket._id, {
            priority: !["low", "medium", "high"].includes(aiResponse.priority) ? "medium" : aiResponse.priority,
            helpfulNotes: aiResponse.helpfulNotes,
            status: "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills
          })
          skills = aiResponse.relatedSkills
        }
        return skills
      })

      const moderator = await step.run("assign-moderator", async () => {
        let user = await userModel.findOne(
          {
            role: "moderator",
            skills: {
              $elemMatch: {
                $regex: relatedSkills.join("|"),
                $options: "i"
              }
            }
          })

        if (!user) {
          user = await userModel.findOne({ role: "admin" })
        }

        await TicketModel.findByIdAndUpdate(ticket._id, {
          assignedTo: user?._id || null
        })

        return user
      })

      await step.run("send-email-notification", async () => {
        if (moderator) {
          const finalTicket = await TicketModel.findById(ticket._id)
          const subject = "Ticket Assigned"
          const message = `Hi,\n\nA new ticket has been assigned to you. Name of the ticket is ${finalTicket.title}.`
          await sendMail(moderator.email, subject, message)
        }
      })
    } catch (error) {
      console.error("Error running step", error.message)
      return { success: false, error: error.message }
    }
  }
)