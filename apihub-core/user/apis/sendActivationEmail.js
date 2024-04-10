const EmailService = require('../../classExporter.js')('EmailService');

async function sendActivationEmail(emailAddress, username, activationToken) {
    await EmailService.getInstance().sendActivationEmail(emailAddress, username, activationToken);
}

module.exports = sendActivationEmail