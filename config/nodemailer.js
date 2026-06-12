import { createTransport } from "nodemailer";

// SMTP Transporter
const transporter = createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // TLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send Email Function
const sendEmail = async ({ to, subject, body }) => {
  try {
    const response = await transporter.sendMail({
      from: `"EMS System" <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      html: body,
    });

    return response;
  } catch (error) {
    console.error("Email Send Error:", error);
    throw error;
  }
};

export default sendEmail;
