const fsPromises = require('fs').promises;
const path = require('path');
const service = require('./api');

// Template registry
const templateRegistry = {
    'activationFailTemplate': 'activationFailTemplate.html',
    'activationSuccessTemplate': 'activationSuccessTemplate.html',
    'activationEmailTemplate': 'activationEmailTemplate.html'
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
