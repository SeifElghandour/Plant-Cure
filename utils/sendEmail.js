require('dns').setDefaultResultOrder('ipv4first');
const nodemailer = require('nodemailer');

function buildOtpEmailHtml(name, otp) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="color: #2d8a6b; margin-bottom: 8px;">PlantCare</h2>
      <p>Hello ${name},</p>
      <p>Use the verification code below to complete your PlantCare account setup:</p>
      <div style="background: #f4faf7; border: 2px dashed #2d8a6b; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2d8a6b;">${otp}</span>
      </div>
      <p style="color: #555;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="color: #888; font-size: 13px;">If you did not create a PlantCare account, you can safely ignore this email.</p>
    </div>
  `;
}

const sendEmail = async (options) => {
  try {
    console.log('[Email] Attempting to send email to:', options.email);
    console.log('[Email] Using EMAIL_USERNAME:', process.env.EMAIL_USERNAME ? '***' + process.env.EMAIL_USERNAME.slice(-4) : 'NOT_SET');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      family: 4
    });

    const mailOptions = {
      from: `"PlantCare" <${process.env.EMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    console.log('[Email] Sending email via Gmail SMTP...');
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Email sent successfully. Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('[Email] FAILED to send email:');
    console.error('[Email] Error code:', error.code);
    console.error('[Email] Error message:', error.message);
    if (error.response) {
      console.error('[Email] SMTP response:', error.response);
    }
    if (error.command) {
      console.error('[Email] Failed command:', error.command);
    }
    throw error;
  }
};

module.exports = sendEmail;
module.exports.buildOtpEmailHtml = buildOtpEmailHtml;
