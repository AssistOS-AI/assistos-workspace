const EmailService = require('../../services/exporter.js')('EmailService');

async function sendActivationEmail(emailAddress, username, activationToken) {
    await EmailService.getInstance().sendActivationEmail(emailAddress, username, activationToken);
}

module.exports = sendActivationEmail