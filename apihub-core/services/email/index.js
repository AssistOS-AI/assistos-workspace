const nodemailer = require('nodemailer');
const emailConfig = require('./email-config.json');

const activationEmailTemplate = require('../../htmlexporter.js')
('activationEmailTemplate');

const templateReplacer_$$ = require('../../exporter.js')
('templateReplacer_$$');

const {ENVIRONMENT_MODE, PRODUCTION_BASE_URL, DEVELOPMENT_BASE_URL} = require('../../../config.json')

class Index {
    constructor() {
        if (Index.instance) {
            return Index.instance;
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
        if (!Index.instance) {
            Index.instance = new Index();
        }
        return Index.instance;
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

module.exports = Index;