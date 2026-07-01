const nodemailer = require('nodemailer');

// 1. Generate a random 6-digit OTP
const generatedOTP = Math.floor(100000 + Math.random() * 900000);

// 2. Configure the email transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Added to fix Render IPv6 network reachability issues
    port: 465,              // Secure port for SMTP
    secure: true,           // Use SSL
    auth: {
        user: 'plant.care.support@gmail.com',
        pass: 'rckodcmltqkesfxg'
    }
});

// 3. Setup email content (HTML template)
const mailOptions = {
    from: 'plant.care.support@gmail.com',
    to: 'sifehap21@gmail.com',
    subject: 'PlantCare - Your Verification Code (OTP)',
    html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 30px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto;">
            <h2 style="color: #2E8B57;">Welcome to PlantCare!</h2>
            <p style="font-size: 16px; color: #333;">Please use the following One-Time Password (OTP) to complete your registration:</p>
            <h1 style="background-color: #f4f4f4; padding: 15px; letter-spacing: 5px; color: #000; border-radius: 5px;">
                ${generatedOTP}
            </h1>
            <p style="font-size: 14px; color: #777;">This code is valid for 10 minutes. Do not share it with anyone.</p>
        </div>
    `
};

console.log('⏳ Generating and sending OTP email...');

// 4. Send the email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log('\n❌ Failed to send OTP. Error details:');
        console.error(error.message);
    } else {
        console.log(`\n✅ Success! OTP [${generatedOTP}] has been sent successfully.`);
        console.log('Response from server: ' + info.response);
    }
});