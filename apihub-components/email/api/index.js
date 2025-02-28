const fsPromises = require('fs').promises;
const path = require('path');

class Email {
    constructor() {
        const nodemailer = require('nodemailer');
        this.emailConfig = require('../data-volume/config/emailConfig.json');
        if (Email.instance) {
            return Email.instance;
        }
        this.transporter = nodemailer.createTransport({
            service: this.emailConfig.service,
            auth: {
                user: this.emailConfig.emailAuth,
                pass: this.emailConfig.password,
            },
        });
    }

    static getInstance() {
        if (!Email.instance) {
            Email.instance = new Email();
        }
        return Email.instance;
    }

    async sendEmail(from = this.emailConfig.email, sendToAddr, subject, html) {
        const mailOptions = {
            from: from,
            to: sendToAddr,
            subject: subject,
            html: html
        };
        await this.transporter.sendMail(mailOptions);
    }

    async sendActivationEmail(emailAddress, activationToken) {
        const data = require('../../apihub-component-utils/data.js')
        const activationEmailTemplatePath = path.join(__dirname, '..', 'templates', 'activationEmailTemplate.html');

        const activationEmailTemplate = await fsPromises.readFile(activationEmailTemplatePath, 'utf8')

        const baseURL= process.env.BASE_URL;

        const activationLink = `${baseURL}/users/verify?activationToken=${encodeURIComponent(activationToken)}`;
        const emailHtml = data.fillTemplate(activationEmailTemplate, {
            companyLogoURL: this.emailConfig.companyLogoURL,
            activationLink: activationLink,
            companyName: this.emailConfig.companyName,
            streetAddress: this.emailConfig.streetAddress,
            city: this.emailConfig.city,
            country: this.emailConfig.country,
            zipCode: this.emailConfig.zipCode,
            supportEmail: this.emailConfig.supportEmail,
            phoneNumber: this.emailConfig.phoneNumber,
            title: "Welcome to AssistOS!",
            buttonDescription: "You're almost ready to start exploring the limitless possibilities with AssistOS. Click the button below to activate your account:",
            buttonText: "Activate Account",
        });
        await this.sendEmail(this.emailConfig.email, emailAddress, 'Account Activation', emailHtml);
    }
    async sendAssistOSMail(email, subject, title, buttonDescription, buttonText, endpoint) {
        const data = require('../../apihub-component-utils/data.js')
        const activationEmailTemplatePath = path.join(__dirname, '..', 'templates', 'activationEmailTemplate.html');
        const activationEmailTemplate = await fsPromises.readFile(activationEmailTemplatePath, 'utf8')
        const baseURL= process.env.BASE_URL;

        const activationLink = `${baseURL}/${endpoint}`;
        const emailHtml = data.fillTemplate(activationEmailTemplate, {
            companyLogoURL: this.emailConfig.companyLogoURL,
            activationLink: activationLink,
            companyName: this.emailConfig.companyName,
            streetAddress: this.emailConfig.streetAddress,
            city: this.emailConfig.city,
            country: this.emailConfig.country,
            zipCode: this.emailConfig.zipCode,
            supportEmail: this.emailConfig.supportEmail,
            phoneNumber: this.emailConfig.phoneNumber,
            title: title,
            buttonDescription: buttonDescription,
            buttonText: buttonText,
        });
        await this.sendEmail(this.emailConfig.email, email, subject, emailHtml);
    }
    async sendUserAddedToSpaceEmail(email, spaceName, invitationToken) {
        const data = require('../../apihub-component-utils/data.js')
        const spaceInvitationTemplatePath = path.join(__dirname, '..', 'templates', 'spaceInvitationTemplate.html');
        const spaceInvitationTemplate = await fsPromises.readFile(spaceInvitationTemplatePath, 'utf8')

        const baseURL= process.env.BASE_URL;
        let appLink;
        if(invitationToken){
            appLink = `<a class="button" href="${baseURL}/#authentication-page/inviteToken/${encodeURIComponent(invitationToken)}">Create an account</a>`;
        } else {
            appLink = `<a class="button" href="${baseURL}">Take me there</a>`;
        }
        const emailHtml = data.fillTemplate(spaceInvitationTemplate, {
            spaceName: spaceName,
            appLink: appLink,
            companyLogoURL: this.emailConfig.companyLogoURL,
            companyName: this.emailConfig.companyName,
            streetAddress: this.emailConfig.streetAddress,
            city: this.emailConfig.city,
            country: this.emailConfig.country,
            zipCode: this.emailConfig.zipCode,
            supportEmail: this.emailConfig.supportEmail,
            phoneNumber: this.emailConfig.phoneNumber,
        });

        await this.sendEmail(this.emailConfig.email, email, `You have been added to ${spaceName}`, emailHtml);
    }
    async sendPasswordResetCode(email, resetToken) {
        const data = require('../../apihub-component-utils/data.js')
        const passwordResetTemplatePath = path.join(__dirname, '..', 'templates', 'passwordResetTemplate.html');
        const passwordResetTemplate = await fsPromises.readFile(passwordResetTemplatePath, 'utf8')
        const emailHtml = data.fillTemplate(passwordResetTemplate, {
            companyLogoURL: this.emailConfig.companyLogoURL,
            passwordResetCode: resetToken,
            companyName: this.emailConfig.companyName,
            streetAddress: this.emailConfig.streetAddress,
            city: this.emailConfig.city,
            country: this.emailConfig.country,
            zipCode: this.emailConfig.zipCode,
            supportEmail: this.emailConfig.supportEmail,
            phoneNumber: this.emailConfig.phoneNumber,
        });

        await this.sendEmail(this.emailConfig.email, email, 'Password Reset', emailHtml);
    }
}

module.exports = Email;
