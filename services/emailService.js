const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async sendNotificationEmail(to, subject, message) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: to,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>${subject}</h2>
                        <p>${message}</p>
                        <p>This is an automated message from your Insulin Pump Monitoring System.</p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }
}

module.exports = new EmailService();