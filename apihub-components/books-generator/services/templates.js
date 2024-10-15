const Storage = require('../../apihub-component-utils/storage.js')
const GenerateTemplateTask = require('../../tasks/GenerateTemplate.js')

async function getTemplates(spaceId) {
    Storage.getFiles(spaceId, 'templates');
}

async function getTemplate(spaceId, templateId) {
    return await Storage.getFile(spaceId, 'templates', templateId);
}

async function addTemplate(spaceId, templateId, templateData) {
    return await Storage.putFile(spaceId, templateId, templateData, "json", "templates");
}

async function updateTemplate(spaceId, templateId, templateData) {
    return await Storage.updateFile(spaceId, 'templates', templateId, templateData);
}

async function deleteTemplate(spaceId, templateId) {
    return await Storage.deleteFile(spaceId, 'templates', templateId);
}

async function generateTemplate(request, spaceId, templateData) {
    const securityContext = {
        cookies: request.headers.cookie,
        spaceId: spaceId,
        userId: request.userid
    }
    const generateTemplateTask = new GenerateTemplateTask(securityContext, spaceId, request.userid, templateData);
    generateTemplateTask.runTask();
    return generateTemplateTask.id;
}

module.exports = {
    getTemplates,
    getTemplate,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    generateTemplate
}
