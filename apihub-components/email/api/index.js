const fsPromises = require('fs').promises;
const path = require('path');

const emailConfig = require('../emailConfig.json');

class Email {
    constructor() {
        const nodemailer = require('nodemailer');

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
        const data = require('../../apihub-component-utils/data.js')
        const activationEmailTemplatePath = path.join(__dirname, '..', 'templates', 'activationEmailTemplate.html');

        const activationEmailTemplate = await fsPromises.readFile(activationEmailTemplatePath, 'utf8')

        const baseURL=process.env.BASE_URL;

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

    async sendSpaceInvitationEmail(email, invitationToken, spaceName, referrerName, newUser = false) {

        const data = require('../../apihub-component-utils/data.js')
        const spaceInvitationTemplatePath = path.join(__dirname, '..', 'templates', 'spaceInvitationTemplate.html');
        const spaceInvitationTemplate = await fsPromises.readFile(spaceInvitationTemplatePath, 'utf8')

        const baseURL=process.env.BASE_URL;
        const baseAcceptURL = `${baseURL}/spaces/invitations/accept?invitationToken=${encodeURIComponent(invitationToken)}`;
        const invitationLinkAccepted = `<a href="${baseAcceptURL}${newUser ? '&newUser=true' : ''}" class="button">Accept</a>`;
        const invitationLinkRejected = newUser === false ? `<a href="${baseURL}/spaces/invitations/reject?invitationToken=${encodeURIComponent(invitationToken)}" class="button">Reject</a>` : "";

        const emailHtml = data.fillTemplate(spaceInvitationTemplate, {
            spaceName: spaceName,
            referrerName: referrerName,
            invitationLinkAccepted: invitationLinkAccepted,
            invitationLinkRejected: invitationLinkRejected,
            companyLogoURL: emailConfig.companyLogoURL,
            companyName: emailConfig.companyName,
            streetAddress: emailConfig.streetAddress,
            city: emailConfig.city,
            country: emailConfig.country,
            zipCode: emailConfig.zipCode,
            supportEmail: emailConfig.supportEmail,
            phoneNumber: emailConfig.phoneNumber,
        });

        await this.sendEmail(emailConfig.email, email, `You have been invited to ${spaceName}`, emailHtml);
    }
}

module.exports = Email;
