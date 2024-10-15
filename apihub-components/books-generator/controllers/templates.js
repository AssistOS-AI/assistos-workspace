const util = require('../../apihub-component-utils/utils.js')
const templateService = require('../services/templates.js')
const crypto = require('../../apihub-component-utils/crypto.js')

async function getTemplates(req, res) {
    const spaceId = req.params.spaceId;
    try {
        const templates = await templateService.getTemplates(spaceId);
        return util.sendResponse(res, 200, 'application/json', {
            data: templates,
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}

async function getTemplate(req, res) {
    const spaceId = req.params.spaceId;
    const templateId = req.params.templateId;
    try {
        const {fileStream,headers} = await templateService.getTemplate(spaceId, templateId);
        res.writeHead(200, headers);
       fileStream.pipe(res);
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}

async function addTemplate(req, res) {
    const spaceId = req.params.spaceId;
    const templateData = req.body;
    const templateId = crypto.generateId();
    try {
        const template = await templateService.addTemplate(spaceId, templateId, templateData);
        return util.sendResponse(res, 200, 'application/json', {
            data: template,
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}

async function updateTemplate(req, res) {
    const spaceId = req.params.spaceId;
    const templateId = req.params.templateId;
    const templateData = req.body;
    try {
        const template = await templateService.updateTemplate(spaceId, templateId, templateData);
        return util.sendResponse(res, 200, 'application/json', {
            data: template,
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}

async function deleteTemplate(req, res) {
    const spaceId = req.params.spaceId;
    const templateId = req.params.templateId;
    try {
        await templateService.deleteTemplate(spaceId, templateId);
        return util.sendResponse(res, 200, 'application/json', {
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}
async function generateTemplate(req, res) {
    const spaceId = req.params.spaceId;
    const templateData = req.body;
    try {
        const template = await templateService.generateTemplate(req,spaceId, templateData);
        return util.sendResponse(res, 200, 'application/json', {
            data: template,
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}

module.exports = {
    getTemplates,
    getTemplate,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    generateTemplate
}
