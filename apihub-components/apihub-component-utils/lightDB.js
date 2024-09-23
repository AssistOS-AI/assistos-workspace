const enclave = require('enclave');

function loadDatabaseClient(spaceId) {
    return enclave.initialiseLightDBEnclave(spaceId);
}

async function insertRecord(spaceId, tableId, objectId, objectData) {
    const dbClient =  loadDatabaseClient(spaceId);
    return   await $$.promisify(dbClient.insertRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: objectData});
}
async function updateRecord(spaceId,tableId,objectId,objectData) {
    const dbClient = loadDatabaseClient(spaceId);
    return await $$.promisify(dbClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: objectData});
}
async function deleteRecord(spaceId,tableId,objectId) {
    const dbClient= loadDatabaseClient(spaceId);
    return await $$.promisify(dbClient.deleteRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
}
async function getRecord(spaceId,tableId,objectId) {
    const dbClient = loadDatabaseClient(spaceId);
    return await $$.promisify(dbClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
}
async function getAllRecords(spaceId,objectId) {
    const dbClient = loadDatabaseClient(spaceId);
    return await $$.promisify(dbClient.getAllRecords)($$.SYSTEM_IDENTIFIER, objectId);
}

module.exports = {
    insertRecord,
    updateRecord,
    deleteRecord,
    getRecord,
    getAllRecords
}
