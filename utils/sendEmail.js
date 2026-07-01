require('dns').setDefaultResultOrder('ipv4first');
const dns = require('dns').promises;
const nodemailer = require('nodemailer');

const SMTP_HOSTNAME = 'smtp.gmail.com';
const SMTP_PORT = 465; // Render free tier might block this port

// Cache System for Gmail IP
let cachedIp = null;
let cachedAt = 0;
const IP_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Resolves SMTP hostname to an IPv4 literal.
 * This completely bypasses any IPv6 networking issues on the host machine.
 */
async function getSmtpIPv4Host() {
  const now = Date.now();
  if (cachedIp && (now - cachedAt < IP_CACHE_TTL_MS)) {
    return cachedIp;
  }

  try {
    const addresses = await dns.resolve4(SMTP_HOSTNAME);
    if (!addresses || addresses.length === 0) {
      throw new Error('dns.resolve4 returned no A records');
    }
    cachedIp = addresses[0];
    cachedAt = now;
    console.log(`[Email-Network] Resolved ${SMTP_HOSTNAME} -> IPv4 ${cachedIp}`);
    return cachedIp;
  } catch (err) {
    console.error(`[Email-Network] IPv4 resolution failed, falling back to hostname: ${err.message}`);
    return SMTP_HOSTNAME;
  }
}

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
    
    // 1. Get the explicit IPv4 Address
    const smtpHost = await getSmtpIPv4Host();

    // 2. Configure Transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
        servername: SMTP_HOSTNAME, // Critical for SSL when using raw IPs
      },
      family: 4,
      connectionTimeout: 15000, // Increased timeout to 15 seconds
    });

    // 3. Setup Mail Options
    const mailOptions = {
      from: `"PlantCare System" <${process.env.EMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    // 4. Send Email
    console.log('[Email] Sending email via Gmail SMTP...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ✅ Email sent successfully! Message ID: ${info.messageId}`);
    
    return info;

  } catch (error) {
    console.error('\n❌ [Email] FAILED to send email:');
    console.error(`- Code: ${error.code}`);
    console.error(`- Message: ${error.message}`);
    
    if (error.response) console.error(`- SMTP Response: ${error.response}`);
    if (error.command) console.error(`- Failed Command: ${error.command}`);
    
    throw error;
  }
};

module.exports = sendEmail;
module.exports.buildOtpEmailHtml = buildOtpEmailHtml;