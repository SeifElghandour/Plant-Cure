const Resend = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

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
    console.log(`[Email] Attempting to send email to: ${options.email}`);
    
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }

    // Send email using Resend API
    console.log('[Email] Sending email via Resend API...');
    const data = await resend.emails.send({
      from: 'PlantCare AI <onboarding@resend.dev>',
      to: options.email,
      subject: options.subject,
      html: options.message,
    });

    console.log(`[Email] ✅ Email sent successfully! Message ID: ${data.id}`);
    return data;

  } catch (error) {
    console.error('\n❌ [Email] FAILED to send email:');
    console.error(`- Message: ${error.message}`);
    
    if (error.response) {
      console.error(`- Response: ${JSON.stringify(error.response)}`);
    }
    
    throw error;
  }
};

module.exports = sendEmail;
module.exports.buildOtpEmailHtml = buildOtpEmailHtml;