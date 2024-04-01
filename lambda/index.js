const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');

// Create a Secrets Manager client
const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {

    try {
        // Retrieve SMTP credentials from Secrets Manager
        const secretName = 'smtpAuth';
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        const { smtpUsername, smtpPassword } = JSON.parse(data.SecretString);

        // Retrieve email addresses from Secrets Manager
        const emailSecretName = 'emailAddresses';
        const emailData = await secretsManager.getSecretValue({ SecretId: emailSecretName }).promise();
        const { fromEmail, toEmail } = JSON.parse(emailData.SecretString);

        // Parse event body for email details
        const { subject, message } = JSON.parse(event.body); 

        // Create Nodemailer transporter using SMTP transport
        const transporter = nodemailer.createTransport({
            host: 'mail.smtp2go.com', 
            port: 2525, 
            secure: false, 
            auth: {
                user: smtpUsername, 
                pass: smtpPassword 
            }
        });

        // Email options
        const mailOptions = {
            from: fromEmail, 
            to: toEmail, 
            subject: subject, 
            text: message 
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully' })
        };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send email' })
        };
    }
};
