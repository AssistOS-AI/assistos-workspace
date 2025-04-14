
const Handler = require('./handler');
const Request = require('../apihub-component-utils/utils.js');


async function createLog(request, response) {
    const validateLogParams = (logData) => {
        if (!logData.type) {
            CustomError.throwBadRequestError("Log type is required");
        }
        if (!logData.message) {
            CustomError.throwBadRequestError("Log message is required");
        }
    }
    const {spaceId} = request.params;
    const logData = request.body;

    validateLogParams(logData);

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
        const {buffer, fileName} = await Handler.getLogs(spaceId, query);
        response.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="${fileName}"`
        });
        response.end(buffer);
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
        return Request.sendResponse(response, 200, "application/json", log);
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