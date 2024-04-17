const nodemailer = require('nodemailer');
const emailConfig = require('../config.json');
const fsPromises = require('fs').promises;

const path = require('path');
const activationEmailTemplatePath = path.join(__dirname, '..', 'data', 'templates', 'html', 'activationEmailTemplate.html');


const Loader = require('../../../index.js')
const utilModule = Loader.loadModule('util')
const data = utilModule.loadAPIs('data')

const {ENVIRONMENT_MODE, PRODUCTION_BASE_URL, DEVELOPMENT_BASE_URL} = require('../../../../config.json')

class Email {
    constructor() {
        if (Email.instance) {
            return Email.instance;
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
        if (!Email.instance) {
            Email.instance = new Email();
        }
        return Email.instance;
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
        const activationEmailTemplate = await fsPromises.readFile(activationEmailTemplatePath, 'utf8')
        let baseURL = ""

        if (ENVIRONMENT_MODE === 'development') {
            baseURL = DEVELOPMENT_BASE_URL
        } else {
            baseURL = PRODUCTION_BASE_URL
        }
        const activationLink = `${baseURL}/users/verify?activationToken=${encodeURIComponent(activationToken)}`;
        const emailHtml = data.fillTemplate(activationEmailTemplate, {
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

module.exports = Email;