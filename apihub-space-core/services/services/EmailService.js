const nodemailer = require('nodemailer');
const emailConfig = require('../../../apihub-root/external-volume/email-config.json');

const activationEmailTemplate = require('../../models/html-templates/exporter.js')
('activationEmailTemplate');

const templateReplacer_$$ = require('../../apis/exporter.js')
('templateReplacer_$$');

const {ENVIRONMENT_MODE, PRODUCTION_BASE_URL, DEVELOPMENT_BASE_URL} = require('../../config.json')

class EmailService {
    constructor() {
        if (EmailService.instance) {
            return EmailService.instance;
        }
        this.transporter = nodemailer.createTransport({
            service: emailConfig.service,
            auth: {
                user: emailConfig.emailAuth,
                pass: emailConfig.password,
            },
        });
    }

    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    async sendEmail(from = emailConfig.email, sendToAddr, subject, html) {
        const mailOptions = {
            from: from,
            to: sendToAddr,
            subject: subject,
            html: html
        };
        await this.transporter.sendMail(mailOptions);
    }

    async sendActivationEmail(emailAddress, username, activationToken) {
        let baseURL = ""

        if (ENVIRONMENT_MODE === 'development') {
            baseURL = DEVELOPMENT_BASE_URL
        } else {
            baseURL = PRODUCTION_BASE_URL
        }
        const activationLink = `${baseURL}/users/verify?activationToken=${encodeURIComponent(activationToken)}`;
        const emailHtml = templateReplacer_$$(activationEmailTemplate, {
            username: username,
            companyLogoURL: emailConfig.companyLogoURL,
            activationLink: activationLink,
            companyName: emailConfig.companyName,
            streetAddress: emailConfig.streetAddress,
            city: emailConfig.city,
            country: emailConfig.country,
            zipCode: emailConfig.zipCode,
            supportEmail: emailConfig.supportEmail,
            phoneNumber: emailConfig.phoneNumber,
        });
        await this.sendEmail(emailConfig.email, emailAddress, 'Account Activation', emailHtml);
    }
}

module.exports = EmailService;