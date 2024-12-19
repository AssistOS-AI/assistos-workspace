const Logger=require('./Logger');

async function getLogs(spaceId, query) {
    return await Logger.getLogs(spaceId, query);
}
async function createLog(spaceId, logData) {
    return await Logger.createLog(spaceId,logType,logData);
}
async function getLog(spaceId, logId) {
    return await Logger.getLog(spaceId, logId);
}
module.exports = {
    getLogs,
    createLog,
    getLog
}