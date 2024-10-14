const Storage = require('../../apihub-component-utils/storage.js')

async function getTemplates(spaceId) {
    Storage.getFiles(spaceId, 'templates');
}

async function getTemplate(spaceId, templateId) {
    return await Storage.getFile(spaceId, 'templates', templateId);
}

async function addTemplate(spaceId,templateId, templateData) {
    return await Storage.putFile(spaceId, templateId, templateData, "json", "templates");
}

async function updateTemplate(spaceId, templateId, templateData) {
    return await Storage.updateFile(spaceId, 'templates', templateId, templateData);
}

async function deleteTemplate(spaceId, templateId) {
    return await Storage.deleteFile(spaceId, 'templates', templateId);
}

module.exports = {
    getTemplates,
    getTemplate,
    addTemplate,
    updateTemplate,
    deleteTemplate
}
