require('dns').setDefaultResultOrder('ipv4first');
const dns = require('dns').promises;
const nodemailer = require('nodemailer');

const SMTP_HOSTNAME = 'smtp.gmail.com';
const SMTP_PORT = 465;

// Cache the resolved IPv4 address briefly so we're not doing a DNS lookup
// on every single email — Gmail's SMTP IPs rarely change, but we still
// refresh periodically in case they do.
let cachedIp = null;
let cachedAt = 0;
const IP_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Resolves smtp.gmail.com to a literal IPv4 address using dns.resolve4(),
 * which — unlike dns.lookup() — can ONLY return A records, never AAAA.
 * This physically prevents Node/Render from ever attempting an IPv6 route,
 * regardless of Node version, autoSelectFamily behavior, or whether the
 * installed nodemailer version honors the `family` option.
 */
async function getSmtpIPv4Host() {
  const now = Date.now();
  if (cachedIp && now - cachedAt < IP_CACHE_TTL_MS) {
    return cachedIp;
  }

  try {
    const addresses = await dns.resolve4(SMTP_HOSTNAME);
    if (!addresses.length) {
      throw new Error('dns.resolve4 returned no A records');
    }
    cachedIp = addresses[0];
    cachedAt = now;
    console.log(`[Email] Resolved ${SMTP_HOSTNAME} -> IPv4 ${cachedIp}`);
    return cachedIp;
  } catch (err) {
    console.error(
      `[Email] IPv4 resolution failed for ${SMTP_HOSTNAME}, falling back to hostname (may hit IPv6 again):`,
      err.message
    );
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
    console.log('[Email] Attempting to send email to:', options.email);
    console.log('[Email] Using EMAIL_USERNAME:', process.env.EMAIL_USERNAME ? '***' + process.env.EMAIL_USERNAME.slice(-4) : 'NOT_SET');
    
    const smtpHost = await getSmtpIPv4Host();

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
        // Required whenever `host` is a raw IP: Gmail's TLS certificate is
        // issued for the hostname, not the IP, so we must explicitly tell
        // TLS which hostname to validate against (SNI + cert check).
        servername: SMTP_HOSTNAME,
      },
      family: 4,
      connectionTimeout: 10000,
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
