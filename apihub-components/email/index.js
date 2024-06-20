const fsPromises = require('fs').promises;
const path = require('path');
const service = require('./api');

const templateRegistry = {
    'activationFailTemplate': 'activationFailTemplate.html',
    'activationSuccessTemplate': 'activationSuccessTemplate.html',
    'activationEmailTemplate': 'activationEmailTemplate.html',
    'spaceInvitationAcceptedTemplate': 'spaceInvitationAcceptedTemplate.html',
    'spaceInvitationRejectedTemplate': 'spaceInvitationRejectedTemplate.html',
    'spaceInvitationErrorTemplate': 'spaceInvitationErrorTemplate.html',
    'createAccountTemplate': 'createAccountTemplate.html',
};

const getTemplate = async (templateName) => {
    const fileName = templateRegistry[templateName];
    if (!fileName) {
        throw new Error(`Template '${templateName}' does not exist.`);
    }
    const filePath = path.join(__dirname,'templates', fileName);
    return await fsPromises.readFile(filePath, 'utf8');
};


module.exports = {
    getTemplate,
    instance: service.getInstance()
};
