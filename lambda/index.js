const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');

// Create a Secrets Manager client
const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
    console.log('Incoming event:', JSON.stringify(event, null, 2));

    try {
        // Retrieve SMTP credentials from Secrets Manager
        const secretName = 'smtpAuth';
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        const { smtpUsername, smtpPassword } = JSON.parse(data.SecretString);

        // Retrieve email addresses from Secrets Manager
        const emailSecretName = 'emailAddresses';
        const emailData = await secretsManager.getSecretValue({ SecretId: emailSecretName }).promise();
        const { fromEmail, toEmail } = JSON.parse(emailData.SecretString);

        console.log('Retrieved SMTP credentials:', { smtpUsername, smtpPassword });
        console.log('Retrieved email addresses:', { fromEmail, toEmail });

        // Parse event body for email details
        const { subject, message } = JSON.parse(event.body); 

        // Create Nodemailer transporter using SMTP transport
        const transporter = nodemailer.createTransport({
            host: 'mail.smtp2go.com', // SMTP host of your email service provider
            port: 2525, // SMTP port (usually 587 for TLS/STARTTLS)
            secure: false, // Set to true if using port 465 (SSL)
            auth: {
                user: smtpUsername, // SMTP username from Secrets Manager
                pass: smtpPassword // SMTP password from Secrets Manager
            }
        });

        // Email options
        const mailOptions = {
            from: fromEmail, // Sender email address
            to: toEmail, // Recipient email address
            subject: subject, // Subject line
            text: message // Plain text body
            // You can also add HTML content to the email if required
            // html: '<p>' + body + '</p>'
        };
        
        console.log('Outgoing Email:', JSON.stringify(mailOptions, null, 2));

        // Send email
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
