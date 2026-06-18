import nodemailer from "nodemailer"
import { Resend } from "resend"

interface EmailPayload {
  to: string
  subject: string
  html: string
}

// Bracket notation — prevents webpack from baking in undefined at build time
const FROM = `"${process.env["MAIL_FROM_NAME"] ?? "Print 2 Play"}" <${process.env["MAIL_FROM_ADDRESS"] ?? "noreply@character-printer.app"}>`

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const provider = process.env["MAIL_PROVIDER"] ?? "mailtrap"

  if (provider === "disabled") return

  if (provider === "resend") {
    const resend = new Resend(process.env["RESEND_API_KEY"])
    const { error } = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    })
    if (error) throw new Error(`Resend error: ${error.message}`)
    return
  }

  // Default: nodemailer SMTP (Mailtrap sandbox or any SMTP)
  const transport = nodemailer.createTransport({
    host: process.env["MAILTRAP_HOST"] ?? "sandbox.smtp.mailtrap.io",
    port: Number(process.env["MAILTRAP_PORT"] ?? 2525),
    auth: {
      user: process.env["MAILTRAP_USERNAME"],
      pass: process.env["MAILTRAP_PASSWORD"],
    },
  })

  await transport.sendMail({
    from: FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  })
}
