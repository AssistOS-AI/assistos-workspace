const lightDB = require('../../apihub-component-utils/lightDB.js');
const TaskManager = require('../../tasks/TaskManager');
const crypto = require("../../apihub-component-utils/crypto");
const SubscriptionManager = require("../../subscribers/SubscriptionManager");
function constructDocumentURI(documentId, property) {
    return `${documentId}${property ? `/${property}` : ''}`
}

async function getDocumentTasks(spaceId, documentId) {
    const chapterService= require('../services/chapter.js');
    const documentChapters = await getDocument(spaceId, documentId, {fields: "chapters"});
    if(!documentChapters){
        return [];
    }
    const chapterTasks = await Promise.allSettled(documentChapters.map(chapter => {
        return chapterService.getChapterTasks(spaceId, documentId, chapter.id);
    }));
    return chapterTasks
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .flat();
}
async function deleteDocument(spaceId, documentId) {
        const documentTasks = await getDocumentTasks(spaceId, documentId);
    await Promise.allSettled(documentTasks.map(async taskId => {
        return TaskManager.cancelTaskAndRemove(taskId);
    }));
    try {
        await lightDB.deleteContainerObject(spaceId, getOperationsTableName(documentId));
    } catch (e) {
        throw new Error("Failed to delete operations table");
    }

    return await lightDB.deleteContainerObject(spaceId, documentId);
}

async function getDocument(spaceId, documentId, queryParams) {
    /* TODO Logic needs to be moved at query level */
    if (Object.keys(queryParams).length === 0) {
        return await lightDB.getContainerObject(spaceId, documentId)
    }
    if (queryParams.fields) {
        if (Array.isArray(queryParams.fields)) {
            let documentSegments = {}
            for (const field of queryParams.fields) {
                documentSegments[field] = await lightDB.getEmbeddedObject(spaceId, field, constructDocumentURI(documentId, field))
            }
            return documentSegments
        } else {
            return await lightDB.getEmbeddedObject(spaceId, queryParams.fields, constructDocumentURI(documentId, queryParams.fields))
        }
    }
}

async function getDocumentsMetadata(spaceId) {
    return await lightDB.getContainerObjectsMetadata(spaceId, "documents")
}

async function createDocument(spaceId, documentData) {
    documentData.operations = {
        count: 0
    };
    return await lightDB.addContainerObject(spaceId, "documents", documentData)
}

async function updateDocument(spaceId, documentId, documentData, queryParams) {
    let documentURI;
    let oldData;
    if (Object.keys(queryParams).length === 0) {
        documentURI = documentId;
        oldData = await getDocument(spaceId, documentId);
        await lightDB.updateContainerObject(spaceId, documentId, documentData)
    } else if (queryParams.fields) {
        if (Array.isArray(queryParams.fields)) {
            for (const field of queryParams.fields) {
                await lightDB.updateEmbeddedObject(spaceId, constructDocumentURI(documentId, field), documentData[field])
            }
        } else {
            documentURI = constructDocumentURI(documentId, queryParams.fields);
            oldData = await getDocument(spaceId, documentId, queryParams);
            await lightDB.updateEmbeddedObject(spaceId, documentURI, documentData)
        }
    }
    await addOperation(spaceId, documentId, {
        type: "update",
        objectURI: documentURI,
        oldData: oldData,
        newData: documentData,
        reverseOpNotification: {
            objectId: SubscriptionManager.getObjectId(spaceId, documentId),
            eventData: queryParams.fields
        }
    });
}
//must be over 2
let maxOperations = 50;
let opQueue = [];
let isProcessing = false;
async function processOperationQueue() {
    if (isProcessing) {
        return;
    }
    isProcessing = true;
    try {
        while (opQueue.length > 0) {
            const item = opQueue.shift();
            try {
                await processOperation(item.spaceId, item.documentId, item.operationData);
            } catch (err) {
                console.error(`Error adding operation: ${JSON.stringify(item)}`, err);
            }
        }
    } catch (err) {
        console.error("Unexpected error in processOperationQueue:", err);
    } finally {
        isProcessing = false; // Ensure this is reset even if errors occur
    }
}

