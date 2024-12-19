const Handler = require('./handler');
const Request = require('../apihub-component-utils/utils.js');

async function createLog(request, response) {
    const {spaceId} = request.params;
    const logData = request.body;
    try {
        const logId = await Handler.createLog(spaceId, logData);
        return Request.sendResponse(response, 200, "application/json", {
            logId
        });

    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: "Failed to create log" + error.message,
        });
    }
}

async function getLogs(request, response) {
    const {spaceId} = request.params;
    const query = request.query;
    try {
        const logs = await Handler.getLogs(spaceId, query);
        return Request.sendResponse(response, 200, "application/json", {
            data: logs
        });
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: "Failed to get logs" + error.message,
        });
    }
}

async function getLog(request, response) {
    const {spaceId, logId} = request.params;
    try {
        const log = await Handler.getLog(spaceId, logId);
        return Request.sendResponse(response, 200, "application/json", {
            data: log
        });
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: "Failed to get log" + error.message,
        });
    }
}

module.exports = {
    createLog,
    getLogs,
    getLog
}