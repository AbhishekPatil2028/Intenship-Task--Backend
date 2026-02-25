import { sendMailService } from "../services/mail.service.js";

export const sendTestMail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const html = `
      <h2>Nodemailer Test</h2>
      <p>${message}</p>
    `;

    await sendMailService({
      to,
      subject,
      html,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
