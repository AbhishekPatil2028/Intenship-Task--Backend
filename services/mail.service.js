import { createMailTransporter } from "../config/mail.config.js";

export const sendMailService = async ({ to, subject, html }) => {
  try {
    const transporter = createMailTransporter(); // ✅ created AFTER env load

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    return info.messageId;
  } catch (error) {
    console.error("Mail Service Error:", error.message);
    throw new Error("Email sending failed");
  }
};