async function addOperation(spaceId, documentId, operationData) {
    opQueue.push({ spaceId, documentId, operationData });
    processOperationQueue();
}
function getOperationsTableName(documentId){
    return documentId + "_operations";
}
async function processOperation(spaceId, documentId, operationData){
    let documentOperations;
    documentOperations = await lightDB.getEmbeddedObject(spaceId, "documents", constructDocumentURI(documentId, "operations"));
    let operationId = `operations_${crypto.generateId()}`;
    let opTable = getOperationsTableName(documentId);
    if(documentOperations.previousOp){
        //is not first op on the document
        operationData.previousOp = documentOperations.previousOp;
        let record;
        try {
            record = await lightDB.getRecord(spaceId, opTable, documentOperations.previousOp);
        } catch (e) {
            throw new Error("Failed to get previous operation " + e.message);
        }

        let previousOperation = record.data;
        if(previousOperation.nextOp){
            //unlink invalid chain
            documentOperations.count = await deleteLinkedOperations(spaceId, documentId, previousOperation.nextOp, documentOperations.count);
            documentOperations.nextOp = null;
        }
        previousOperation.nextOp = operationId;
        try {
            await lightDB.updateRecord(spaceId, opTable, documentOperations.previousOp, previousOperation);
        } catch (e) {
            throw new Error("Failed to update previous operation " + e.message);
        }
    } else {
        documentOperations.oldestOp = operationId;
        await lightDB.updateEmbeddedObject(spaceId, constructDocumentURI(documentId, "operations"), documentOperations);

    }
    operationData.id = operationId;
    try {
        await lightDB.insertRecord(spaceId, opTable, operationId, operationData);
    } catch (e) {
        throw new Error("Failed to insert operation " + e.message);
    }

    if(documentOperations.count === maxOperations){
        //delete oldest operation
        let oldestOp = await lightDB.getRecord(spaceId, opTable, documentOperations.oldestOp);
        let secondOldest = await lightDB.getRecord(spaceId, opTable, oldestOp.data.nextOp);
        secondOldest.data.previousOp = null;
        documentOperations.oldestOp = secondOldest.data.id;
        try {
            await lightDB.updateRecord(spaceId, opTable, secondOldest.data.id, secondOldest.data);
            await lightDB.deleteRecord(spaceId, opTable, oldestOp.data.id);
        } catch (e) {
            throw new Error("Failed to delete oldest operation " + e.message);
        }
        documentOperations.count -= 1;
    }
    documentOperations.count += 1;
    documentOperations.previousOp = operationId;
    try {
        await lightDB.updateEmbeddedObject(spaceId, constructDocumentURI(documentId, "operations"), documentOperations);
    } catch (e) {
        throw new Error("Failed to update document operations " + e.message);
    }
    return operationId;
}
async function deleteLinkedOperations(spaceId, documentId, operationId, opCount){
    while (operationId) {
        let record = await lightDB.getRecord(spaceId, getOperationsTableName(documentId), operationId);
        if (!record) {
            break;
        }
        let operation = record.data;
        try {
            await lightDB.deleteRecord(spaceId, getOperationsTableName(documentId), operationId);
        } catch (e) {
            console.error("Failed to delete operation", operationId);
        }
        opCount -= 1;
        operationId = operation.nextOp;
    }
    return opCount;
}
async function undoOperation(spaceId, documentId) {
    let documentOps = await lightDB.getEmbeddedObject(spaceId, "documents", constructDocumentURI(documentId, "operations"));
    if(!documentOps.previousOp){
        return false;
    }
    let record = await lightDB.getRecord(spaceId, getOperationsTableName(documentId), documentOps.previousOp);
    let operation = record.data;
    if(operation.type === "delete"){
        await lightDB.addEmbeddedObject(spaceId, operation.objectURI, operation.data);
        operation.reverseOpNotification.eventData.operationType = "add";
    } else if(operation.type === "add"){
        await lightDB.deleteEmbeddedObject(spaceId, operation.objectURI);
        operation.reverseOpNotification.eventData.operationType = "delete";
    } else if(operation.type === "update"){
        await lightDB.updateEmbeddedObject(spaceId, operation.objectURI, operation.oldData, "");
    } else if(operation.type === "swap"){
        await lightDB.swapEmbeddedObjects(spaceId, operation.objectURI, operation.data, operation.direction);
    }
    SubscriptionManager.notifyClients("", operation.reverseOpNotification.objectId, operation.reverseOpNotification.eventData);
    documentOps.previousOp = operation.previousOp;
    documentOps.nextOp = operation.id;
    await lightDB.updateEmbeddedObject(spaceId, constructDocumentURI(documentId, "operations"), documentOps);
    return true;
}
async function redoOperation(spaceId, documentId) {
    let documentOps = await lightDB.getEmbeddedObject(spaceId, "documents", constructDocumentURI(documentId, "operations"));
    if(!documentOps.nextOp){
        return false;
    }
    let record = await lightDB.getRecord(spaceId, getOperationsTableName(documentId), documentOps.nextOp);
    let operation = record.data;
    if(operation.type === "delete"){
        await lightDB.deleteEmbeddedObject(spaceId, operation.objectURI);
        operation.reverseOpNotification.eventData.operationType = "delete";
    } else if(operation.type === "add"){
        await lightDB.addEmbeddedObject(spaceId, operation.objectURI, operation.data)
        operation.reverseOpNotification.eventData.operationType = "add";
    } else if(operation.type === "update"){
        await lightDB.updateEmbeddedObject(spaceId, operation.objectURI, operation.newData, "");
    } else if(operation.type === "swap"){
        await lightDB.swapEmbeddedObjects(spaceId, operation.objectURI, operation.data, operation.direction);
    }
    SubscriptionManager.notifyClients("", operation.reverseOpNotification.objectId, operation.reverseOpNotification.eventData);
    documentOps.previousOp = operation.id;
    documentOps.nextOp = operation.nextOp;
    await lightDB.updateEmbeddedObject(spaceId, constructDocumentURI(documentId, "operations"), documentOps);
    return true;
}

module.exports = {
    deleteDocument,
    getDocument,
    getDocumentsMetadata,
    createDocument,
    updateDocument,
    addOperation,
    undoOperation,
    redoOperation
}

