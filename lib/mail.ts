import nodemailer from "nodemailer"

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM

const hasSmtpConfig = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null

export async function sendAdminLoginCodeEmail(to: string, code: string) {
  const target = to.trim()

  // Log de depuração APENAS em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log("[admin:login-code] DEV:", { to: target, code, transport: transporter ? "smtp" : "console" })
  }

  // Se SMTP não estiver configurado, continua apenas com log
  if (!transporter) {
    return
  }

  const from = SMTP_FROM || SMTP_USER

  try {
    await transporter.sendMail({
      from,
      to: target,
      subject: "Código de login do painel admin",
      text: `Seu código de login é: ${code}\n\nEle vale por alguns minutos. Se você não pediu este código, apenas ignore este e-mail.`,
      html: `<p>Seu código de login é:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
<p>Ele vale por alguns minutos. Se você não pediu este código, apenas ignore este e-mail.</p>`,
    })
  } catch (err) {
    // Em dev, apenas loga o erro sem falhar
    if (process.env.NODE_ENV === "development") {
      console.warn("[admin:login-code] SMTP Error (continuing anyway):", err instanceof Error ? err.message : err)
      return
    }
    // Em produção, propaga o erro
    throw err
  }
}

